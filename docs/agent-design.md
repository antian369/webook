# Agent 系统设计方案

## 1. 设计原则与关键决策

### 1.1 是否引入 Agent 框架？
**决策：不引入重量级框架（LangChain/AutoGen）**

理由：
1. **简单可控**：当前需求明确，自己实现更清晰
2. **性能考虑**：避免框架 overhead，直接调用 API
3. **学习成本**：团队无需学习复杂框架
4. **定制化**：根据小说创作场景深度定制

**替代方案**：实现轻量级 Agent 内核，参考框架设计思想但保持精简。

### 1.2 知识库检索如何实现？
**决策：当前迭代不做，后续用 Whoosh**

| 阶段 | 方案 | 原因 |
|------|------|------|
| 阶段 1（当前） | 只传递当前文件内容 | 简单直接，满足基础需求 |
| 阶段 2+ | Whoosh（纯 Python） | 轻量级，无需外部服务，支持中文 |
| 阶段 3+ | 向量检索（chromadb） | 语义搜索，理解上下文 |

**为什么不用 Elasticsearch？**
- 太重，需要额外部署
- Whoosh 足够支撑几万文档
- 纯 Python，零依赖

### 1.3 是否使用 ReAct / CoT / 迭代推理？
**决策：初期不用，保持简单直接调用**

**理由：**
- 小说创作任务相对明确，单次调用质量足够
- ReAct 增加延迟和 Token 消耗
- 实现复杂，调试困难
- 不是工具调用场景，不需要 Thought → Action → Observation 循环

**替代方案：**
- 高质量系统提示词
- 充分的上下文信息（文件内容、引用、历史）
- 后续如效果不佳，再考虑简单迭代（生成→检查→优化）

### 1.4 AI 生成内容如何保存？
**决策：基于选中文本范围替换**

**方案对比：**

| 方案 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| 标记点插入 | 精确控制位置 | 需要预先放置标记 | ❌ |
| **选中文本替换** | **直观、灵活** | **需要记录位置** | **✅** |
| 章节分块 | 粒度细 | 实现复杂 | ❌ |

**实现方式：**
```python
# 前端记录选中文本范围
selection = {
    "start": textarea.selectionStart,
    "end": textarea.selectionEnd,
    "content": selectedText
}

# AI 生成后，替换选中部分
newContent = content[:start] + aiGenerated + content[end:]
```

**交互流程：**
1. 用户在编辑器选中文本
2. 按 Ctrl+I 添加到对话引用
3. 用户发送请求（如"改写得更有张力"）
4. AI 生成新内容
5. 用户点击"应用"按钮
6. 替换编辑器中选中的内容
7. 标记为未保存状态

---

## 2. 多 Agent 架构设计

### 2.1 Agent 类型规划

基于用户设想，设计以下 Agent：

| Agent | 职责 | 触发方式 | 系统提示词特点 |
|-------|------|----------|----------------|
| **OutlineAgent** | 大纲生成、章节规划、结构调整 | 快捷按钮"生成大纲" | 擅长结构化思考 |
| **SceneAgent** | 场景描写、环境渲染、氛围营造 | 快捷按钮"生成场景" | 擅长感官描写 |
| **ContentAgent** | 正文续写、对话编写、动作描写 | 快捷按钮"续写" | 擅长叙事节奏 |
| **PolishAgent** | 润色优化、改写、扩写、精简 | 快捷按钮"改写/扩写/润色" | 擅长语言优化 |
| **LogicAgent** | 逻辑检查、一致性校验、伏笔管理 | 快捷按钮"检查逻辑" | 擅长分析推理 |
| **BrainstormAgent** | 头脑风暴、创意发散、灵感生成 | 快捷按钮"头脑风暴" | 擅长创意发散 |

