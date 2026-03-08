from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1.endpoints import detect, climate, chat, alert, crop_yield, auth
from app.api.core.config import settings
from app.database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AgriGuard AI API",
    description="Farmer-friendly crop disease detection API",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files (for uploaded images)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# API Routes
app.include_router(detect.router, prefix="/api/v1/detect", tags=["detect"])
app.include_router(climate.router, prefix="/api/v1/climate", tags=["climate"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(alert.router, prefix="/api/v1/alerts", tags=["alerts"])
app.include_router(crop_yield.router, prefix="/api/v1/yield", tags=["yield"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])

@app.get("/")
async def root():
    return {"message": "🌾 AgriGuard AI Backend - Ready for farmers!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "agriguard-ai"}
