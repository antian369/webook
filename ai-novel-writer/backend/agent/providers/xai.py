"""
x.ai Provider 实现
"""

import httpx
from typing import List
from .base import LLMProvider
from ..models import Message


class XAIProvider(LLMProvider):
    """x.ai API 提供商"""
    
    BASE_URL = "https://api.x.ai/v1"
    
    def __init__(self, api_key: str, model: str = ""):
        # 默认使用 grok-2-latest，如果未指定模型
        if not model:
            model = "grok-2-latest"
        super().__init__(api_key, model)
        self.client = httpx.AsyncClient(
            base_url=self.BASE_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=60.0
        )
    
    @property
    def name(self) -> str:
        return "x.ai"
    
    async def chat(self, messages: List[Message], temperature: float = 0.7) -> str:
        """调用 x.ai chat completions API"""
        payload = {
            "model": self.model,
            "messages": [
                {"role": msg.role, "content": msg.content}
                for msg in messages
            ],
            "temperature": temperature,
            "max_tokens": 4096
        }
        
        print(f"Sending request to x.ai: model={self.model}, messages_count={len(messages)}")
        
        try:
            response = await self.client.post(
                "/chat/completions",
                json=payload
            )
            response.raise_for_status()
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            error_detail = e.response.text
            print(f"x.ai API error: {error_detail}")
            raise RuntimeError(f"API error: {error_detail}") from e
    
    def validate_config(self) -> bool:
        """简单验证 API key 格式"""
        return bool(self.api_key and len(self.api_key) > 10)
