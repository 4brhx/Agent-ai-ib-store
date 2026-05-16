"""
GPT-5.4 Agent Configuration
تكوين الإيجنت الاحترافي
"""

import os
from pathlib import Path
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()


class OpenAIConfig(BaseModel):
    """إعدادات OpenAI API"""
    api_key: str = Field(default_factory=lambda: os.getenv("OPENAI_API_KEY", ""))
    model: str = Field(default_factory=lambda: os.getenv("OPENAI_MODEL", "gpt-5.4"))
    max_tokens: int = Field(default_factory=lambda: int(os.getenv("OPENAI_MAX_TOKENS", "128000")))
    temperature: float = Field(default_factory=lambda: float(os.getenv("OPENAI_TEMPERATURE", "0.7")))


class AgentConfig(BaseModel):
    """إعدادات الإيجنت"""
    name: str = Field(default_factory=lambda: os.getenv("AGENT_NAME", "GPT-5.4 Pro Agent"))
    version: str = Field(default_factory=lambda: os.getenv("AGENT_VERSION", "1.0.0"))
    language: str = Field(default_factory=lambda: os.getenv("AGENT_LANGUAGE", "ar"))
    max_conversation_history: int = Field(
        default_factory=lambda: int(os.getenv("MAX_CONVERSATION_HISTORY", "50"))
    )
    max_memory_items: int = Field(
        default_factory=lambda: int(os.getenv("MAX_MEMORY_ITEMS", "1000"))
    )


class ServerConfig(BaseModel):
    """إعدادات السيرفر"""
    host: str = Field(default_factory=lambda: os.getenv("HOST", "0.0.0.0"))
    port: int = Field(default_factory=lambda: int(os.getenv("PORT", "8000")))
    debug: bool = Field(default_factory=lambda: os.getenv("DEBUG", "false").lower() == "true")
    cors_origins: str = Field(default_factory=lambda: os.getenv("CORS_ORIGINS", "*"))


class RedisConfig(BaseModel):
    """إعدادات Redis"""
    url: str = Field(default_factory=lambda: os.getenv("REDIS_URL", "redis://localhost:6379/0"))
    use_redis: bool = Field(default_factory=lambda: os.getenv("USE_REDIS", "false").lower() == "true")


class SecurityConfig(BaseModel):
    """إعدادات الأمان"""
    api_secret_key: str = Field(default_factory=lambda: os.getenv("API_SECRET_KEY", "default-secret"))
    rate_limit_per_minute: int = Field(
        default_factory=lambda: int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    )


class Settings(BaseModel):
    """الإعدادات الرئيسية"""
    openai: OpenAIConfig = Field(default_factory=OpenAIConfig)
    agent: AgentConfig = Field(default_factory=AgentConfig)
    server: ServerConfig = Field(default_factory=ServerConfig)
    redis: RedisConfig = Field(default_factory=RedisConfig)
    security: SecurityConfig = Field(default_factory=SecurityConfig)

    # System Prompt
    system_prompt: str = """أنت GPT-5.4 Pro Agent — مساعد ذكاء اصطناعي متقدم ومحترف.

## قدراتك:
- فهم عميق للغة العربية والإنجليزية وجميع اللغات
- تحليل البيانات والمعلومات المعقدة
- كتابة وتحليل الأكواد البرمجية بجميع اللغات
- إنشاء محتوى إبداعي عالي الجودة
- حل المشكلات المعقدة خطوة بخطوة
- البحث والتلخيص وتقديم التوصيات
- التفكير المنطقي والتحليلي المتقدم

## سلوكك:
- دقيق ومفصل في الإجابات
- محترف وودود في الأسلوب
- تقدم أمثلة عملية عند الحاجة
- تطلب التوضيح عند الغموض
- تتعلم من السياق وتتكيف مع احتياجات المستخدم
- تستخدم الأدوات المتاحة لتقديم أفضل إجابة ممكنة

## تعليمات خاصة:
- قدم الإجابات بتنسيق واضح ومنظم
- استخدم العناوين والقوائم عند الحاجة
- قدم الأكواد مع شرح مفصل
- اقترح حلولاً بديلة عند الإمكان
"""


# إنشاء instance واحد من الإعدادات
settings = Settings()
