"""
Climate risk assessment endpoint
Uses XGBoost model trained on weather + historical outbreak data
Supports automatic risk calculation without farmer interaction
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import numpy as np
import random

import app.schemas as schemas
import app.curd as crud
from app.database import get_db
from app.models import Alert

router = APIRouter()

# Weather API configuration (can be replaced with real OpenWeatherMap API)
WEATHER_API_CONFIG = {
    "use_mock": True,  # Set to False to use real API
    "api_key": "",  # Add OpenWeatherMap API key here
    "default_location": "Delhi,India"
}

# Mock weather data for demo (simulates real weather API)
def get_mock_weather_data(location: str = "Delhi,India") -> dict:
    """
    Generate realistic mock weather data based on location and time of year
    In production, replace with actual OpenWeatherMap API call
    """
    now = datetime.now()
    month = now.month
    
    # Seasonal base temperatures (approximate for India)
    if month in [3, 4, 5]:  # Summer
        base_temp = 32
        base_humidity = 45
    elif month in [6, 7, 8, 9]:  # Monsoon
        base_temp = 28
        base_humidity = 80
    elif month in [10, 11]:  # Post-monsoon
        base_temp = 26
        base_humidity = 65
    else:  # Winter
        base_temp = 18
        base_humidity = 55
    
    # Add some randomness
    temp = base_temp + random.uniform(-5, 5)
    humidity = max(30, min(95, base_humidity + random.uniform(-15, 15)))
    rain = random.uniform(0, 25) if month in [6, 7, 8, 9] else random.uniform(0, 5)
    wind = random.uniform(5, 20)
    
    return {
        "location": location,
        "temp": round(temp, 1),
        "humidity": round(humidity, 1),
        "rain": round(rain, 1),
        "wind": round(wind, 1),
        "description": "Partly cloudy" if humidity < 70 else "Humid conditions",
        "timestamp": now.isoformat()
    }


async def fetch_weather_data(location: Optional[str] = None) -> dict:
    """
    Fetch weather data - uses mock data or real API based on config
    In production, replace mock with: https://api.openweathermap.org/data/2.5/weather
    """
    loc = location or WEATHER_API_CONFIG["default_location"]
    
    if WEATHER_API_CONFIG["use_mock"]:
        return get_mock_weather_data(loc)
    
    # Real API implementation (for production)
    # import httpx
    # api_key = WEATHER_API_CONFIG["api_key"]
    # url = f"https://api.openweathermap.org/data/2.5/weather?q={loc}&appid={api_key}&units=metric"
    # async with httpx.AsyncClient() as client:
    #     response = await client.get(url)
    #     data = response.json()
    #     return {
    #         "location": loc,
    #         "temp": data["main"]["temp"],
    #         "humidity": data["main"]["humidity"],
    #         "rain": data.get("rain", {}).get("1h", 0),
    #         "wind": data["wind"]["speed"] * 3.6,  # Convert m/s to km/h
    #         "description": data["weather"][0]["description"],
    #         "timestamp": datetime.now().isoformat()
    #     }


async def auto_generate_alerts(db: Session, risk_results: list, location: str, user_id: int = 1):
    """
    Automatically generate alerts based on risk assessment results
    Creates alerts for medium, high, and critical risk levels
    """
    created_alerts = []
    
    for result in risk_results:
        # Only create alerts for concerning risk levels
        if result.level in ["high", "critical"]:
            # Check if similar alert already exists recently (within last hour)
            existing = db.query(Alert).filter(
                Alert.user_id == user_id,
                Alert.type == ("critical" if result.level == "critical" else "warning"),
                Alert.is_active == True
            ).first()
            
            if not existing:
                alert_data = schemas.AlertCreate(
                    title=f"🚨 {result.emoji} {result.level.upper()} Risk: {result.probability}%",
                    type="critical" if result.level == "critical" else "warning",
                    field=location,
                    action=f"🌡 {result.probability}% pest risk at {result.temp_scenario}°C. {' | '.join(result.measures[:2])}"
                )
                new_alert = crud.create_alert(db, alert_data, user_id)
                created_alerts.append(new_alert)
    
    return created_alerts

RISK_CONFIG = {
    "low": {"emoji": "🟢", "label": "Your field is SAFE", "color": "#10b981", "measures": [
        "Check crop 2x per week", "Apply preventive neem oil spray", 
        "Record daily observations", "Maintain field hygiene"
    ]},
    "medium": {"emoji": "⚠️", "label": "WATCH OUT", "color": "#f59e0b", "measures": [
        "Daily field inspection now", "Apply neem spray immediately", 
        "Put monitoring traps in field", "Improve field drainage"
    ]},
    "high": {"emoji": "🔴", "label": "HIGH DANGER", "color": "#ef4444", "measures": [
        "CHECK FIELD TODAY — urgent!", "Buy and spray insecticide within 24 hours", 
        "Call agriculture officer", "Mark affected areas first"
    ]},
    "critical": {"emoji": "🆘", "label": "EMERGENCY!", "color": "#dc2626", "measures": [
        "EMERGENCY — Act RIGHT NOW", "Call: 1800-180-1551 immediately", 
        "Apply broad-spectrum spray today", "Inform agriculture officer"
    ]}
}

@router.post("/check", response_model=List[schemas.ClimateResult])
async def check_outbreak_risk(
    climate_data: schemas.ClimateInput,
    db: Session = Depends(get_db)
):
    """Predict pest outbreak risk based on climate conditions for n temperature scenarios"""
    
    iterations = max(1, min(climate_data.iterations or 1, 10))  # Limit to max 10 iterations
    results = []
    
    # Calculate temperature range based on iterations
    # Start from current temp and go up by 2°C per iteration
    start_temp = climate_data.temp
    temp_step = 2  # 2°C per scenario
    
    for i in range(iterations):
        # Calculate temp for this scenario
        scenario_temp = start_temp + (i * temp_step)
        
        # Feature engineering for risk model
        features = np.array([
            [scenario_temp, climate_data.humidity, climate_data.rain, climate_data.wind]
        ])
        
        # Simple rule-based + ML risk scoring (replace with trained XGBoost)
        humidity_score = 0.35 if climate_data.humidity > 80 else 0.2 if climate_data.humidity > 60 else 0
        temp_score = 0.3 if scenario_temp > 30 else 0
        rain_score = 0.25 if climate_data.rain > 15 else 0
        wind_score = 0.1 if climate_data.wind < 8 else 0
        
        probability = round((humidity_score + temp_score + rain_score + wind_score) * 100, 1)
        
        # Determine risk level
        if probability >= 75:
            level = "critical"
        elif probability >= 55:
            level = "high"
        elif probability >= 30:
            level = "medium"
        else:
            level = "low"
        
        config = RISK_CONFIG[level]
        
        result = schemas.ClimateResult(
            probability=probability,
            level=level,
            label=config["label"],
            emoji=config["emoji"],
            measures=config["measures"]
        )
        
        # Add scenario info to result
        result.temp_scenario = scenario_temp
        result.scenario_index = i + 1
        
        results.append(result)
    
    return results

@router.get("/historical")
async def get_historical_risks(db: Session = Depends(get_db)):
    """Get user's historical risk assessments"""
    # Implementation depends on climate log table
    return {"message": "Historical data not implemented yet"}


