"""
GPT-5.4 Agent API
واجهة برمجة التطبيقات باستخدام FastAPI
"""

import time
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field
from loguru import logger

from config import settings
from agent_core import GPT54Agent


# === Lifespan ===
@asynccontextmanager
async def lifespan(app: FastAPI):
    """إدارة دورة حياة التطبيق"""
    logger.info("🚀 Starting GPT-5.4 Agent API...")
    app.state.agent = GPT54Agent()
    logger.info("✅ Agent initialized and ready!")
    yield
    logger.info("👋 Shutting down GPT-5.4 Agent API...")


# === FastAPI App ===
app = FastAPI(
    title="GPT-5.4 Pro Agent API",
    description="واجهة برمجة تطبيقات احترافية لإيجنت GPT-5.4 الذكي",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# === CORS ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.server.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Static Files & Templates ===
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


# === Request/Response Models ===
class ChatRequest(BaseModel):
    """نموذج طلب المحادثة"""
    message: str = Field(..., min_length=1, max_length=50000, description="رسالة المستخدم")
    conversation_id: Optional[str] = Field(None, description="معرف المحادثة (اختياري)")
    user_id: str = Field(default="default", description="معرف المستخدم")
    use_tools: bool = Field(default=True, description="استخدام الأدوات")
    stream: bool = Field(default=False, description="البث المباشر")


class ChatResponse(BaseModel):
    """نموذج رد المحادثة"""
    conversation_id: str
    message: str
    tokens_used: int = 0
    response_time: float = 0
    model: str = ""
    finish_reason: str = ""


class ConversationResponse(BaseModel):
    """نموذج رد المحادثات"""
    id: str
    user_id: str
    messages_count: int
    created_at: str
    updated_at: str
    total_tokens_used: int


class MemoryStoreRequest(BaseModel):
    """نموذج تخزين في الذاكرة"""
    content: str = Field(..., min_length=1, description="المحتوى المراد تخزينه")
    category: str = Field(default="general", description="الفئة")
    user_id: str = Field(default="default", description="معرف المستخدم")
    importance: float = Field(default=0.5, ge=0.0, le=1.0, description="الأهمية")


class ImageAnalysisRequest(BaseModel):
    """نموذج تحليل صورة"""
    image_url: str = Field(..., description="رابط الصورة")
    prompt: str = Field(default="حلل هذه الصورة بالتفصيل", description="التوجيه")
    conversation_id: Optional[str] = None
    user_id: str = Field(default="default")


# === Rate Limiting (Simple) ===
request_counts: dict[str, list[float]] = {}


async def check_rate_limit(request: Request):
    """فحص حد الطلبات"""
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    minute_ago = now - 60

    if client_ip not in request_counts:
        request_counts[client_ip] = []

    # تنظيف الطلبات القديمة
    request_counts[client_ip] = [t for t in request_counts[client_ip] if t > minute_ago]

    if len(request_counts[client_ip]) >= settings.security.rate_limit_per_minute:
        raise HTTPException(status_code=429, detail="تم تجاوز حد الطلبات. حاول لاحقاً.")

    request_counts[client_ip].append(now)


# === Middleware ===
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """تسجيل الطلبات"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    logger.info(
        f"📡 {request.method} {request.url.path} | "
        f"Status: {response.status_code} | Time: {process_time:.3f}s"
    )
    response.headers["X-Process-Time"] = str(round(process_time, 3))
    return response


# === Routes ===

# --- الصفحة الرئيسية ---
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """الصفحة الرئيسية - واجهة المحادثة"""
    return templates.TemplateResponse("index.html", {
        "request": request,
        "agent_name": settings.agent.name,
        "agent_version": settings.agent.version
    })


# --- المحادثة ---
@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: Request, body: ChatRequest):
    """إرسال رسالة والحصول على رد"""
    await check_rate_limit(request)

    agent: GPT54Agent = request.app.state.agent

    try:
        if body.stream:
            # البث المباشر
            return StreamingResponse(
                agent.chat_stream(body.message, body.conversation_id, body.user_id),
                media_type="text/event-stream"
            )

        result = await agent.chat(
            message=body.message,
            conversation_id=body.conversation_id,
            user_id=body.user_id,
            use_tools=body.use_tools
        )

        return ChatResponse(**result)

    except Exception as e:
        logger.error(f"❌ Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطأ في المعالجة: {str(e)}")


@app.post("/api/chat/stream")
async def chat_stream(request: Request, body: ChatRequest):
    """محادثة مع بث مباشر"""
    await check_rate_limit(request)

    agent: GPT54Agent = request.app.state.agent

    async def generate():
        async for chunk in agent.chat_stream(body.message, body.conversation_id, body.user_id):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


# --- المحادثات ---
@app.get("/api/conversations")
async def list_conversations(request: Request, user_id: Optional[str] = None):
    """عرض المحادثات"""
    agent: GPT54Agent = request.app.state.agent
    conversations = agent.list_conversations(user_id)
    return {"conversations": conversations, "total": len(conversations)}


@app.get("/api/conversations/{conversation_id}")
async def get_conversation(request: Request, conversation_id: str):
    """الحصول على محادثة محددة"""
    agent: GPT54Agent = request.app.state.agent
    conv = agent.get_conversation(conversation_id)

    if not conv:
        raise HTTPException(status_code=404, detail="المحادثة غير موجودة")

    return conv.to_dict()


@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(request: Request, conversation_id: str):
    """حذف محادثة"""
    agent: GPT54Agent = request.app.state.agent
    success = agent.delete_conversation(conversation_id)

    if not success:
        raise HTTPException(status_code=404, detail="المحادثة غير موجودة")

    return {"success": True, "message": "تم حذف المحادثة"}


@app.post("/api/conversations/new")
async def create_conversation(request: Request, user_id: str = "default"):
    """إنشاء محادثة جديدة"""
    agent: GPT54Agent = request.app.state.agent
    conv = agent.create_conversation(user_id)
    return {"conversation_id": conv.id, "created_at": conv.created_at}


# --- الذاكرة ---
@app.post("/api/memory/store")
async def store_memory(request: Request, body: MemoryStoreRequest):
    """تخزين في الذاكرة"""
    agent: GPT54Agent = request.app.state.agent
    memory_id = agent.memory.store_fact(
        user_id=body.user_id,
        fact=body.content,
        category=body.category,
        importance=body.importance
    )
    return {"success": True, "memory_id": memory_id}


@app.get("/api/memory/search")
async def search_memory(request: Request, query: str, user_id: str = "default"):
    """البحث في الذاكرة"""
    agent: GPT54Agent = request.app.state.agent
    results = agent.memory.long_term.search(query, user_id=user_id)
    return {"results": [m.to_dict() for m in results], "total": len(results)}


@app.delete("/api/memory/{user_id}")
async def clear_memory(request: Request, user_id: str):
    """مسح ذاكرة مستخدم"""
    agent: GPT54Agent = request.app.state.agent
    agent.memory.clear_user_memory(user_id)
    return {"success": True, "message": f"تم مسح ذاكرة المستخدم: {user_id}"}


@app.get("/api/memory/export")
async def export_memory(request: Request, user_id: Optional[str] = None):
    """تصدير الذاكرة"""
    agent: GPT54Agent = request.app.state.agent
    data = agent.memory.export_memory(user_id)
    return data


# --- تحليل الصور ---
@app.post("/api/vision/analyze")
async def analyze_image(request: Request, body: ImageAnalysisRequest):
    """تحليل صورة"""
    await check_rate_limit(request)
    agent: GPT54Agent = request.app.state.agent

    try:
        result = await agent.analyze_image(
            image_url=body.image_url,
            prompt=body.prompt,
            conversation_id=body.conversation_id,
            user_id=body.user_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحليل الصورة: {str(e)}")


# --- الأدوات ---
@app.get("/api/tools")
async def list_tools(request: Request):
    """عرض الأدوات المتاحة"""
    agent: GPT54Agent = request.app.state.agent
    tools = agent.tools_manager.list_tools()
    return {"tools": tools, "total": len(tools)}


# --- الإحصائيات ---
@app.get("/api/stats")
async def get_stats(request: Request):
    """إحصائيات الإيجنت"""
    agent: GPT54Agent = request.app.state.agent
    return agent.get_stats()


# --- Health Check ---
@app.get("/api/health")
async def health_check():
    """فحص حالة الخدمة"""
    return {
        "status": "healthy",
        "agent": settings.agent.name,
        "version": settings.agent.version,
        "model": settings.openai.model,
        "timestamp": time.time()
    }


# === Main ===
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api:app",
        host=settings.server.host,
        port=settings.server.port,
        reload=settings.server.debug,
        log_level="info"
    )
