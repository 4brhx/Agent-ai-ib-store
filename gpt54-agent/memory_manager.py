"""
GPT-5.4 Agent Memory Manager
نظام إدارة الذاكرة والسياق - يحفظ ويسترجع المعلومات ذات الصلة
"""

import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional
from collections import defaultdict

from loguru import logger
from config import settings


class MemoryItem:
    """عنصر في الذاكرة"""

    def __init__(self, content: str, category: str = "general",
                 user_id: str = "default", importance: float = 0.5,
                 metadata: Optional[dict] = None):
        self.id = hashlib.md5(f"{content}{datetime.now().isoformat()}".encode()).hexdigest()[:12]
        self.content = content
        self.category = category
        self.user_id = user_id
        self.importance = importance  # 0.0 - 1.0
        self.metadata = metadata or {}
        self.created_at = datetime.now()
        self.last_accessed = datetime.now()
        self.access_count = 0
        self.keywords: list[str] = self._extract_keywords(content)

    def _extract_keywords(self, text: str) -> list[str]:
        """استخراج كلمات مفتاحية بسيطة"""
        # تنظيف النص واستخراج الكلمات المهمة
        stop_words = {
            "هو", "هي", "هم", "في", "من", "إلى", "على", "عن", "مع",
            "the", "is", "are", "was", "were", "in", "on", "at", "to",
            "a", "an", "and", "or", "but", "for", "of", "with", "that"
        }
        words = text.lower().split()
        keywords = [w.strip(".,!?؟،") for w in words if len(w) > 2 and w not in stop_words]
        return list(set(keywords))[:20]  # أقصى 20 كلمة مفتاحية

    def relevance_score(self, query: str) -> float:
        """حساب درجة الصلة مع استعلام"""
        query_words = set(query.lower().split())
        keyword_set = set(self.keywords)

        if not keyword_set:
            return 0.0

        # تقاطع الكلمات
        intersection = query_words.intersection(keyword_set)
        word_score = len(intersection) / max(len(query_words), 1)

        # عامل الحداثة (الذكريات الأحدث أكثر أهمية)
        age_hours = (datetime.now() - self.created_at).total_seconds() / 3600
        recency_score = max(0.0, 1.0 - (age_hours / 720))  # يتلاشى خلال 30 يوم

        # عامل الأهمية
        importance_score = self.importance

        # عامل الاستخدام
        usage_score = min(1.0, self.access_count / 10)

        # الدرجة النهائية
        final_score = (
            word_score * 0.4 +
            recency_score * 0.25 +
            importance_score * 0.25 +
            usage_score * 0.1
        )

        return round(final_score, 4)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "content": self.content,
            "category": self.category,
            "user_id": self.user_id,
            "importance": self.importance,
            "keywords": self.keywords,
            "created_at": self.created_at.isoformat(),
            "last_accessed": self.last_accessed.isoformat(),
            "access_count": self.access_count,
            "metadata": self.metadata
        }


class ShortTermMemory:
    """الذاكرة قصيرة المدى - للمحادثة الحالية"""

    def __init__(self, max_items: int = 20):
        self.items: list[dict] = []
        self.max_items = max_items

    def add(self, content: str, role: str = "context"):
        """إضافة عنصر"""
        self.items.append({
            "content": content,
            "role": role,
            "timestamp": datetime.now().isoformat()
        })
        # تقليم عند تجاوز الحد
        if len(self.items) > self.max_items:
            self.items = self.items[-self.max_items:]

    def get_context(self, last_n: int = 5) -> str:
        """استرجاع السياق الأخير"""
        recent = self.items[-last_n:]
        return "\n".join([item["content"] for item in recent])

    def clear(self):
        """مسح الذاكرة قصيرة المدى"""
        self.items.clear()


