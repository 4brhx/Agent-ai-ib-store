"""
GPT-5.4 Agent Core
النواة الرئيسية للإيجنت - إدارة المحادثات والتفاعل مع OpenAI API
"""

import uuid
import time
import json
from typing import Optional, AsyncGenerator
from datetime import datetime

from openai import AsyncOpenAI
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from config import settings
from memory_manager import MemoryManager
from tools_manager import ToolsManager


class Conversation:
    """نموذج المحادثة"""

    def __init__(self, conversation_id: Optional[str] = None, user_id: str = "default"):
        self.id = conversation_id or str(uuid.uuid4())
        self.user_id = user_id
        self.messages: list[dict] = []
        self.created_at = datetime.now().isoformat()
        self.updated_at = datetime.now().isoformat()
        self.metadata: dict = {}
        self.total_tokens_used: int = 0

    def add_message(self, role: str, content: str, **kwargs):
        """إضافة رسالة للمحادثة"""
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            **kwargs
        }
        self.messages.append(message)
        self.updated_at = datetime.now().isoformat()

        # الحفاظ على حد أقصى للرسائل
        max_history = settings.agent.max_conversation_history
        if len(self.messages) > max_history:
            # الاحتفاظ بالرسالة الأولى (system) والأخيرة
            self.messages = [self.messages[0]] + self.messages[-(max_history - 1):]

    def get_messages_for_api(self) -> list[dict]:
        """استخراج الرسائل بتنسيق API"""
        return [{"role": m["role"], "content": m["content"]} for m in self.messages]

    def to_dict(self) -> dict:
        """تحويل المحادثة لقاموس"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "messages": self.messages,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "metadata": self.metadata,
            "total_tokens_used": self.total_tokens_used
        }


class GPT54Agent:
    """
    الإيجنت الرئيسي - GPT-5.4 Professional Agent
    يدير المحادثات، الأدوات، الذاكرة، والتفاعل مع API
    """

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai.api_key)
        self.memory = MemoryManager()
        self.tools_manager = ToolsManager()
        self.conversations: dict[str, Conversation] = {}
        self.model = settings.openai.model
        self.name = settings.agent.name
        self.version = settings.agent.version

        logger.info(f"🤖 {self.name} v{self.version} initialized | Model: {self.model}")

    def create_conversation(self, user_id: str = "default") -> Conversation:
        """إنشاء محادثة جديدة"""
        conv = Conversation(user_id=user_id)
        conv.add_message("system", settings.system_prompt)
        self.conversations[conv.id] = conv
        logger.info(f"📝 New conversation created: {conv.id} for user: {user_id}")
        return conv

    def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        """استرجاع محادثة"""
        return self.conversations.get(conversation_id)

    def delete_conversation(self, conversation_id: str) -> bool:
        """حذف محادثة"""
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]
            logger.info(f"🗑️ Conversation deleted: {conversation_id}")
            return True
        return False

    def list_conversations(self, user_id: Optional[str] = None) -> list[dict]:
        """عرض المحادثات"""
        convs = self.conversations.values()
        if user_id:
            convs = [c for c in convs if c.user_id == user_id]
        return [
            {
                "id": c.id,
                "user_id": c.user_id,
                "messages_count": len(c.messages),
                "created_at": c.created_at,
                "updated_at": c.updated_at,
                "total_tokens_used": c.total_tokens_used
            }
            for c in convs
        ]

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def _call_openai(self, messages: list[dict], tools: Optional[list] = None,
                           stream: bool = False, **kwargs):
        """استدعاء OpenAI API مع إعادة المحاولة"""
        params = {
            "model": self.model,
            "messages": messages,
            "temperature": settings.openai.temperature,
            "max_tokens": settings.openai.max_tokens,
            "stream": stream,
        }

        if tools:
            params["tools"] = tools
            params["tool_choice"] = "auto"

        params.update(kwargs)

        response = await self.client.chat.completions.create(**params)
        return response

    async def chat(self, message: str, conversation_id: Optional[str] = None,
                   user_id: str = "default", use_tools: bool = True) -> dict:
        """
        إرسال رسالة والحصول على رد
        """
        # الحصول أو إنشاء محادثة
        if conversation_id and conversation_id in self.conversations:
            conv = self.conversations[conversation_id]
        else:
            conv = self.create_conversation(user_id)

        # إضافة سياق الذاكرة
        memory_context = self.memory.get_relevant_context(message, user_id)
        if memory_context:
            enhanced_message = f"{message}\n\n[سياق إضافي من الذاكرة]: {memory_context}"
        else:
            enhanced_message = message

        # إضافة رسالة المستخدم
        conv.add_message("user", message)

        # تحضير الأدوات
        tools = self.tools_manager.get_tools_schema() if use_tools else None

        start_time = time.time()

        try:
            # استدعاء API
            messages_for_api = conv.get_messages_for_api()

            # إذا كان هناك سياق ذاكرة، نضيفه كرسالة system إضافية
            if memory_context:
                messages_for_api.insert(-1, {
                    "role": "system",
                    "content": f"[ذاكرة سابقة ذات صلة]: {memory_context}"
                })

            response = await self._call_openai(messages_for_api, tools=tools)

            # معالجة الرد
            assistant_message = response.choices[0].message
            finish_reason = response.choices[0].finish_reason

            # معالجة استدعاءات الأدوات
            if finish_reason == "tool_calls" and assistant_message.tool_calls:
                tool_results = await self._handle_tool_calls(assistant_message.tool_calls)

                # إضافة رسالة المساعد مع استدعاءات الأدوات
                conv.messages.append({
                    "role": "assistant",
                    "content": assistant_message.content or "",
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments
                            }
                        } for tc in assistant_message.tool_calls
                    ],
                    "timestamp": datetime.now().isoformat()
                })

                # إضافة نتائج الأدوات
                for result in tool_results:
                    conv.messages.append({
                        "role": "tool",
                        "tool_call_id": result["tool_call_id"],
                        "content": result["content"],
                        "timestamp": datetime.now().isoformat()
                    })

                # استدعاء API مرة أخرى بنتائج الأدوات
                messages_for_api = conv.get_messages_for_api()
                response = await self._call_openai(messages_for_api)
                assistant_message = response.choices[0].message

            # إضافة رد المساعد
            final_content = assistant_message.content or ""
            conv.add_message("assistant", final_content)

            # تحديث الإحصائيات
            tokens_used = response.usage.total_tokens if response.usage else 0
            conv.total_tokens_used += tokens_used

            # حفظ في الذاكرة
            self.memory.store_interaction(user_id, message, final_content)

            elapsed = time.time() - start_time
            logger.info(f"💬 Response generated in {elapsed:.2f}s | Tokens: {tokens_used}")

            return {
                "conversation_id": conv.id,
                "message": final_content,
                "tokens_used": tokens_used,
                "response_time": round(elapsed, 2),
                "model": self.model,
                "finish_reason": response.choices[0].finish_reason
            }

        except Exception as e:
            logger.error(f"❌ Error in chat: {str(e)}")
            raise

    async def chat_stream(self, message: str, conversation_id: Optional[str] = None,
                          user_id: str = "default") -> AsyncGenerator[str, None]:
        """
        إرسال رسالة والحصول على رد متدفق (Streaming)
        """
        # الحصول أو إنشاء محادثة
        if conversation_id and conversation_id in self.conversations:
            conv = self.conversations[conversation_id]
        else:
            conv = self.create_conversation(user_id)

        conv.add_message("user", message)
        messages_for_api = conv.get_messages_for_api()

        try:
            response = await self._call_openai(messages_for_api, stream=True)

            full_response = ""
            async for chunk in response:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield content

            # حفظ الرد الكامل
            conv.add_message("assistant", full_response)
            self.memory.store_interaction(user_id, message, full_response)

        except Exception as e:
            logger.error(f"❌ Error in stream: {str(e)}")
            yield f"\n\n[خطأ: {str(e)}]"

    async def _handle_tool_calls(self, tool_calls) -> list[dict]:
        """معالجة استدعاءات الأدوات"""
        results = []
        for tool_call in tool_calls:
            function_name = tool_call.function.name
            try:
                arguments = json.loads(tool_call.function.arguments)
            except json.JSONDecodeError:
                arguments = {}

            logger.info(f"🔧 Tool call: {function_name} | Args: {arguments}")

            result = await self.tools_manager.execute_tool(function_name, arguments)

            results.append({
                "tool_call_id": tool_call.id,
                "content": json.dumps(result, ensure_ascii=False)
            })

        return results

    async def analyze_image(self, image_url: str, prompt: str = "حلل هذه الصورة",
                            conversation_id: Optional[str] = None,
                            user_id: str = "default") -> dict:
        """تحليل صورة باستخدام الرؤية"""
        if conversation_id and conversation_id in self.conversations:
            conv = self.conversations[conversation_id]
        else:
            conv = self.create_conversation(user_id)

        messages = conv.get_messages_for_api()
        messages.append({
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": image_url}}
            ]
        })

        response = await self._call_openai(messages)
        content = response.choices[0].message.content or ""

        conv.add_message("user", f"[صورة]: {prompt}")
        conv.add_message("assistant", content)

        return {
            "conversation_id": conv.id,
            "message": content,
            "model": self.model
        }

    def get_stats(self) -> dict:
        """إحصائيات الإيجنت"""
        total_conversations = len(self.conversations)
        total_messages = sum(len(c.messages) for c in self.conversations.values())
        total_tokens = sum(c.total_tokens_used for c in self.conversations.values())

        return {
            "agent_name": self.name,
            "agent_version": self.version,
            "model": self.model,
            "total_conversations": total_conversations,
            "total_messages": total_messages,
            "total_tokens_used": total_tokens,
            "memory_items": self.memory.get_stats(),
            "available_tools": self.tools_manager.list_tools()
        }
