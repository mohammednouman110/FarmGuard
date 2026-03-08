from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    phone: str
    location: str
    farm_size: str
    crops: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    language: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ScanResult(BaseModel):
    prediction: str
    confidence: float
    damage_level: str
    damage_label: str
    damage_color: str
    emoji: str
    description: str
    treatment: List[str]
    # Additional fields for frontend compatibility
    disease: Optional[str] = None
    crop: Optional[str] = None
    treatment_organic: Optional[str] = None
    treatment_chemical: Optional[str] = None

class ScanCreate(BaseModel):
    image_url: str
    prediction: str
    confidence: float
    damage_level: str
    damage_label: Optional[str] = None
    damage_color: Optional[str] = None
    emoji: Optional[str] = None
    description: Optional[str] = None
    treatment: Optional[List[str]] = []
    disease: Optional[str] = None
    crop: Optional[str] = None
    treatment_organic: Optional[str] = None
    treatment_chemical: Optional[str] = None

class ClimateInput(BaseModel):
    temp: float
    humidity: float
    rain: float
    wind: float
    crop_type: Optional[str] = "tomato"
    iterations: Optional[int] = 1  # Number of temperature scenarios to calculate

class ClimateResult(BaseModel):
    probability: float
    level: str
    label: str
    emoji: str
    measures: List[str]
    temp_scenario: Optional[float] = None  # Temperature for this scenario
    scenario_index: Optional[int] = None   # Scenario number (1, 2, 3, etc.)

class AlertBase(BaseModel):
    title: str
    type: str
    field: str
    action: str

class AlertCreate(AlertBase):
    pass

class Alert(AlertBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# ==================== Crop Yield Prediction Schemas ====================

class YieldPredictionInput(BaseModel):
    """Input parameters for crop yield prediction"""
    crop_type: str
    rainfall: float  # mm
    temperature: float  # Celsius
    humidity: float  # percentage
    soil_type: str
    fertilizer_usage: float  # kg/hectare
    pest_risk_score: float  # 0-100
    farm_area: float  # hectares

class YieldRecommendation(BaseModel):
    """Individual recommendation for improving yield"""
    category: str
    recommendation: str
    priority: str  # high, medium, low

class YieldPredictionResult(BaseModel):
    """Response for crop yield prediction"""
    predicted_yield: float  # kg/hectare
    predicted_yield_unit: str = "kg/hectare"
    risk_level: str  # low, medium, high, critical
    risk_label: str
    risk_emoji: str
    risk_color: str
    confidence: float  # prediction confidence percentage
    recommendations: list[str]
    detailed_recommendations: list[YieldRecommendation]
    
    # Additional analytics
    yield_factors: dict  # Factor contributions to yield
    historical_comparison: str  # Comparison to typical yield
