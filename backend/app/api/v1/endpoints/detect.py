from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.ml_model import predictor
from app.api.core import config
import app.curd as crud
import app.schemas as schemas
import shutil
import os
from datetime import datetime
from typing import Optional
from jose import JWTError, jwt

router = APIRouter()

# OAuth2 scheme for optional authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{config.settings.API_V1_STR}/auth/login", auto_error=False)


async def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[int]:
    """Get current user ID from token (optional - returns None if not authenticated)"""
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, config.settings.SECRET_KEY, algorithms=["HS256"])
        user_id: int = payload.get("user_id")
        return user_id
    except JWTError:
        return None


# Treatment mappings for different diseases
TREATMENTS = {
    "Early Blight": {
        "organic": "Remove affected leaves. Apply baking soda spray (1 tbsp per liter). Use copper fungicide.",
        "chemical": "Mancozeb 75% WP - 2g per liter. Spray every 10 days. Chlorothalonil also effective."
    },
    "Late Blight": {
        "organic": "Remove and destroy infected plants. Improve air circulation. Apply copper spray.",
        "chemical": "Metalaxyl + Mancozeb. Apply immediately upon first signs. Repeat every 7 days."
    },
    "Leaf Mold": {
        "organic": "Remove lower infected leaves. Improve ventilation. Apply sulfur dust.",
        "chemical": "Chlorothalonil or copper-based fungicide. Spray every 7-10 days."
    },
    "Septoria Leaf Spot": {
        "organic": "Remove infected leaves. Mulch around plants. Apply neem oil spray.",
        "chemical": "Mancozeb or copper oxychloride. Spray every 7-14 days."
    },
    "Spider Mites": {
        "organic": "Spray water forcefully to remove mites. Apply neem oil solution every 3-4 days.",
        "chemical": "Propargite or Abamectin. Spray thoroughly under leaves."
    },
    "Aphids": {
        "organic": "Spray with neem oil solution (5ml per liter). Introduce ladybugs. Wash with soap water.",
        "chemical": "Imidacloprid 17.8% SL - 0.5ml per liter. Acetamiprid also effective."
    },
    "Healthy": {
        "organic": "Continue current practices. Apply preventive neem spray weekly.",
        "chemical": "No treatment needed. Maintain regular crop monitoring."
    }
}

def get_treatments(disease_name):
    """Get treatment recommendations based on disease name"""
    # Find matching disease in treatments dict
    for key, value in TREATMENTS.items():
        if key.lower() in disease_name.lower():
            return value
    # Default to Early Blight treatments if not found
    return TREATMENTS.get("Early Blight", TREATMENTS["Healthy"])

@router.post("/scan", response_model=schemas.ScanResult)
async def scan_crop(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Scan crop image for diseases using XGBoost model"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(400, detail="File must be an image")
    
    # Read image bytes
    image_bytes = await file.read()
    
    # Predict disease
    result = predictor.predict(image_bytes)
    
    # Get treatments based on disease
    disease_name = result.get("prediction", "Healthy")
    treatments = get_treatments(disease_name)
    
    # Extract crop type and disease from prediction (format: "Crop___Disease")
    prediction_parts = disease_name.split("___")
    crop_type = prediction_parts[0] if len(prediction_parts) > 0 else "Tomato"
    disease_type = prediction_parts[1] if len(prediction_parts) > 1 else "Healthy"
    
    # Add additional fields for frontend compatibility
    result["disease"] = disease_type
    result["crop"] = crop_type
    result["treatment_organic"] = treatments["organic"]
    result["treatment_chemical"] = treatments["chemical"]
    
    # Save scan to database (mock user_id=1)
    scan = schemas.ScanCreate(
        image_url=f"/uploads/{file.filename}",
        **result
    )
    crud.create_scan(db, scan, user_id=1)
    
    return result

@router.get("/history")
async def get_scan_history(db: Session = Depends(get_db)):
    """Get recent scan history"""
    return crud.get_recent_scans(db, user_id=1, limit=10)

@router.get("/dashboard-stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics - day, week, month scan counts"""
    stats = crud.get_dashboard_stats(db, user_id=1)
    
    # Format the response for frontend
    return {
        "daily": stats["daily_count"],
        "weekly": stats["weekly_count"],
        "monthly": stats["monthly_count"],
        "total": stats["total_count"],
        "disease_breakdown": stats["disease_breakdown"],
        "recent_scans": [
            {
                "id": scan.id,
                "disease": scan.prediction.split("___")[-1] if "___" in scan.prediction else scan.prediction,
                "confidence": f"{int((scan.confidence or 0) * 100)}%",
                "date": scan.created_at.strftime("%Y-%m-%d %H:%M") if scan.created_at else ""
            }
            for scan in stats["recent_scans"]
        ]
    }