class LongTermMemory:
    """الذاكرة طويلة المدى - معلومات مستمرة"""

    def __init__(self, max_items: int = 1000):
        self.items: dict[str, MemoryItem] = {}
        self.max_items = max_items
        self.user_memories: dict[str, list[str]] = defaultdict(list)  # user_id -> [memory_ids]

    def store(self, content: str, category: str = "general",
              user_id: str = "default", importance: float = 0.5,
              metadata: Optional[dict] = None) -> str:
        """تخزين في الذاكرة طويلة المدى"""
        # التحقق من عدم وجود تكرار
        for item in self.items.values():
            if item.content == content and item.user_id == user_id:
                item.access_count += 1
                item.last_accessed = datetime.now()
                return item.id

        # إنشاء عنصر جديد
        item = MemoryItem(content, category, user_id, importance, metadata)

        # إزالة أقدم العناصر إذا تجاوز الحد
        if len(self.items) >= self.max_items:
            self._evict_oldest()

        self.items[item.id] = item
        self.user_memories[user_id].append(item.id)

        logger.debug(f"🧠 Stored in long-term memory: {item.id} | Category: {category}")
        return item.id

    def search(self, query: str, user_id: Optional[str] = None,
               category: Optional[str] = None, top_k: int = 5) -> list[MemoryItem]:
        """البحث في الذاكرة"""
        candidates = list(self.items.values())

        # فلترة حسب المستخدم
        if user_id:
            candidates = [m for m in candidates if m.user_id == user_id]

        # فلترة حسب الفئة
        if category:
            candidates = [m for m in candidates if m.category == category]

        # ترتيب حسب درجة الصلة
        scored = [(item, item.relevance_score(query)) for item in candidates]
        scored.sort(key=lambda x: x[1], reverse=True)

        # تحديث وقت الوصول
        results = []
        for item, score in scored[:top_k]:
            if score > 0.05:  # حد أدنى للصلة
                item.last_accessed = datetime.now()
                item.access_count += 1
                results.append(item)

        return results

    def get_by_user(self, user_id: str) -> list[MemoryItem]:
        """استرجاع ذكريات مستخدم محدد"""
        memory_ids = self.user_memories.get(user_id, [])
        return [self.items[mid] for mid in memory_ids if mid in self.items]

    def delete(self, memory_id: str) -> bool:
        """حذف عنصر من الذاكرة"""
        if memory_id in self.items:
            item = self.items[memory_id]
            if item.user_id in self.user_memories:
                self.user_memories[item.user_id].remove(memory_id)
            del self.items[memory_id]
            return True
        return False

    def _evict_oldest(self):
        """إزالة أقدم وأقل أهمية"""
        if not self.items:
            return

        # ترتيب حسب الأهمية والحداثة
        sorted_items = sorted(
            self.items.values(),
            key=lambda x: (x.importance, x.access_count, x.last_accessed)
        )

        # إزالة أقل 10%
        to_remove = max(1, len(sorted_items) // 10)
        for item in sorted_items[:to_remove]:
            self.delete(item.id)

    def get_stats(self) -> dict:
        """إحصائيات الذاكرة"""
        categories = defaultdict(int)
        for item in self.items.values():
            categories[item.category] += 1

        return {
            "total_items": len(self.items),
            "categories": dict(categories),
            "users_count": len(self.user_memories)
        }


class MemoryManager:
    """
    مدير الذاكرة الرئيسي
    يجمع بين الذاكرة قصيرة وطويلة المدى
    """

    def __init__(self):
        self.short_term = ShortTermMemory(max_items=20)
        self.long_term = LongTermMemory(max_items=settings.agent.max_memory_items)
        self.user_profiles: dict[str, dict] = {}

        logger.info("🧠 Memory Manager initialized")

    def store_interaction(self, user_id: str, user_message: str, assistant_response: str):
        """تخزين تفاعل كامل"""
        # تخزين في الذاكرة قصيرة المدى
        self.short_term.add(f"المستخدم: {user_message}", "user")
        self.short_term.add(f"المساعد: {assistant_response[:200]}", "assistant")

        # تحليل وتخزين المعلومات المهمة في الذاكرة طويلة المدى
        importance = self._calculate_importance(user_message, assistant_response)

        if importance > 0.3:
            # تخزين ملخص التفاعل
            summary = self._summarize_interaction(user_message, assistant_response)
            category = self._categorize(user_message)

            self.long_term.store(
                content=summary,
                category=category,
                user_id=user_id,
                importance=importance,
                metadata={
                    "original_query": user_message[:100],
                    "response_length": len(assistant_response)
                }
            )

        # تحديث ملف المستخدم
        self._update_user_profile(user_id, user_message)

    def get_relevant_context(self, query: str, user_id: str = "default") -> str:
        """استرجاع السياق ذو الصلة"""
        contexts = []

        # من الذاكرة قصيرة المدى
        short_context = self.short_term.get_context(last_n=3)
        if short_context:
            contexts.append(f"[سياق حديث]: {short_context}")

        # من الذاكرة طويلة المدى
        relevant_memories = self.long_term.search(query, user_id=user_id, top_k=3)
        if relevant_memories:
            memory_texts = [m.content for m in relevant_memories]
            contexts.append(f"[ذكريات ذات صلة]: {' | '.join(memory_texts)}")

        # من ملف المستخدم
        if user_id in self.user_profiles:
            profile = self.user_profiles[user_id]
            if profile.get("preferences"):
                contexts.append(f"[تفضيلات المستخدم]: {profile['preferences']}")

        return "\n".join(contexts) if contexts else ""

    def store_fact(self, user_id: str, fact: str, category: str = "fact",
                   importance: float = 0.8) -> str:
        """تخزين حقيقة أو معلومة مهمة"""
        return self.long_term.store(
            content=fact,
            category=category,
            user_id=user_id,
            importance=importance
        )

    def store_preference(self, user_id: str, preference: str):
        """تخزين تفضيل للمستخدم"""
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = {"preferences": "", "topics": [], "interaction_count": 0}

        current_prefs = self.user_profiles[user_id].get("preferences", "")
        self.user_profiles[user_id]["preferences"] = f"{current_prefs} | {preference}".strip(" |")

        self.long_term.store(
            content=f"تفضيل: {preference}",
            category="preference",
            user_id=user_id,
            importance=0.9
        )

    def _calculate_importance(self, user_message: str, response: str) -> float:
        """حساب أهمية التفاعل"""
        importance = 0.3

        # رسائل أطول عادة أكثر أهمية
        if len(user_message) > 100:
            importance += 0.1
        if len(response) > 500:
            importance += 0.1

        # كلمات تدل على الأهمية
        important_keywords = [
            "تذكر", "مهم", "لا تنسى", "remember", "important",
            "دائماً", "always", "أفضل", "prefer", "اسمي", "my name"
        ]
        if any(kw in user_message.lower() for kw in important_keywords):
            importance += 0.3

        # أسئلة تقنية
        tech_keywords = ["كود", "برمجة", "code", "api", "function", "خطأ", "error"]
        if any(kw in user_message.lower() for kw in tech_keywords):
            importance += 0.1

        return min(1.0, importance)

    def _summarize_interaction(self, user_message: str, response: str) -> str:
        """تلخيص التفاعل"""
        # تلخيص بسيط - يمكن تحسينه باستخدام AI
        user_summary = user_message[:150]
        response_summary = response[:150]
        return f"سؤال: {user_summary} | جواب: {response_summary}"

    def _categorize(self, message: str) -> str:
        """تصنيف الرسالة"""
        message_lower = message.lower()

        categories = {
            "code": ["كود", "برمجة", "code", "python", "javascript", "function", "class"],
            "question": ["ما هو", "كيف", "لماذا", "what", "how", "why", "?", "؟"],
            "task": ["اعمل", "أنشئ", "create", "build", "make", "صمم", "اكتب"],
            "personal": ["اسمي", "أنا", "my name", "i am", "أفضل", "prefer"],
            "creative": ["اكتب قصة", "شعر", "poem", "story", "خيال", "creative"]
        }

        for category, keywords in categories.items():
            if any(kw in message_lower for kw in keywords):
                return category

        return "general"

    def _update_user_profile(self, user_id: str, message: str):
        """تحديث ملف المستخدم"""
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = {
                "preferences": "",
                "topics": [],
                "interaction_count": 0,
                "first_seen": datetime.now().isoformat(),
                "last_seen": datetime.now().isoformat()
            }

        profile = self.user_profiles[user_id]
        profile["interaction_count"] += 1
        profile["last_seen"] = datetime.now().isoformat()

        # تتبع المواضيع
        category = self._categorize(message)
        if category not in profile["topics"]:
            profile["topics"].append(category)
            if len(profile["topics"]) > 10:
                profile["topics"] = profile["topics"][-10:]

    def get_user_profile(self, user_id: str) -> dict:
        """الحصول على ملف المستخدم"""
        return self.user_profiles.get(user_id, {})

    def clear_user_memory(self, user_id: str):
        """مسح ذاكرة مستخدم محدد"""
        # مسح من الذاكرة طويلة المدى
        memories = self.long_term.get_by_user(user_id)
        for memory in memories:
            self.long_term.delete(memory.id)

        # مسح الملف الشخصي
        if user_id in self.user_profiles:
            del self.user_profiles[user_id]

        logger.info(f"🧹 Cleared memory for user: {user_id}")

    def get_stats(self) -> dict:
        """إحصائيات الذاكرة"""
        return {
            "short_term_items": len(self.short_term.items),
            "long_term": self.long_term.get_stats(),
            "user_profiles_count": len(self.user_profiles)
        }

    def export_memory(self, user_id: Optional[str] = None) -> dict:
        """تصدير الذاكرة"""
        if user_id:
            memories = self.long_term.get_by_user(user_id)
        else:
            memories = list(self.long_term.items.values())

        return {
            "exported_at": datetime.now().isoformat(),
            "total_items": len(memories),
            "items": [m.to_dict() for m in memories]
        }