### 2.2 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                         Agent System                             │
├─────────────────────────────────────────────────────────────────┤
│  Agent Router（路由器）                                          │
│  ├── 职责：根据用户意图选择 Agent                                 │
│  ├── 方式1：用户手动选择（快捷按钮）                              │
│  ├── 方式2：意图识别（NLU 分类）                                  │
│  └── 方式3：内容匹配（根据选中文本类型）                          │
├─────────────────────────────────────────────────────────────────┤
│  Base Agent（基础 Agent 抽象）                                   │
│  ├── system_prompt：角色定义                                      │
│  ├── tools：工具集                                                │
│  ├── memory：短期记忆（当前会话）                                 │
│  └── llm：LLM 调用                                                │
├─────────────────────────────────────────────────────────────────┤
│  Specialized Agents（专业 Agent）                                │
│  ├── OutlineAgent extends BaseAgent                              │
│  ├── SceneAgent extends BaseAgent                                │
│  ├── ContentAgent extends BaseAgent                              │
│  ├── PolishAgent extends BaseAgent                               │
│  ├── LogicAgent extends BaseAgent                                │
│  └── BrainstormAgent extends BaseAgent                           │
├─────────────────────────────────────────────────────────────────┤
│  Knowledge Base（知识库）                                        │
│  ├── 角色库（character_db）                                       │
│  ├── 世界设定库（world_db）                                       │
│  ├── 已完成章节（chapter_db）                                     │
│  └── 索引系统（indexer）                                          │
├─────────────────────────────────────────────────────────────────┤
│  Tools（工具集）                                                  │
│  ├── FileTool：读取/写入文件                                      │
│  ├── SearchTool：搜索知识库                                       │
│  └── MemoryTool：存取长期记忆                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Agent 基类设计

```python
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class AgentContext:
    """Agent 执行上下文"""
    user_message: str
    selected_text: Optional[str] = None
    current_file: Optional[str] = None
    file_content: Optional[str] = None
    project_context: Dict[str, Any] = None
    history: List[Dict] = None

class BaseAgent(ABC):
    """Agent 基类"""
    
    def __init__(
        self,
        name: str,
        description: str,
        llm_provider: LLMProvider,
        knowledge_base: KnowledgeBase = None
    ):
        self.name = name
        self.description = description
        self.llm = llm_provider
        self.kb = knowledge_base
        self.tools: List[Tool] = []
    
    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """Agent 的系统提示词"""
        pass
    
    def add_tool(self, tool: Tool):
        """添加工具"""
        self.tools.append(tool)
    
    async def execute(self, context: AgentContext) -> str:
        """
        执行 Agent 任务
        
        流程：
        1. 构建系统提示词
        2. 检索相关知识
        3. 组装消息
        4. 调用 LLM
        5. 返回结果
        """
        # 1. 检索相关知识
        relevant_knowledge = await self._retrieve_knowledge(context)
        
        # 2. 构建完整提示词
        system_msg = self._build_system_message(context, relevant_knowledge)
        
        # 3. 组装消息列表
        messages = self._build_messages(system_msg, context)
        
        # 4. 调用 LLM
        response = await self.llm.chat(messages)
        
        return response
    
    async def _retrieve_knowledge(self, context: AgentContext) -> Dict[str, Any]:
        """检索相关知识"""
        if not self.kb:
            return {}
        
        # 根据当前文件和选中文本检索相关知识
        knowledge = {}
        
        # 检索相关角色
        if context.current_file:
            knowledge['characters'] = await self.kb.search_characters(
                context.user_message + (context.selected_text or "")
            )
        
        # 检索相关世界设定
        knowledge['world'] = await self.kb.search_world(
            context.user_message + (context.selected_text or "")
        )
        
        # 检索相关历史章节
        knowledge['chapters'] = await self.kb.search_chapters(
            context.user_message + (context.selected_text or ""),
            top_k=3
        )
        
        return knowledge
    
    def _build_system_message(
        self,
        context: AgentContext,
        knowledge: Dict[str, Any]
    ) -> str:
        """构建系统消息"""
        base_prompt = self.system_prompt
        
        # 添加知识库信息
        knowledge_prompt = self._format_knowledge(knowledge)
        
        # 添加当前文件信息
        file_prompt = ""
        if context.current_file and context.file_content:
            file_prompt = f"""
当前编辑文件：{context.current_file}
文件内容：
```
{context.file_content[:2000]}  # 限制长度
```
"""
        
        return f"{base_prompt}\n\n{knowledge_prompt}\n\n{file_prompt}"
    
    def _format_knowledge(self, knowledge: Dict[str, Any]) -> str:
        """格式化知识为提示词"""
        parts = []
        
        if knowledge.get('characters'):
            parts.append("## 相关角色\n" + "\n".join(
                f"- {c['name']}: {c['description'][:100]}"
                for c in knowledge['characters']
            ))
        
        if knowledge.get('world'):
            parts.append("## 相关设定\n" + "\n".join(
                f"- {w['title']}: {w['content'][:100]}"
                for w in knowledge['world']
            ))
        
        if knowledge.get('chapters'):
            parts.append("## 相关历史章节\n" + "\n".join(
                f"- {c['title']}"
                for c in knowledge['chapters']
            ))
        
        return "\n\n".join(parts)
    
    def _build_messages(
        self,
        system_msg: str,
        context: AgentContext
    ) -> List[Dict[str, str]]:
        """构建消息列表"""
        messages = [{"role": "system", "content": system_msg}]
        
        # 添加历史对话
        if context.history:
            for msg in context.history[-10:]:  # 最近 10 轮
                messages.append(msg)
        
        # 添加当前用户消息（包含引用）
        user_content = context.user_message
        if context.selected_text:
            user_content += f"\n\n[用户引用的内容]\n{context.selected_text}"
        
        messages.append({"role": "user", "content": user_content})
        
        return messages
```