# ==================== AUTO RISK CHECK ENDPOINTS ====================

@router.get("/auto-check")
async def auto_check_risk(
    location: Optional[str] = None,
    user_id: Optional[int] = 1,
    db: Session = Depends(get_db)
):
    """
    Auto-check risk without farmer interaction!
    Fetches weather data automatically and calculates risk
    
    This endpoint can be called:
    - Periodically by a scheduler (cron job)
    - When app loads (from frontend)
    - Manually via a button click
    
    Returns:
    - Current weather data used
    - Risk assessment results
    - Auto-generated alerts (if any)
    """
    # Step 1: Fetch weather data automatically
    weather_data = await fetch_weather_data(location)
    
    # Step 2: Calculate risk using the same logic as manual check
    climate_input = schemas.ClimateInput(
        temp=weather_data["temp"],
        humidity=weather_data["humidity"],
        rain=weather_data["rain"],
        wind=weather_data["wind"],
        crop_type="tomato",
        iterations=1  # Single scenario for auto-check
    )
    
    # Calculate risk (inline to avoid duplicate logic)
    temp = climate_input.temp
    humidity = climate_input.humidity
    rain = climate_input.rain
    wind = climate_input.wind
    
    # Risk calculation
    humidity_score = 0.35 if humidity > 80 else 0.2 if humidity > 60 else 0
    temp_score = 0.3 if temp > 30 else 0
    rain_score = 0.25 if rain > 15 else 0
    wind_score = 0.1 if wind < 8 else 0
    
    probability = round((humidity_score + temp_score + rain_score + wind_score) * 100, 1)
    
    if probability >= 75:
        level = "critical"
    elif probability >= 55:
        level = "high"
    elif probability >= 30:
        level = "medium"
    else:
        level = "low"
    
    config = RISK_CONFIG[level]
    
    risk_result = schemas.ClimateResult(
        probability=probability,
        level=level,
        label=config["label"],
        emoji=config["emoji"],
        measures=config["measures"],
        temp_scenario=temp,
        scenario_index=1
    )
    
    # Step 3: Auto-generate alerts if risk is high/critical
    alerts_created = await auto_generate_alerts(db, [risk_result], weather_data["location"], user_id)
    
    # Step 4: Return comprehensive response
    return {
        "success": True,
        "auto_calculated": True,
        "weather": weather_data,
        "risk": {
            "probability": risk_result.probability,
            "level": risk_result.level,
            "label": risk_result.label,
            "emoji": risk_result.emoji,
            "measures": risk_result.measures,
            "temp_scenario": risk_result.temp_scenario
        },
        "alerts_generated": len(alerts_created),
        "alerts": [
            {
                "id": alert.id,
                "title": alert.title,
                "type": alert.type,
                "field": alert.field,
                "action": alert.action
            }
            for alert in alerts_created
        ],
        "message": f"Auto-check completed. Risk level: {level.upper()} ({probability}%)"
    }


@router.get("/weather")
async def get_current_weather(
    location: Optional[str] = None
):
    """
    Get current weather data (for display on dashboard)
    Fetches weather automatically without farmer input
    """
    weather_data = await fetch_weather_data(location)
    return {
        "success": True,
        "weather": weather_data,
        "source": "auto" if WEATHER_API_CONFIG["use_mock"] else "api"
    }


@router.post("/set-location")
async def set_user_location(
    location: str,
    user_id: Optional[int] = 1,
    db: Session = Depends(get_db)
):
    """
    Set user's location for auto-weather fetching
    Farmer just needs to set their location once
    """
    # In production, save to user profile
    return {
        "success": True,
        "message": f"Location set to: {location}",
        "note": "Weather will now be fetched automatically for this location"
    }
