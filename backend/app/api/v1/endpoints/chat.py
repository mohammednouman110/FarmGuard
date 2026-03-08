"""
Chat AI endpoint for AgriGuard farmer assistant
Provides AI-powered answers to farmer questions about crops, diseases, treatments
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import random

from app.database import get_db

router = APIRouter()

class ChatRequest(BaseModel):
    question: str
    user_id: Optional[str] = "1"
    lang: Optional[str] = "en"

class ChatResponse(BaseModel):
    response: str
    language: str

# Knowledge base for farming questions
KNOWLEDGE_BASE = {
    "en": {
        "default": "I recommend consulting your local agriculture officer or calling the Kisan Helpline at 1800-180-1551 for personalized advice.",
        "pesticide": "For pest control, you can use: Neem oil (organic) - 5ml per liter water, spray every 7 days. Chemical: Imidacloprid 17.8% - 0.5ml per liter. Always follow label instructions!",
        "disease": "Common crop diseases include: 1) Powdery mildew - spray with sulfur fungicide. 2) Blight - apply mancozeb. 3) Rust - use copper fungicide. Remove affected leaves immediately.",
        "water": "Most crops need 2-3 cm of water per week. Water early morning to prevent evaporation. Avoid wetting leaves to prevent fungal diseases.",
        "fertilizer": "Use NPK fertilizers based on crop needs: Rice needs more nitrogen, pulse crops need phosphorus. Organic options: compost, vermicompost, cow dung.",
        "harvest": "Harvest when: grains turn golden, fruits become fully colored, leaves begin to yellow. Harvest in morning for better shelf life.",
        "weather": "Check weather forecast before farming activities. Avoid spraying pesticides when rain is expected within 6 hours.",
    },
    "hi": {
        "default": "मैं आपको सलाह देता हूं कि स्थानिक कृषि अधिकारी से मिलें या किसान हेल्पलाइन 1800-180-1551 पर कॉल करें।",
        "pesticide": "कीट नियंत्रण के लिए: नीम तेल (जैविक) - 5ml प्रति लीटर पानी, हर 7 दिन में स्प्रे करें। रासायनिक: इमिडाक्लोप्रिड 17.8% - 0.5ml प्रति लीटर।",
        "disease": "आम फसल रोग: 1) चूर्णिल आसिता - सल्फर फफूंदनाशक स्प्रे करें। 2) ब्लाइट - मैंकोजेब लगाएं। प्रभावित पत्तियों को तुरंत हटाएं।",
        "water": "अधिकांश फसलों को प्रति सप्ताह 2-3 सेमी पानी की जरूरत होती है। सुबह जल्दी पानी दें। पत्तियों को गीला न करें।",
        "fertilizer": "फसल की जरूरत के अनुसार NPK उर्वरक का उपयोग करें: धान को नाइट्रोजन की ज्यादा जरूरत। जैविक: खाद, वर्मीकम्पोस्ट।",
    }
}

@router.post("/ask", response_model=ChatResponse)
async def ask_kisan_ai(
    chat_request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    AI-powered chat for farmer questions
    Provides answers about crops, diseases, pesticides, weather, etc.
    """
    question = chat_request.question.lower()
    lang = chat_request.lang or "en"
    
    # Ensure language support
    if lang not in KNOWLEDGE_BASE:
        lang = "en"
    
    # Simple keyword matching for responses
    response = KNOWLEDGE_BASE[lang]["default"]
    
    keywords = {
        "pesticide": ["pesticide", "insect", "bug", "pest", "spray", "insecticide", "कीटनाशक", "दवा"],
        "disease": ["disease", "blight", "fungus", "rot", " mildew", "rust", "रोग", "फफूंद"],
        "water": ["water", "irrigation", "rain", " drought", "पानी", "सिंचाई"],
        "fertilizer": ["fertilizer", " manure", "compost", "npk", "खाद", "उर्वरक"],
        "harvest": ["harvest", "ready", "crop", "cut", "फसल", "कटाई"],
        "weather": ["weather", "rain", "monsoon", "storm", "मौसम", "बारिश"],
    }
    
    for key, words in keywords.items():
        for word in words:
            if word in question:
                response = KNOWLEDGE_BASE[lang].get(key, KNOWLEDGE_BASE[lang]["default"])
                break
    
    # Add some variation to responses
    greetings = {
        "en": ["Namaste!", "Hello farmer!", "Jai Jawan Jai Kisan!"],
        "hi": ["नमस्ते किसान!", "क्या मदद चाहिए?"]
    }
    
    prefix = random.choice(greetings.get(lang, greetings["en"]))
    full_response = f"{prefix} {response}"
    
    return ChatResponse(
        response=full_response,
        language=lang
    )