### 2.4 具体 Agent 实现示例

```python
class OutlineAgent(BaseAgent):
    """大纲生成 Agent"""
    
    @property
    def system_prompt(self) -> str:
        return """你是一位专业的小说大纲规划师。

## 你的职责
1. 分析故事主线，设计合理的章节结构
2. 确保情节起伏有致，节奏把控得当
3. 安排伏笔和回收时机
4. 平衡各角色的戏份

## 输出格式
- 使用 Markdown 格式
- 清晰的层级结构
- 每章包含：目标、关键事件、情绪基调

## 原则
- 大纲要具体可操作，不能过于笼统
- 考虑前后逻辑连贯性
- 适当留白给作者发挥空间"""

class PolishAgent(BaseAgent):
    """润色优化 Agent"""
    
    @property
    def system_prompt(self) -> str:
        return """你是一位资深的小说编辑，擅长文字润色。

## 你的职责
1. 改善文笔，提升画面感和代入感
2. 优化对话，使其更自然生动
3. 调整节奏，张弛有度
4. 精炼语言，删除冗余

## 润色维度
- 感官描写（视、听、嗅、味、触）
- 心理刻画（情绪变化、内心独白）
- 动作细节（精准动词、连贯性）
- 环境渲染（氛围营造、意象选择）

## 原则
- 保持作者原有风格
- 提供修改理由
- 可解释每个修改建议"""
```

---

## 3. Agent Router（路由器）设计

### 3.1 路由策略

