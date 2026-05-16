"""
GPT-5.4 Agent Tools Manager
نظام إدارة الأدوات والوظائف - Function Calling
"""

import json
import math
import httpx
from datetime import datetime
from typing import Any, Optional, Callable

from loguru import logger


class Tool:
    """نموذج الأداة"""

    def __init__(self, name: str, description: str, parameters: dict,
                 handler: Callable, category: str = "general"):
        self.name = name
        self.description = description
        self.parameters = parameters
        self.handler = handler
        self.category = category
        self.usage_count = 0

    def to_openai_schema(self) -> dict:
        """تحويل لتنسيق OpenAI Function Calling"""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters
            }
        }


class ToolsManager:
    """
    مدير الأدوات - يسجل وينفذ الأدوات المتاحة للإيجنت
    """

    def __init__(self):
        self.tools: dict[str, Tool] = {}
        self._register_builtin_tools()
        logger.info(f"🔧 Tools Manager initialized | {len(self.tools)} tools available")

    def register_tool(self, name: str, description: str, parameters: dict,
                      handler: Callable, category: str = "general"):
        """تسجيل أداة جديدة"""
        tool = Tool(name, description, parameters, handler, category)
        self.tools[name] = tool
        logger.debug(f"🔧 Tool registered: {name}")

    def get_tools_schema(self) -> list[dict]:
        """الحصول على مخطط الأدوات لـ OpenAI"""
        return [tool.to_openai_schema() for tool in self.tools.values()]

    async def execute_tool(self, name: str, arguments: dict) -> Any:
        """تنفيذ أداة"""
        if name not in self.tools:
            return {"error": f"الأداة '{name}' غير موجودة"}

        tool = self.tools[name]
        tool.usage_count += 1

        try:
            result = await tool.handler(**arguments)
            logger.info(f"✅ Tool '{name}' executed successfully")
            return result
        except Exception as e:
            logger.error(f"❌ Tool '{name}' failed: {str(e)}")
            return {"error": f"فشل تنفيذ الأداة: {str(e)}"}

    def list_tools(self) -> list[dict]:
        """عرض الأدوات المتاحة"""
        return [
            {
                "name": t.name,
                "description": t.description,
                "category": t.category,
                "usage_count": t.usage_count
            }
            for t in self.tools.values()
        ]

    def _register_builtin_tools(self):
        """تسجيل الأدوات المدمجة"""

        # === أداة الوقت والتاريخ ===
        self.register_tool(
            name="get_current_datetime",
            description="الحصول على التاريخ والوقت الحالي بتنسيقات مختلفة",
            parameters={
                "type": "object",
                "properties": {
                    "timezone": {
                        "type": "string",
                        "description": "المنطقة الزمنية (مثل: Asia/Riyadh, UTC, America/New_York)",
                        "default": "Asia/Riyadh"
                    },
                    "format": {
                        "type": "string",
                        "description": "تنسيق التاريخ (full, date, time, iso)",
                        "default": "full"
                    }
                },
                "required": []
            },
            handler=self._tool_get_datetime,
            category="utility"
        )

        # === أداة الحسابات الرياضية ===
        self.register_tool(
            name="calculate",
            description="إجراء حسابات رياضية متقدمة",
            parameters={
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "التعبير الرياضي المراد حسابه (مثل: 2**10, sqrt(144), sin(pi/2))"
                    }
                },
                "required": ["expression"]
            },
            handler=self._tool_calculate,
            category="math"
        )

        # === أداة البحث على الويب ===
        self.register_tool(
            name="web_search",
            description="البحث على الإنترنت عن معلومات حديثة",
            parameters={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "نص البحث"
                    },
                    "num_results": {
                        "type": "integer",
                        "description": "عدد النتائج المطلوبة",
                        "default": 5
                    }
                },
                "required": ["query"]
            },
            handler=self._tool_web_search,
            category="search"
        )

        # === أداة جلب محتوى URL ===
        self.register_tool(
            name="fetch_url",
            description="جلب محتوى صفحة ويب من رابط URL",
            parameters={
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "رابط الصفحة المراد جلب محتواها"
                    }
                },
                "required": ["url"]
            },
            handler=self._tool_fetch_url,
            category="web"
        )

        # === أداة تحويل العملات ===
        self.register_tool(
            name="convert_currency",
            description="تحويل بين العملات باستخدام أسعار صرف حديثة",
            parameters={
                "type": "object",
                "properties": {
                    "amount": {
                        "type": "number",
                        "description": "المبلغ المراد تحويله"
                    },
                    "from_currency": {
                        "type": "string",
                        "description": "عملة المصدر (مثل: USD, SAR, EUR)"
                    },
                    "to_currency": {
                        "type": "string",
                        "description": "عملة الهدف (مثل: USD, SAR, EUR)"
                    }
                },
                "required": ["amount", "from_currency", "to_currency"]
            },
            handler=self._tool_convert_currency,
            category="finance"
        )

        # === أداة الطقس ===
        self.register_tool(
            name="get_weather",
            description="الحصول على معلومات الطقس لمدينة محددة",
            parameters={
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "اسم المدينة (مثل: Riyadh, Dubai, Cairo)"
                    }
                },
                "required": ["city"]
            },
            handler=self._tool_get_weather,
            category="weather"
        )

        # === أداة تنفيذ كود Python ===
        self.register_tool(
            name="execute_python",
            description="تنفيذ كود Python بشكل آمن وإرجاع النتيجة",
            parameters={
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "كود Python المراد تنفيذه"
                    }
                },
                "required": ["code"]
            },
            handler=self._tool_execute_python,
            category="code"
        )

        # === أداة إنشاء ملاحظة/تذكير ===
        self.register_tool(
            name="create_note",
            description="إنشاء ملاحظة أو تذكير للمستخدم",
            parameters={
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "عنوان الملاحظة"
                    },
                    "content": {
                        "type": "string",
                        "description": "محتوى الملاحظة"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high"],
                        "description": "أولوية الملاحظة",
                        "default": "medium"
                    }
                },
                "required": ["title", "content"]
            },
            handler=self._tool_create_note,
            category="productivity"
        )

        # === أداة تحليل النص ===
        self.register_tool(
            name="analyze_text",
            description="تحليل نص وإرجاع إحصائيات (عدد الكلمات، الجمل، اللغة، إلخ)",
            parameters={
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "النص المراد تحليله"
                    }
                },
                "required": ["text"]
            },
            handler=self._tool_analyze_text,
            category="text"
        )

        # === أداة تحويل الوحدات ===
        self.register_tool(
            name="convert_units",
            description="تحويل بين وحدات القياس المختلفة (طول، وزن، حرارة، إلخ)",
            parameters={
                "type": "object",
                "properties": {
                    "value": {
                        "type": "number",
                        "description": "القيمة المراد تحويلها"
                    },
                    "from_unit": {
                        "type": "string",
                        "description": "وحدة المصدر (مثل: km, miles, kg, lb, celsius, fahrenheit)"
                    },
                    "to_unit": {
                        "type": "string",
                        "description": "وحدة الهدف"
                    }
                },
                "required": ["value", "from_unit", "to_unit"]
            },
            handler=self._tool_convert_units,
            category="utility"
        )

    # ==================== Tool Handlers ====================

    async def _tool_get_datetime(self, timezone: str = "Asia/Riyadh", format: str = "full") -> dict:
        """معالج أداة الوقت"""
        now = datetime.now()

        formats = {
            "full": now.strftime("%Y-%m-%d %H:%M:%S"),
            "date": now.strftime("%Y-%m-%d"),
            "time": now.strftime("%H:%M:%S"),
            "iso": now.isoformat(),
            "arabic": now.strftime("%d/%m/%Y - %H:%M")
        }

        return {
            "datetime": formats.get(format, formats["full"]),
            "timezone": timezone,
            "timestamp": int(now.timestamp()),
            "day_of_week": now.strftime("%A"),
            "day_name_ar": ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس",
                           "الجمعة", "السبت", "الأحد"][now.weekday()]
        }

    async def _tool_calculate(self, expression: str) -> dict:
        """معالج أداة الحسابات"""
        # بيئة آمنة للحسابات
        safe_dict = {
            "abs": abs, "round": round, "min": min, "max": max,
            "sum": sum, "pow": pow, "int": int, "float": float,
            "sqrt": math.sqrt, "sin": math.sin, "cos": math.cos,
            "tan": math.tan, "log": math.log, "log10": math.log10,
            "pi": math.pi, "e": math.e, "inf": math.inf,
            "ceil": math.ceil, "floor": math.floor,
            "factorial": math.factorial, "gcd": math.gcd
        }

        try:
            # تنظيف التعبير
            clean_expr = expression.replace("^", "**")
            result = eval(clean_expr, {"__builtins__": {}}, safe_dict)
            return {
                "expression": expression,
                "result": result,
                "type": type(result).__name__
            }
        except Exception as e:
            return {"error": f"خطأ في الحساب: {str(e)}", "expression": expression}

    async def _tool_web_search(self, query: str, num_results: int = 5) -> dict:
        """معالج أداة البحث"""
        # محاكاة البحث - في الإنتاج يتم ربطه بـ API بحث حقيقي
        return {
            "query": query,
            "message": "يتم البحث عبر الإنترنت...",
            "note": "قم بربط API بحث حقيقي (مثل Google Custom Search أو Bing) للنتائج الفعلية",
            "suggestion": "يمكنك استخدام SerpAPI أو Tavily API للبحث"
        }

    async def _tool_fetch_url(self, url: str) -> dict:
        """معالج أداة جلب URL"""
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(url, follow_redirects=True)
                content = response.text[:5000]  # أقصى 5000 حرف

                return {
                    "url": url,
                    "status_code": response.status_code,
                    "content_type": response.headers.get("content-type", "unknown"),
                    "content_length": len(response.text),
                    "content_preview": content
                }
        except Exception as e:
            return {"error": f"فشل جلب الرابط: {str(e)}", "url": url}

    async def _tool_convert_currency(self, amount: float, from_currency: str,
                                     to_currency: str) -> dict:
        """معالج أداة تحويل العملات"""
        # أسعار صرف تقريبية (في الإنتاج يتم ربطها بـ API أسعار حقيقي)
        rates_to_usd = {
            "USD": 1.0, "SAR": 3.75, "AED": 3.67, "EUR": 0.92,
            "GBP": 0.79, "EGP": 48.5, "KWD": 0.31, "QAR": 3.64,
            "BHD": 0.38, "OMR": 0.39, "JOD": 0.71, "TRY": 32.0,
            "JPY": 155.0, "CNY": 7.25, "INR": 83.5
        }

        from_upper = from_currency.upper()
        to_upper = to_currency.upper()

        if from_upper not in rates_to_usd or to_upper not in rates_to_usd:
            return {"error": f"عملة غير مدعومة. العملات المدعومة: {list(rates_to_usd.keys())}"}

        # تحويل إلى USD أولاً ثم إلى العملة المستهدفة
        usd_amount = amount / rates_to_usd[from_upper]
        result = usd_amount * rates_to_usd[to_upper]

        return {
            "amount": amount,
            "from": from_upper,
            "to": to_upper,
            "result": round(result, 2),
            "rate": round(rates_to_usd[to_upper] / rates_to_usd[from_upper], 6),
            "note": "أسعار تقريبية - قم بربط API أسعار صرف حقيقي للدقة"
        }

    async def _tool_get_weather(self, city: str) -> dict:
        """معالج أداة الطقس"""
        # في الإنتاج يتم ربطها بـ OpenWeatherMap أو مشابه
        return {
            "city": city,
            "message": "قم بربط OpenWeatherMap API للحصول على بيانات طقس حقيقية",
            "note": "أضف WEATHER_API_KEY في ملف .env",
            "example_response": {
                "temperature": "32°C",
                "condition": "صافي",
                "humidity": "25%",
                "wind": "15 km/h"
            }
        }

    async def _tool_execute_python(self, code: str) -> dict:
        """معالج أداة تنفيذ Python"""
        # تنفيذ آمن ومحدود
        import io
        import sys
        from contextlib import redirect_stdout, redirect_stderr

        # قائمة سوداء للعمليات الخطرة
        dangerous = ["import os", "import sys", "subprocess", "exec(", "eval(",
                     "__import__", "open(", "file(", "shutil", "rmdir", "unlink"]

        for d in dangerous:
            if d in code:
                return {"error": f"عملية غير مسموحة: {d}", "code": code}

        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()

        try:
            with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
                exec_globals = {"__builtins__": {"print": print, "range": range,
                                                  "len": len, "str": str, "int": int,
                                                  "float": float, "list": list, "dict": dict,
                                                  "set": set, "tuple": tuple, "sorted": sorted,
                                                  "enumerate": enumerate, "zip": zip,
                                                  "map": map, "filter": filter, "sum": sum,
                                                  "min": min, "max": max, "abs": abs,
                                                  "round": round, "type": type, "isinstance": isinstance}}
                exec(code, exec_globals)

            output = stdout_capture.getvalue()
            errors = stderr_capture.getvalue()

            return {
                "success": True,
                "output": output if output else "(لا يوجد مخرجات)",
                "errors": errors if errors else None
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__
            }

    async def _tool_create_note(self, title: str, content: str,
                                priority: str = "medium") -> dict:
        """معالج أداة الملاحظات"""
        note = {
            "id": f"note_{int(datetime.now().timestamp())}",
            "title": title,
            "content": content,
            "priority": priority,
            "created_at": datetime.now().isoformat(),
            "status": "active"
        }
        return {"success": True, "note": note, "message": f"تم إنشاء الملاحظة: {title}"}

    async def _tool_analyze_text(self, text: str) -> dict:
        """معالج أداة تحليل النص"""
        words = text.split()
        sentences = [s.strip() for s in text.replace("؟", "?").replace("。", ".").split(".")
                     if s.strip()]

        # كشف اللغة بشكل بسيط
        arabic_chars = sum(1 for c in text if '\u0600' <= c <= '\u06FF')
        english_chars = sum(1 for c in text if 'a' <= c.lower() <= 'z')
        total_chars = len(text.replace(" ", ""))

        if total_chars == 0:
            language = "unknown"
        elif arabic_chars > english_chars:
            language = "Arabic"
        elif english_chars > arabic_chars:
            language = "English"
        else:
            language = "Mixed"

        return {
            "word_count": len(words),
            "character_count": len(text),
            "character_count_no_spaces": len(text.replace(" ", "")),
            "sentence_count": len(sentences),
            "paragraph_count": text.count("\n") + 1,
            "average_word_length": round(sum(len(w) for w in words) / max(len(words), 1), 1),
            "language": language,
            "arabic_percentage": round(arabic_chars / max(total_chars, 1) * 100, 1),
            "english_percentage": round(english_chars / max(total_chars, 1) * 100, 1)
        }

    async def _tool_convert_units(self, value: float, from_unit: str, to_unit: str) -> dict:
        """معالج أداة تحويل الوحدات"""
        conversions = {
            # طول
            ("km", "miles"): lambda v: v * 0.621371,
            ("miles", "km"): lambda v: v * 1.60934,
            ("m", "ft"): lambda v: v * 3.28084,
            ("ft", "m"): lambda v: v * 0.3048,
            ("cm", "inch"): lambda v: v * 0.393701,
            ("inch", "cm"): lambda v: v * 2.54,
            # وزن
            ("kg", "lb"): lambda v: v * 2.20462,
            ("lb", "kg"): lambda v: v * 0.453592,
            ("g", "oz"): lambda v: v * 0.035274,
            ("oz", "g"): lambda v: v * 28.3495,
            # حرارة
            ("celsius", "fahrenheit"): lambda v: v * 9/5 + 32,
            ("fahrenheit", "celsius"): lambda v: (v - 32) * 5/9,
            ("celsius", "kelvin"): lambda v: v + 273.15,
            ("kelvin", "celsius"): lambda v: v - 273.15,
            # مساحة
            ("sqm", "sqft"): lambda v: v * 10.7639,
            ("sqft", "sqm"): lambda v: v * 0.092903,
            # سرعة
            ("kmh", "mph"): lambda v: v * 0.621371,
            ("mph", "kmh"): lambda v: v * 1.60934,
            # حجم
            ("liter", "gallon"): lambda v: v * 0.264172,
            ("gallon", "liter"): lambda v: v * 3.78541,
        }

        key = (from_unit.lower(), to_unit.lower())
        if key not in conversions:
            available = list(set([f"{f} → {t}" for f, t in conversions.keys()]))
            return {
                "error": f"تحويل غير مدعوم: {from_unit} → {to_unit}",
                "available_conversions": available[:15]
            }

        result = conversions[key](value)
        return {
            "value": value,
            "from_unit": from_unit,
            "to_unit": to_unit,
            "result": round(result, 4),
            "formula": f"{value} {from_unit} = {round(result, 4)} {to_unit}"
        }
