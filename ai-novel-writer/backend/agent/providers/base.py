"""
LLM Provider 抽象基类
"""

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