```python
class AgentRouter:
    """Agent 路由器"""
    
    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.intent_patterns = {
            "outline": ["大纲", "结构", "规划", "章节安排"],
            "scene": ["场景", "环境", "描写", "氛围"],
            "content": ["续写", "正文", "写下去", "接下来"],
            "polish": ["润色", "改写", "优化", "扩写", "精简"],
            "logic": ["逻辑", "检查", "bug", "矛盾"],
            "brainstorm": ["灵感", "想法", "创意", "头脑风暴"]
        }
    
    def register(self, name: str, agent: BaseAgent):
        """注册 Agent"""
        self.agents[name] = agent
    
    async def route(
        self,
        context: AgentContext,
        explicit_agent: Optional[str] = None
    ) -> BaseAgent:
        """
        路由到合适的 Agent
        
        优先级：
        1. 用户显式指定（explicit_agent）
        2. 意图识别（关键词匹配）
        3. 根据选中文本类型判断
        4. 默认使用 ContentAgent
        """
        # 1. 显式指定
        if explicit_agent and explicit_agent in self.agents:
            return self.agents[explicit_agent]
        
        # 2. 意图识别
        user_input = context.user_message.lower()
        for intent, keywords in self.intent_patterns.items():
            if any(kw in user_input for kw in keywords):
                return self.agents.get(intent, self.agents.get("content"))
        
        # 3. 根据选中文本判断
        if context.selected_text:
            text_type = self._analyze_text_type(context.selected_text)
            if text_type == "dialogue":
                return self.agents.get("polish")  # 对话优化
            elif text_type == "description":
                return self.agents.get("scene")   # 场景描写
        
        # 4. 默认
        return self.agents.get("content", list(self.agents.values())[0])
    
    def _analyze_text_type(self, text: str) -> str:
        """分析文本类型"""
        # 简单启发式判断
        if "\"" in text or "「" in text:
            return "dialogue"
        elif any(w in text for w in ["山", "水", "风", "雨", "光", "影", "色", "声"]):
            return "description"
        return "narrative"
```

### 3.2 API 设计

```python
@router.post("/agent/execute")
async def execute_agent(
    message: str,
    agent_type: Optional[str] = None,  # 显式指定 Agent
    references: List[Reference] = [],
    current_file: Optional[str] = None,
    session_id: Optional[str] = None
):
    """执行 Agent"""
    
    # 构建上下文
    context = AgentContext(
        user_message=message,
        selected_text=references[0].content if references else None,
        current_file=current_file,
        file_content=await load_file(current_file) if current_file else None,
        history=get_history(session_id)
    )
    
    # 路由到合适的 Agent
    agent = await router.route(context, explicit_agent=agent_type)
    
    # 执行
    response = await agent.execute(context)
    
    return {
        "message": response,
        "agent_used": agent.name,
        "session_id": session_id
    }
```

---

## 4. 知识库管理设计

### 4.1 知识库架构

```python
class KnowledgeBase:
    """知识库管理"""
    
    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.index = {}  # 简单倒排索引
        self.characters = {}
        self.world_settings = {}
        self.chapters = {}
    
    async def build_index(self):
        """构建知识库索引"""
        # 扫描角色目录
        char_dir = self.project_path / "创作区" / "角色"
        if char_dir.exists():
            for file in char_dir.glob("*.md"):
                content = file.read_text()
                self.characters[file.stem] = self._parse_character(content)
                self._update_index(file.stem, content)
        
        # 扫描世界设定
        world_dir = self.project_path / "创作区" / "世界背景"
        if world_dir.exists():
            for file in world_dir.glob("*.md"):
                content = file.read_text()
                self.world_settings[file.stem] = content
                self._update_index(file.stem, content)
        
        # 扫描已完成章节
        chapters_dir = self.project_path / "创作区" / "正文"
        if chapters_dir.exists():
            for volume in chapters_dir.iterdir():
                if volume.is_dir():
                    for chapter_file in volume.glob("**/正文.md"):
                        content = chapter_file.read_text()
                        chapter_name = chapter_file.parent.name
                        self.chapters[chapter_name] = {
                            "path": str(chapter_file),
                            "content_preview": content[:500],
                            "word_count": len(content)
                        }
                        self._update_index(chapter_name, content)
    
    def _update_index(self, key: str, content: str):
        """更新倒排索引"""
        # 简单分词（中文按字，英文按词）
        words = self._tokenize(content)
        for word in words:
            if word not in self.index:
                self.index[word] = set()
            self.index[word].add(key)
    
    def _tokenize(self, text: str) -> List[str]:
        """简单分词"""
        # 中文：每 2-4 个字作为一个 token
        # 英文：按空格分词
        import re
        # 提取中文词汇（简单实现）
        chinese_chars = re.findall(r'[\u4e00-\u9fff]{2,4}', text)
        # 提取英文单词
        english_words = re.findall(r'\b[a-zA-Z]{2,}\b', text.lower())
        return chinese_chars + english_words
    
    async def search(
        self,
        query: str,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        搜索知识库
        
        使用简单关键词匹配，后续可升级为向量检索
        """
        query_tokens = self._tokenize(query)
        
        # 计算相关性（共现次数）
        scores = {}
        for token in query_tokens:
            if token in self.index:
                for key in self.index[token]:
                    scores[key] = scores.get(key, 0) + 1
        
        # 排序返回
        sorted_keys = sorted(scores.keys(), key=lambda k: scores[k], reverse=True)
        
        results = []
        for key in sorted_keys[:top_k]:
            if key in self.characters:
                results.append({"type": "character", "data": self.characters[key]})
            elif key in self.world_settings:
                results.append({"type": "world", "data": self.world_settings[key]})
            elif key in self.chapters:
                results.append({"type": "chapter", "data": self.chapters[key]})
        
        return results
```

