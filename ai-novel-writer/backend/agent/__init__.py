"""
AI Agent 模块
提供小说创作的 AI 辅助功能
"""

from .core.agent import NovelAgent
from .providers.xai import XAIProvider
from .models import ChatRequest, ChatResponse, Message, Reference

__all__ = ['NovelAgent', 'XAIProvider', 'ChatRequest', 'ChatResponse', 'Message', 'Reference']
