"""
Agent 核心实现
"""

import uuid
import json
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path

from ..models import ChatRequest, ChatResponse, ChatSession, Message, AgentContext
from ..providers.base import LLMProvider


class NovelAgent:
    """小说创作 Agent"""
    
    # 系统提示词模板
    SYSTEM_PROMPT_TEMPLATE = """你是一位专业的小说创作助手，擅长帮助作者构思情节、润色文字、生成内容。

## 当前工作上下文
- 项目：{project_name}
- 当前文件：{current_file}

{file_section}
{reference_section}

## 你的能力
1. 根据上下文续写、改写、扩写内容
2. 提供情节建议和创意灵感
3. 帮助检查逻辑一致性
4. 优化文笔和叙事节奏

## 回复原则
- 保持与原文风格一致
- 提供具体的修改建议，不只是评价
- 如果用户引用了特定段落，重点针对该段落进行优化
- 使用中文回复

请基于以上信息回答用户的问题。"""
    
    def __init__(
        self,
        provider: LLMProvider,
        project_name: str = "未命名项目",
        max_history: int = 20,
        storage_dir: str = "chat_history"
    ):
        self.provider = provider
        self.project_name = project_name
        self.max_history = max_history
        self.sessions: Dict[str, ChatSession] = {}  # 内存存储会话
        
        # 设置存储目录
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(exist_ok=True)
        
        # 启动时加载所有历史会话
        self._load_all_sessions()
        print(f"📂 对话历史存储目录: {self.storage_dir.absolute()}")
    
    def _get_session_file(self, session: ChatSession) -> Path:
        """获取会话对应的 JSON 文件路径，使用日期时间命名"""
        # 使用创建时间和会话ID组合命名，方便人类辨别
        date_str = session.created_at.strftime("%Y%m%d_%H%M%S")
        short_id = session.session_id[:8]
        return self.storage_dir / f"{date_str}_{short_id}.json"
    
    def _save_session(self, session: ChatSession):
        """保存会话到 JSON 文件"""
        file_path = self._get_session_file(session)
        
        # 将会话转换为可序列化的字典
        data = {
            "session_id": session.session_id,
            "title": session.title,
            "created_at": session.created_at.isoformat(),
            "updated_at": session.updated_at.isoformat(),
            "messages": [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat()
                }
                for msg in session.messages
            ]
        }
        
        # 写入 JSON 文件
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"💾 已保存会话 {session.session_id} 到文件")
    
    def _find_session_file(self, session_id: str) -> Optional[Path]:
        """根据 session_id 查找对应的文件（文件名包含日期前缀）"""
        short_id = session_id[:8]
        for file_path in self.storage_dir.glob("*.json"):
            if short_id in file_path.name:
                return file_path
        return None
    
    def _load_session(self, session_id: str) -> Optional[ChatSession]:
        """从 JSON 文件加载会话"""
        file_path = self._find_session_file(session_id)
        
        if not file_path:
            return None
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 重建 ChatSession 对象
            session = ChatSession(
                session_id=data["session_id"],
                title=data.get("title"),  # 可能不存在旧文件中
                created_at=datetime.fromisoformat(data["created_at"]),
                updated_at=datetime.fromisoformat(data["updated_at"]),
                messages=[
                    Message(
                        role=msg["role"],
                        content=msg["content"],
                        timestamp=datetime.fromisoformat(msg["timestamp"])
                    )
                    for msg in data["messages"]
                ]
            )
            
            print(f"📖 已从文件加载会话 {session_id}")
            return session
        except Exception as e:
            print(f"⚠️ 加载会话 {session_id} 失败: {e}")
            return None
    
    def _load_all_sessions(self):
        """启动时加载所有历史会话"""
        if not self.storage_dir.exists():
            return
        
        count = 0
        for file_path in self.storage_dir.glob("*.json"):
            session_id = file_path.stem
            session = self._load_session(session_id)
            if session:
                self.sessions[session_id] = session
                count += 1
        
        if count > 0:
            print(f"✅ 已加载 {count} 个历史会话")
    
    def _build_system_prompt(
        self,
        current_file: Optional[str] = None,
        file_content: Optional[str] = None,
        references: List = []
    ) -> str:
        """构建系统提示词"""
        # 文件内容部分
        file_section = ""
        if current_file and file_content:
            # 限制长度，避免 token 超限
            truncated_content = file_content[:3000] + "..." if len(file_content) > 3000 else file_content
            file_section = f"""
## 当前文件内容
```
{truncated_content}
```
"""
        
        # 引用部分
        reference_section = ""
        if references:
            ref_texts = []
            for i, ref in enumerate(references, 1):
                ref_texts.append(f"""[引用 {i}] 来自：{ref.source}
{ref.content}
""")
            reference_section = "## 用户引用的内容\n" + "\n".join(ref_texts)
        
        return self.SYSTEM_PROMPT_TEMPLATE.format(
            project_name=self.project_name,
            current_file=current_file or "无",
            file_section=file_section,
            reference_section=reference_section
        )
    
    async def chat(self, request: ChatRequest) -> ChatResponse:
        """
        处理用户消息，返回 AI 回复
        
        Args:
            request: 包含用户消息、引用、当前文件等
            
        Returns:
            AI 的回复
        """
        # 获取或创建会话
        session_id = request.session_id or str(uuid.uuid4())
        session = self._get_or_create_session(session_id)
        
        # 构建系统提示词
        system_prompt = self._build_system_prompt(
            current_file=request.current_file,
            file_content=request.file_content,
            references=request.references
        )
        
        # 构建消息列表
        messages = []
        messages.append(Message(role="system", content=system_prompt))
        
        # 添加历史对话（保留最近 N 轮）
        for msg in session.messages[-self.max_history:]:
            messages.append(msg)
        
        # 添加当前用户消息
        messages.append(Message(role="user", content=request.message))
        
        # 调用 LLM
        try:
            response_text = await self.provider.chat(messages)
        except Exception as e:
            raise RuntimeError(f"AI 调用失败: {str(e)}")
        
        # 保存到历史
        session.messages.append(Message(role="user", content=request.message))
        session.messages.append(Message(role="assistant", content=response_text))
        session.updated_at = datetime.now()
        
        # 清理旧历史
        if len(session.messages) > self.max_history * 2:
            session.messages = session.messages[-self.max_history * 2:]
        
        # 保存到 JSON 文件
        self._save_session(session)
        
        return ChatResponse(
            message=response_text,
            session_id=session_id,
            timestamp=datetime.now()
        )
    
    def _get_or_create_session(self, session_id: str) -> ChatSession:
        """获取或创建会话"""
        if session_id not in self.sessions:
            # 尝试从文件加载
            session = self._load_session(session_id)
            if session:
                self.sessions[session_id] = session
            else:
                # 创建新会话
                self.sessions[session_id] = ChatSession(session_id=session_id)
        return self.sessions[session_id]
    
    def get_history(self, session_id: str) -> List[Message]:
        """获取会话历史"""
        session = self.sessions.get(session_id)
        return session.messages if session else []
    
    def clear_session(self, session_id: str):
        """清空会话"""
        if session_id in self.sessions:
            del self.sessions[session_id]
        
        # 删除对应的 JSON 文件
        file_path = self._find_session_file(session_id)
        if file_path and file_path.exists():
            file_path.unlink()
            print(f"🗑️  已删除会话文件 {file_path.name}")
    
    def list_all_sessions(self) -> List[str]:
        """列出所有会话 ID"""
        return list(self.sessions.keys())

    def list_sessions_info(self) -> List[Dict]:
        """列出所有会话的信息（包含标题）"""
        result = []
        for session_id, session in self.sessions.items():
            result.append({
                "session_id": session_id,
                "title": session.title,
                "created_at": session.created_at.isoformat(),
                "updated_at": session.updated_at.isoformat(),
                "message_count": len(session.messages)
            })
        return result

    def update_session_title(self, session_id: str, title: str):
        """更新会话标题"""
        session = self.sessions.get(session_id)
        if session:
            session.title = title
            session.updated_at = datetime.now()
            self._save_session(session)
        else:
            raise ValueError(f"Session {session_id} not found")

    def delete_session(self, session_id: str):
        """删除会话"""
        if session_id in self.sessions:
            del self.sessions[session_id]
        
        file_path = self._find_session_file(session_id)
        if file_path and file_path.exists():
            file_path.unlink()
            print(f"🗑️  已删除会话文件 {file_path.name}")