### 4.2 章节内容检索策略

```python
class ChapterRetriever:
    """章节内容检索器"""
    
    def __init__(self, knowledge_base: KnowledgeBase):
        self.kb = knowledge_base
    
    async def retrieve_relevant_chapters(
        self,
        query: str,
        current_chapter: Optional[str] = None,
        top_k: int = 3
    ) -> List[Dict]:
        """
        检索相关历史章节
        
        策略：
        1. 基于关键词匹配
        2. 优先返回前序章节（时间线连续性）
        3. 包含相似场景或角色的章节
        """
        # 基础搜索
        results = await self.kb.search(query, top_k=top_k * 2)
        
        # 过滤章节
        chapters = [r for r in results if r["type"] == "chapter"]
        
        # 按时间线排序（如果章节名有规律）
        # 例如：第一章、第二章 -> 按数字排序
        chapters.sort(key=lambda x: self._extract_chapter_number(x["data"]["path"]))
        
        # 如果当前章节已知，优先返回之前的章节
        if current_chapter:
            current_num = self._extract_chapter_number(current_chapter)
            chapters = [c for c in chapters 
                       if self._extract_chapter_number(c["data"]["path"]) < current_num]
        
        return chapters[:top_k]
    
    def _extract_chapter_number(self, path: str) -> int:
        """从路径提取章节号"""
        import re
        match = re.search(r'第(\d+)章', path)
        return int(match.group(1)) if match else 0
```

---

## 5. 迭代实施建议

### 阶段 1：基础能力（当前迭代）
**目标**：建立可运行的 Agent 架构

**实现范围**：
- BaseAgent 抽象类
- 一个通用 Agent（先不拆分多 Agent）
- 基础对话功能
- Ctrl+I 引用
- 简单上下文（当前文件）

**不实现**：
- 多 Agent 路由
- 知识库检索
- 复杂工具调用

### 阶段 2：专业化（迭代 4）
**目标**：拆分多 Agent，提升专业性

**实现范围**：
- Agent Router
- 6 个专业 Agent
- 知识库管理
- 章节内容检索

### 阶段 3：高级功能（迭代 5+）
**目标**：增强 Agent 能力

**实现范围**：
- 长期记忆
- 工具调用（文件操作）
- 协作模式（多 Agent 协作）
- 向量检索

---

## 6. 总结

### 架构亮点

1. **分层设计**：Router → Agent → LLM，职责清晰
2. **可扩展**：新增 Agent 只需继承 BaseAgent
3. **知识驱动**：知识库自动索引，按需检索
4. **渐进实现**：先通用后专业，逐步完善

### 关键技术决策

1. **不引入框架**：自己实现，轻量可控
2. **后端代理**：统一入口，便于扩展
3. **简单检索**：先关键词，后向量
4. **分阶段实现**：降低复杂度，快速验证

### 下一步行动

