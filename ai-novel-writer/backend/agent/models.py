"""
Agent 数据模型
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class MessageRole(str, Enum):
    """消息角色"""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class Reference(BaseModel):
    """用户引用的文本"""
    source: str                          # 来源文件名
    content: str                         # 引用内容
    line_start: Optional[int] = None     # 起始行号
    line_end: Optional[int] = None       # 结束行号


class Message(BaseModel):
    """对话消息"""
    role: MessageRole
    content: str
    timestamp: datetime = datetime.now()
    references: List[Reference] = []


class ChatRequest(BaseModel):
    """聊天请求"""
    message: str
    session_id: Optional[str] = None
    references: List[Reference] = []
    current_file: Optional[str] = None
    file_content: Optional[str] = None
    command_type: Optional[str] = None  # 快捷指令类型: outline, continue, rewrite, brainstorm


class ChatResponse(BaseModel):
    """聊天响应"""
    message: str
    session_id: str
    timestamp: datetime = datetime.now()


class ChatSession(BaseModel):
    """对话会话"""
    session_id: str
    title: Optional[str] = None  # 用户自定义标题
    messages: List[Message] = []
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()


class AgentContext(BaseModel):
    """Agent 执行上下文"""
    user_message: str
    selected_text: Optional[str] = None
    current_file: Optional[str] = None
    file_content: Optional[str] = None
    project_context: Dict[str, Any] = {}
    history: List[Message] = []
