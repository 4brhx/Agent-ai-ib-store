# 🤖 GPT-5.4 Pro Agent

إيجنت ذكاء اصطناعي احترافي مبني بـ HTML بسيط ومتصل بـ OpenRouter API.

## ✨ المميزات

- 🎨 واجهة UI/UX احترافية (Dark Mode) مستلهمة من [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- 🧠 اتصال مباشر بـ OpenRouter API (GPT-5.4 / GPT-4o)
- 💬 نظام محادثات متكامل مع حفظ التاريخ
- 📝 دعم Markdown في الردود (أكواد، عناوين، قوائم)
- 📱 متجاوب مع جميع الأجهزة (Mobile Responsive)
- 🚀 جاهز للنشر على Vercel مباشرة
- 🔐 إدارة آمنة لمفتاح API عبر LocalStorage

## 🚀 النشر على Vercel

1. ارفع المشروع على GitHub
2. اذهب إلى [vercel.com](https://vercel.com)
3. اربط المستودع
4. انقر **Deploy** - انتهى!

## 🔑 إعداد API Key

عند فتح التطبيق لأول مرة، سيطلب منك إدخال مفتاح OpenRouter API:

1. اذهب إلى [OpenRouter Keys](https://openrouter.ai/workspaces/default/keys)
2. أنشئ مفتاح جديد
3. أدخله في التطبيق

## 📁 هيكل المشروع

```
├── index.html          # الواجهة الرئيسية (HTML + CSS + JS)
├── vercel.json         # إعدادات Vercel
├── README.md           # التوثيق
└── gpt54-agent/        # نظام Backend (Python - اختياري)
    ├── agent_core.py   # نواة الإيجنت
    ├── memory_manager.py # إدارة الذاكرة
    ├── tools_manager.py  # الأدوات
    ├── api.py          # واجهة FastAPI
    ├── config.py       # الإعدادات
    └── requirements.txt
```

## 🛠️ التقنيات

- **Frontend:** HTML5 + CSS3 + JavaScript (Vanilla)
- **API:** OpenRouter (GPT-5.4 / GPT-4o)
- **Design:** UI/UX Pro Max Design System
- **Hosting:** Vercel
- **Backend (اختياري):** Python + FastAPI

## 📄 الرخصة

MIT License