**阶段 1（当前迭代）任务**：
1. 创建 `agent/` 目录结构
2. 实现 BaseAgent 和 LLM Provider
3. 实现一个通用 Agent（AllInOneAgent）
4. API 端点 `/api/agent/chat`
5. 前端基础对话界面
6. Ctrl+I 引用功能

**是否需要调整这个设计方案？**


---

## 6. 基础实现代码（阶段 1）


### 2.1 数据模型 (models.py)

```python
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

class MessageRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"

class Reference(BaseModel):
    """用户引用的文本"""
    source: str           # 来源文件名
    content: str          # 引用内容
    line_start: Optional[int] = None
    line_end: Optional[int] = None

class Message(BaseModel):
    """对话消息"""
    role: MessageRole
    content: str
    timestamp: datetime = datetime.now()

class ChatRequest(BaseModel):
    """聊天请求"""
    message: str
    session_id: Optional[str] = None
    references: List[Reference] = []
    current_file: Optional[str] = None
    file_content: Optional[str] = None

class ChatResponse(BaseModel):
    """聊天响应"""
    message: str
    session_id: str
    timestamp: datetime = datetime.now()

class ChatSession(BaseModel):
    """对话会话"""
    session_id: str
    messages: List[Message] = []
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()
```

### 2.2 Provider 抽象基类 (providers/base.py)

```python
from abc import ABC, abstractmethod
from typing import List
from ..models import Message

class LLMProvider(ABC):
    """LLM 提供商抽象基类"""
    
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model
    
    @abstractmethod
    async def chat(self, messages: List[Message]) -> str:
        """
        发送消息列表到 LLM，返回回复内容
        
        Args:
            messages: 消息列表，包含 system、user、assistant
            
        Returns:
            AI 的回复文本
        """
        pass
    
    @abstractmethod
    def validate_config(self) -> bool:
        """验证配置是否有效"""
        pass
    
    @property
    @abstractmethod
    def name(self) -> str:
        """提供商名称"""
        pass
```

### 2.3 x.ai Provider 实现 (providers/xai.py)

```python
import httpx
from typing import List
from .base import LLMProvider
from ..models import Message

class XAIProvider(LLMProvider):
    """x.ai API 提供商"""
    
    BASE_URL = "https://api.x.ai/v1"
    
    def __init__(self, api_key: str, model: str = "grok-beta"):
        super().__init__(api_key, model)
        self.client = httpx.AsyncClient(
            base_url=self.BASE_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=60.0
        )
    
    @property
    def name(self) -> str:
        return "x.ai"
    
    async def chat(self, messages: List[Message]) -> str:
        """调用 x.ai chat completions API"""
        payload = {
            "model": self.model,
            "messages": [
                {"role": msg.role, "content": msg.content}
                for msg in messages
            ],
            "temperature": 0.7,
            "max_tokens": 4096
        }
        
        response = await self.client.post(
            "/chat/completions",
            json=payload
        )
        response.raise_for_status()
        
        data = response.json()
        return data["choices"][0]["message"]["content"]
    
    def validate_config(self) -> bool:
        """简单验证 API key 格式"""
        return bool(self.api_key and len(self.api_key) > 10)
```

### 2.4 上下文构建器 (core/context.py)

