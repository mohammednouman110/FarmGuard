"""
Crop Yield Prediction API endpoint
Uses RandomForest ML model to predict crop yield based on environmental factors
"""

from fastapi import APIRouter, HTTPException
from typing import List
import app.schemas as schemas
from app.ml_model import yield_predictor

router = APIRouter()

@router.post("/predict-yield", response_model=schemas.YieldPredictionResult)
async def predict_yield(prediction_input: schemas.YieldPredictionInput):
    """
    Predict crop yield based on environmental and agricultural factors
    
    Input parameters:
    - crop_type: Type of crop (e.g., rice, wheat, tomato)
    - rainfall: Annual rainfall in mm
    - temperature: Average temperature in Celsius
    - humidity: Average humidity in percentage
    - soil_type: Type of soil (e.g., loamy, clay, sandy)
    - fertilizer_usage: Fertilizer used in kg/hectare
    - pest_risk_score: Pest risk score (0-100)
    - farm_area: Area of farm in hectares
    
    Returns:
    - Predicted yield in kg
    - Risk level (low, medium, high, critical)
    - Recommendations to improve yield
    """
    try:
        # Call the ML model
        result = yield_predictor.predict(
            crop_type=prediction_input.crop_type,
            rainfall=prediction_input.rainfall,
            temperature=prediction_input.temperature,
            humidity=prediction_input.humidity,
            soil_type=prediction_input.soil_type,
            fertilizer_usage=prediction_input.fertilizer_usage,
            pest_risk_score=prediction_input.pest_risk_score,
            farm_area=prediction_input.farm_area
        )
        
        # Build response
        response = schemas.YieldPredictionResult(
            predicted_yield=result["predicted_yield"],
            predicted_yield_unit=result["predicted_yield_unit"],
            risk_level=result["risk_level"],
            risk_label=result["risk_label"],
            risk_emoji=result["risk_emoji"],
            risk_color=result["risk_color"],
            confidence=result["confidence"],
            recommendations=result["recommendations"],
            detailed_recommendations=result["detailed_recommendations"],
            yield_factors=result["yield_factors"],
            historical_comparison=result["historical_comparison"]
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.get("/crop-types")
async def get_crop_types():
    """Get list of supported crop types"""
    return {
        "crops": list(yield_predictor.CROP_BASE_YIELDS.keys())
    }


@router.get("/soil-types")
async def get_soil_types():
    """Get list of supported soil types"""
    return {
        "soils": list(yield_predictor.SOIL_MULTIPLIERS.keys())
    }