```python
from typing import List, Optional
from ..models import Message, Reference

class ContextBuilder:
    """构建发送给 LLM 的完整上下文"""
    
    SYSTEM_PROMPT_TEMPLATE = """你是一位专业的小说创作助手，擅长帮助作者构思情节、润色文字、生成内容。

## 当前工作上下文
- 项目：{project_name}
- 当前文件：{current_file}
- 文件类型：{file_type}

## 你的能力
1. 根据上下文续写、改写、扩写内容
2. 提供情节建议和创意灵感
3. 帮助检查逻辑一致性
4. 优化文笔和叙事节奏

## 回复原则
- 保持与原文风格一致
- 提供具体的修改建议，不只是评价
- 如果用户引用了特定段落，重点针对该段落进行优化

{file_section}
{reference_section}

请基于以上信息回答用户的问题。"""
    
    def __init__(self, project_name: str = "未命名项目"):
        self.project_name = project_name
    
    def build_system_prompt(
        self,
        current_file: Optional[str] = None,
        file_content: Optional[str] = None,
        references: List[Reference] = []
    ) -> str:
        """构建系统提示词"""
        
        # 文件内容部分
        file_section = ""
        if current_file and file_content:
            file_type = "Markdown" if current_file.endswith('.md') else "Text"
            file_section = f"""
## 当前文件内容
文件名：{current_file}
类型：{file_type}

```
{file_content[:3000]}  # 限制长度，避免 token 超限
```
"""
        
        # 引用部分
        reference_section = ""
        if references:
            ref_texts = []
            for i, ref in enumerate(references, 1):
                ref_texts.append(f"""
[引用 {i}] 来自：{ref.source}
{ref.content}
""")
            reference_section = "## 用户引用的内容\n" + "\n".join(ref_texts)
        
        return self.SYSTEM_PROMPT_TEMPLATE.format(
            project_name=self.project_name,
            current_file=current_file or "无",
            file_type="Markdown" if current_file and current_file.endswith('.md') else "Text",
            file_section=file_section,
            reference_section=reference_section
        )
    
    def build_messages(
        self,
        user_message: str,
        history: List[Message],
        system_prompt: str
    ) -> List[Message]:
        """构建完整的消息列表"""
        messages = []
        
        # 系统提示词
        messages.append(Message(role="system", content=system_prompt))
        
        # 历史对话（保留最近 10 轮）
        for msg in history[-20:]:  # 10 轮 = 20 条消息
            messages.append(msg)
        
        # 当前用户消息
        messages.append(Message(role="user", content=user_message))
        
        return messages
```

### 2.5 Agent 主类 (core/agent.py)

```python
import uuid
from typing import Dict, List, Optional
from datetime import datetime
from .context import ContextBuilder
from .memory import MemoryManager  # 后续实现
from ..providers.base import LLMProvider
from ..models import ChatRequest, ChatResponse, ChatSession, Message

class NovelAgent:
    """小说创作 Agent"""
    
    def __init__(
        self,
        provider: LLMProvider,
        project_name: str = "未命名项目",
        max_history: int = 20
    ):
        self.provider = provider
        self.context_builder = ContextBuilder(project_name)
        self.max_history = max_history
        self.sessions: Dict[str, ChatSession] = {}  # 内存存储会话
    
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
        system_prompt = self.context_builder.build_system_prompt(
            current_file=request.current_file,
            file_content=request.file_content,
            references=request.references
        )
        
        # 构建消息列表
        messages = self.context_builder.build_messages(
            user_message=request.message,
            history=session.messages,
            system_prompt=system_prompt
        )
        
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
        if len(session.messages) > self.max_history:
            session.messages = session.messages[-self.max_history:]
        
        return ChatResponse(
            message=response_text,
            session_id=session_id,
            timestamp=datetime.now()
        )
    
    def _get_or_create_session(self, session_id: str) -> ChatSession:
        """获取或创建会话"""
        if session_id not in self.sessions:
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
```

## 3. API 端点设计

```python
from fastapi import APIRouter, HTTPException
from typing import Optional

router = APIRouter(prefix="/api/agent", tags=["agent"])

# 全局 Agent 实例（在应用启动时初始化）
agent: Optional[NovelAgent] = None

def init_agent(provider: LLMProvider, project_name: str):
    """初始化 Agent"""
    global agent
    agent = NovelAgent(provider=provider, project_name=project_name)

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """发送消息给 AI"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent 未初始化")
    
    try:
        return await agent.chat(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/history")
async def get_history(session_id: str):
    """获取对话历史"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent 未初始化")
    
    messages = agent.get_history(session_id)
    return {
        "session_id": session_id,
        "messages": [{"role": m.role, "content": m.content} for m in messages]
    }

@router.post("/chat/clear")
async def clear_session(session_id: str):
    """清空对话历史"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent 未初始化")
    
    agent.clear_session(session_id)
    return {"message": "会话已清空"}
```

## 4. 配置管理 (config.py)

```python
import os
from typing import Optional
from pydantic import BaseModel

class AgentConfig(BaseModel):
    """Agent 配置"""
    xai_api_key: Optional[str] = None
    xai_model: str = "grok-beta"
    project_name: str = "未命名项目"
    max_history: int = 20
    
    @classmethod
    def from_env(cls) -> "AgentConfig":
        """从环境变量加载配置"""
        return cls(
            xai_api_key=os.getenv("XAI_API_KEY"),
            xai_model=os.getenv("XAI_MODEL", "grok-beta"),
            project_name=os.getenv("PROJECT_NAME", "未命名项目"),
            max_history=int(os.getenv("MAX_HISTORY", "20"))
        )
    
    def validate(self) -> bool:
        """验证配置是否有效"""
        return bool(self.xai_api_key)
```

## 5. 启动初始化

```python
# main.py 中添加
from agent.config import AgentConfig
from agent.providers.xai import XAIProvider
from agent.api import router as agent_router, init_agent

# 加载配置
agent_config = AgentConfig.from_env()

if agent_config.validate():
    # 初始化 Provider
    provider = XAIProvider(
        api_key=agent_config.xai_api_key,
        model=agent_config.xai_model
    )
    
    # 初始化 Agent
    init_agent(provider, agent_config.project_name)
    print("✅ AI Agent 已初始化")
else:
    print("⚠️  AI Agent 未配置（缺少 XAI_API_KEY）")

# 注册路由
app.include_router(agent_router)
```

## 6. 扩展性设计

### 6.1 添加新的 Provider

```python
# providers/openai.py
from .base import LLMProvider

class OpenAIProvider(LLMProvider):
    """OpenAI Provider（预留）"""
    
    BASE_URL = "https://api.openai.com/v1"
    
    async def chat(self, messages: List[Message]) -> str:
        # 实现 OpenAI API 调用
        pass
    
    def validate_config(self) -> bool:
        pass
    
    @property
    def name(self) -> str:
        return "OpenAI"
```

### 6.2 添加工具（Tools）

```python
# tools/base.py
from abc import ABC, abstractmethod

class Tool(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass
    
    @abstractmethod
    async def execute(self, **kwargs) -> str:
        pass

# tools/file_tool.py
class FileReadTool(Tool):
    """文件读取工具"""
    
    @property
    def name(self) -> str:
        return "read_file"
    
    async def execute(self, path: str) -> str:
        # 读取文件内容
        pass
```

## 7. 使用示例

```python
# 后端使用
from agent.core.agent import NovelAgent
from agent.providers.xai import XAIProvider

# 初始化
provider = XAIProvider(api_key="your-key")
agent = NovelAgent(provider, project_name="我的小说")

# 对话
request = ChatRequest(
    message="帮我把这段改写得更有张力",
    current_file="chapter1.md",
    file_content="林凡深吸一口气...",
    references=[
        Reference(source="chapter1.md", content="林凡深吸一口气...")
    ]
)

response = await agent.chat(request)
print(response.message)
```

## 8. 前端调用示例

```typescript
// 发送消息
const sendMessage = async (message: string, references: Reference[]) => {
  const response = await fetch('/api/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      references,
      current_file: activeFile?.path,
      file_content: currentContent,
      session_id: currentSessionId
    })
  });
  
  const data = await response.json();
  return data.message;
};
```

---

## 总结

这个设计方案的特点：

1. **分层架构**：Provider → Agent → API，每层职责清晰
2. **可扩展**：轻松添加新的 LLM Provider 和 Tools
3. **上下文丰富**：自动包含文件内容、引用、历史对话
4. **配置简单**：仅需环境变量，无需复杂配置
5. **非流式优先**：先实现基础功能，SSE 流式后续添加

**是否确认这个设计方案？确认后开始实现。**
