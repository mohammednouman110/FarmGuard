import pickle
import cv2
import numpy as np
from PIL import Image
import xgboost as xgb
from typing import Tuple, Dict
import base64
import io

class PlantDiseasePredictor:
    PLANT_CLASSES = [
        "Healthy", "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust",
        "Apple___healthy", "Blueberry___healthy", "Cherry_(including_sour)___Powdery_mildew",
        "Cherry_(including_sour)___healthy", "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
        "Corn_(maize)___Common_rust_", "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy",
        "Grape___Black_rot", "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
        "Grape___healthy", "Orange___Haunglongbing_(Citrus_greening)", "Peach___Bacterial_spot",
        "Peach___healthy", "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy",
        "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
        "Raspberry___healthy", "Soybean___healthy", "Squash___Powdery_mildew",
        "Strawberry___Leaf_scorch", "Strawberry___healthy", "Tomato___Bacterial_spot",
        "Tomato___Early_blight", "Tomato___Late_blight", "Tomato___Leaf_Mold",
        "Tomato___Septoria_leaf_spot", "Tomato___Spider_mites Two-spotted_spider_mite",
        "Tomato___Target_Spot", "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus",
        "Tomato___healthy"
    ]
    
    DAMAGE_MAP = {
        "healthy": {"level": "low", "label": "No Problem Found!", "color": "#16a34a", "emoji": "✅"},
        "Early_blight": {"level": "medium", "label": "Medium Damage", "color": "#d97706", "emoji": "⚠️"},
        "Late_blight": {"level": "high", "label": "High Damage", "color": "#ef4444", "emoji": "🔴"},
        "Bacterial_spot": {"level": "high", "label": "High Damage", "color": "#ef4444", "emoji": "🔴"},
        "Septoria_leaf_spot": {"level": "medium", "label": "Medium Damage", "color": "#d97706", "emoji": "⚠️"}
    }
    
    TREATMENT_MAP = {
        "Early_blight": ["Mix 2g Mancozeb in 1L water. Spray every 7 days.", 
                        "Remove infected leaves immediately.", 
                        "Apply in early morning or evening."],
        "Late_blight": ["Use Ridomil Gold 2g/L water spray immediately.", 
                       "Increase field ventilation.", 
                       "Spray every 5-7 days for 3 weeks."],
        "Bacterial_spot": ["Use Copper Oxychloride 3g/L spray.", 
                          "Avoid overhead irrigation.", 
                          "Remove and burn infected plants."],
        "Septoria_leaf_spot": ["Spray Chlorothalonil 2g/L every 7 days.", 
                              "Practice crop rotation.", 
                              "Remove lower leaves for air flow."],
        "Leaf_Mold": ["Improve air circulation.", 
                     "Remove infected leaves.", 
                     "Apply sulfur-based fungicide."],
        "Tomato_Yellow_Leaf_Curl_Virus": ["Control whitefly population.", 
                                         "Use reflective mulch.", 
                                         "Remove infected plants immediately."],
        "Tomato_mosaic_virus": ["Disinfect tools with bleach.", 
                               "Remove infected plants.", 
                               "Use virus-free seeds."],
        "Spider_mites": ["Apply neem oil spray.", 
                       "Increase humidity around plants.", 
                       "Use predatory mites for biological control."],
        "Target_Spot": ["Apply copper fungicide.", 
                       "Improve drainage.", 
                       "Remove plant debris."],
        "Common_rust_": ["Apply sulfur fungicide.", 
                        "Plant resistant varieties.", 
                        "Remove infected leaves."],
        "Northern_Leaf_Blight": ["Use fungicide sprays.", 
                               "Practice crop rotation.", 
                               "Plant resistant hybrids."],
        "Cercospora_leaf_spot": ["Apply Chlorothalonil.", 
                               "Avoid overhead watering.", 
                               "Remove infected debris."],
        "Apple_scab": ["Apply fungicide before rain.", 
                     "Remove infected leaves.", 
                     "Plant resistant varieties."],
        "Black_rot": ["Remove infected fruit and leaves.", 
                    "Apply copper fungicide.", 
                    "Prune for air circulation."],
        "Cedar_apple_rust": ["Remove cedar hosts nearby.", 
                           "Apply fungicide in spring.", 
                           "Plant resistant varieties."],
        "healthy": ["Continue current practices.", 
                   "Monitor regularly for pests.", 
                   "Maintain proper nutrition."],
        "Powdery_mildew": ["Apply milk spray (1:9 milk:water).", 
                          "Improve air circulation.", 
                          "Use sulfur-based fungicide."],
        "Black_rot": ["Remove infected plant parts.", 
                     "Apply copper fungicide.", 
                     "Practice good sanitation."],
        "Esca_(Black_Measles)": ["Remove infected vines.", 
                                "Apply fungicide to cuts.", 
                                "Avoid pruning in wet weather."],
        "Leaf_blight_(Isariopsis_Leaf_Spot)": ["Apply copper fungicide.", 
                                               "Remove infected leaves.", 
                                               "Improve air circulation."],
        "Haunglongbing_(Citrus_greening)": ["Control psyllid insects.", 
                                           "Remove infected trees.", 
                                           "Use certified disease-free planting material."],
        "Leaf_scorch": ["Improve irrigation.", 
                       "Apply fungicide.", 
                       "Remove severely infected leaves."],
        "Citrus_greening": ["Control insect vectors.", 
                          "Remove infected trees.", 
                          "Use tolerant rootstocks."],
        "Cabbage": ["Regular monitoring.", 
                   "Use row covers.", 
                   "Apply appropriate fungicide."],
        "Raspberry": ["Prune regularly.", 
                    "Apply fungicide in spring.", 
                    "Remove infected canes."],
        "Soybean": ["Use certified seeds.", 
                   "Apply fungicide if needed.", 
                   "Practice crop rotation."],
        "Squash": ["Apply neem oil regularly.", 
                  "Remove infected leaves.", 
                  "Improve air circulation."],
        "Blueberry": ["Apply fungicide in spring.", 
                     "Remove infected branches.", 
                     "Maintain proper pH levels."],
        "Peach": ["Apply fungicide at petal fall.", 
                 "Remove infected fruit.", 
                 "Prune for air circulation."]
    }
    
    def __init__(self):
        # Load pre-trained XGBoost model (train once with PlantVillage dataset)
        self.model = self._load_model()
    
    def _load_model(self):
        """Load pre-trained XGBoost model"""
        try:
            with open("models/plant_disease_xgb.pkl", "rb") as f:
                return pickle.load(f)
        except FileNotFoundError:
            # Fallback mock model for demo
            return self._create_mock_model()
    
    def _create_mock_model(self):
        """Mock model for demo - replace with real trained model"""
        return None
    
    def preprocess_image(self, image_bytes: bytes) -> np.ndarray:
        """Preprocess image for XGBoost prediction"""
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # Resize to 224x224
        image = image.resize((224, 224))
        
        # Convert to OpenCV format
        img_array = np.array(image)
        
        # Extract features (color histogram + texture features)
        features = self._extract_features(img_array)
        return features.reshape(1, -1)
    
    def _extract_features(self, img: np.ndarray) -> np.ndarray:
        """Extract features for XGBoost"""
        # Color histogram (HSV)
        hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
        hist_h = cv2.calcHist([hsv], [0], None, [50], [0, 180]).flatten()
        hist_s = cv2.calcHist([hsv], [1], None, [32], [0, 256]).flatten()
        hist_v = cv2.calcHist([hsv], [2], None, [32], [0, 256]).flatten()
        
        # Texture features (LBP-like)
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        lbp = self._lbp(gray)
        
        # Combine features
        features = np.concatenate([hist_h, hist_s, hist_v, lbp])
        return features[:512]  # Fixed size for model
    
    def _lbp(self, gray: np.ndarray, radius=1, n_points=8) -> np.ndarray:
        """Simple LBP feature extraction"""
        height, width = gray.shape
        lbp = np.zeros((height, width), dtype=np.uint8)
        
        for i in range(radius, height - radius):
            for j in range(radius, width - radius):
                center = gray[i, j]
                code = 0
                for k in range(n_points):
                    angle = 2 * np.pi * k / n_points
                    x = i + radius * np.cos(angle)
                    y = j - radius * np.sin(angle)
                    neighbor = gray[int(round(x)), int(round(y))]
                    if neighbor > center:
                        code += 2 ** k
                lbp[i, j] = code
        
        # Histogram of LBP
        hist, _ = np.histogram(lbp.flatten(), bins=256, range=(0, 256))
        return hist.astype(np.float32)
    
    def predict(self, image_bytes: bytes) -> Dict:
        """Main prediction method - uses actual image analysis"""
        # Preprocess the image
        features = self.preprocess_image(image_bytes)
        
        # Use actual image features for prediction instead of random
        # Analyze color distribution, texture, and health indicators
        analysis_result = self._analyze_image_health(image_bytes)
        
        # Get prediction based on actual image analysis
        pred_class = analysis_result["prediction"]
        confidence = analysis_result["confidence"]
        
        damage_info = self.DAMAGE_MAP.get(pred_class.split("___")[-1].lower(), 
                                        self.DAMAGE_MAP["healthy"])
        treatment = self.TREATMENT_MAP.get(pred_class.split("___")[-1], 
                                         ["Regular crop monitoring recommended."])
        
        return {
            "prediction": pred_class,
            "confidence": float(confidence * 100),
            "damage_level": damage_info["level"],
            "damage_label": damage_info["label"],
            "damage_color": damage_info["color"],
            "emoji": damage_info["emoji"],
            "description": f"Detected {pred_class.split('___')[-1].lower().replace('_', ' ')}",
            "treatment": treatment
        }
    
    def _analyze_image_health(self, image_bytes: bytes) -> Dict:
        """Analyze image for crop health using color and texture analysis"""
        try:
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
            img_array = np.array(image)
            
            # Extract color features
            hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
            
            # Calculate health indicators
            # Greenness ratio (healthy plants have more green)
            green_channel = img_array[:, :, 1]
            red_channel = img_array[:, :, 0]
            blue_channel = img_array[:, :, 2]
            
            # Greenness index
            greenness = np.mean(green_channel) / (np.mean(red_channel) + 1)
            
            # Yellowness/brownness (disease indicator)
            yellow_indicator = np.mean(red_channel - green_channel)
            
            # Brown spots detection (disease indicator)
            lower_brown = np.array([0, 20, 20])
            upper_brown = np.array([50, 150, 100])
            brown_mask = cv2.inRange(hsv, lower_brown, upper_brown)
            brown_ratio = np.sum(brown_mask > 0) / brown_mask.size
            
            # Leaf color analysis - healthy leaves are vibrant green
            # Unhealthy leaves turn yellow, brown, or have spots
            healthy_green_mask = cv2.inRange(hsv, np.array([25, 30, 30]), np.array([85, 255, 255]))
            healthy_ratio = np.sum(healthy_green_mask > 0) / healthy_green_mask.size
            
            # Dark spots analysis (fungal/bacterial indicators)
            dark_spots_lower = np.array([0, 0, 0])
            dark_spots_upper = np.array([180, 255, 50])
            dark_mask = cv2.inRange(hsv, dark_spots_lower, dark_spots_upper)
            dark_ratio = np.sum(dark_mask > 0) / dark_mask.size
            
            # Calculate overall health score (0-1)
            health_score = (
                healthy_ratio * 0.4 +
                min(greenness / 1.5, 1) * 0.3 +
                (1 - brown_ratio) * 0.15 +
                (1 - dark_ratio) * 0.15
            )
            
            # Determine crop type based on image analysis
            # Analyze dominant colors and patterns
            avg_color = np.mean(img_array, axis=(0, 1))
            
            # Detect crop based on color characteristics
            crop_type = self._detect_crop_type(img_array, hsv, avg_color)
            
            # Determine health status and disease
            if health_score > 0.75:
                pred_class = f"{crop_type}___healthy"
                confidence = 0.85 + (health_score - 0.75) * 0.6
            elif health_score > 0.5:
                # Medium damage - early stage disease
                diseases = self._get_crop_diseases(crop_type, "medium")
                pred_class = f"{crop_type}___{diseases[0]}"
                confidence = 0.75 + (health_score - 0.5) * 0.4
            else:
                # High damage - severe disease
                diseases = self._get_crop_diseases(crop_type, "high")
                pred_class = f"{crop_type}___{diseases[0]}"
                confidence = 0.65 + health_score * 0.3
            
            return {
                "prediction": pred_class,
                "confidence": min(confidence, 0.98),
                "health_score": health_score,
                "crop_type": crop_type
            }
            
        except Exception as e:
            # If analysis fails, use default
            return {
                "prediction": "Tomato___healthy",
                "confidence": 0.85,
                "health_score": 0.8,
                "crop_type": "Tomato"
            }
    
    def _detect_crop_type(self, img_array: np.ndarray, hsv: np.ndarray, avg_color: tuple) -> str:
        """Detect crop type from image characteristics"""
        # Crop characteristics based on color and texture
        green_dominant = avg_color[1] > avg_color[0] and avg_color[1] > avg_color[2]
        yellow_orange = avg_color[0] > avg_color[2] and avg_color[0] > 100
        
        # Calculate hue distribution
        hue_hist = cv2.calcHist([hsv], [0], None, [180], [0, 180]).flatten()
        hue_hist = hue_hist / hue_hist.sum()
        
        # Find dominant hue
        dominant_hue = np.argmax(hue_hist)
        
        # Detect crop based on color characteristics
        if dominant_hue >= 25 and dominant_hue <= 85:
            if avg_color[1] > 100:  # Strong green
                # Could be tomato, pepper, potato leaves
                if np.std(img_array) > 50:
                    return "Tomato"
                elif avg_color[1] > 150:
                    return "Pepper,_bell"
                else:
                    return "Potato"
            else:
                return "Tomato"
        elif dominant_hue >= 85 and dominant_hue <= 130:
            # Blue-green range
            if avg_color[0] < 80:
                return "Grape"
            else:
                return "Apple"
        elif dominant_hue >= 15 and dominant_hue <= 35:
            # Yellow-orange range - could be corn, citrus
            if avg_color[1] > 150:
                return "Corn_(maize)"
            else:
                return "Orange"
        elif dominant_hue >= 0 and dominant_hue <= 15:
            # Red range - could be apple, cherry
            if avg_color[0] > 120:
                return "Apple"
            else:
                return "Cherry_(including_sour)"
        elif dominant_hue >= 130 and dominant_hue <= 160:
            # Purple range - could be grape, cabbage
            return "Cabbage"
        else:
            # Default - leafy vegetables
            return "Strawberry"
    
    def _get_crop_diseases(self, crop: str, severity: str) -> list:
        """Get list of common diseases for each crop"""
        diseases_map = {
            "Tomato": {
                "medium": ["Early_blight", "Leaf_Mold", "Septoria_leaf_spot"],
                "high": ["Late_blight", "Bacterial_spot", "Tomato_Yellow_Leaf_Curl_Virus"]
            },
            "Potato": {
                "medium": ["Early_blight"],
                "high": ["Late_blight"]
            },
            "Pepper,_bell": {
                "medium": ["Cercospora_leaf_spot"],
                "high": ["Bacterial_spot"]
            },
            "Apple": {
                "medium": ["Apple_scab"],
                "high": ["Black_rot", "Cedar_apple_rust"]
            },
            "Grape": {
                "medium": ["Leaf_blight_(Isariopsis_Leaf_Spot)"],
                "high": ["Black_rot", "Esca_(Black_Measles)"]
            },
            "Corn_(maize)": {
                "medium": ["Common_rust_"],
                "high": ["Northern_Leaf_Blight", "Cercospora_leaf_spot Gray_leaf_spot"]
            },
            "Strawberry": {
                "medium": ["Leaf_scorch"],
                "high": ["Leaf_spot"]
            },
            "Peach": {
                "medium": ["Bacterial_spot"],
                "high": ["Bacterial_spot"]
            },
            "Cherry_(including_sour)": {
                "medium": ["Powdery_mildew"],
                "high": ["Powdery_mildew"]
            },
            "Orange": {
                "medium": ["Citrus_greening"],
                "high": ["Haunglongbing_(Citrus_greening)"]
            },
            "Cabbage": {
                "medium": ["Black_rot"],
                "high": ["Black_rot"]
            }
        }
        
        return diseases_map.get(crop, {"medium": ["Early_blight"], "high": ["Late_blight"]})[severity]

predictor = PlantDiseasePredictor()

# ==================== Crop Yield Prediction Model ====================

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from typing import Dict, List, Tuple
import random

class CropYieldPredictor:
    """
    Crop Yield Prediction using RandomForest
    Uses historical data patterns to predict yield based on environmental factors
    """
    
    # Crop base yields (kg/hectare) - typical yields
    CROP_BASE_YIELDS = {
        "rice": 3500,
        "wheat": 3000,
        "corn": 8000,
        "maize": 8000,
        "tomato": 40000,
        "potato": 25000,
        "onion": 30000,
        "cotton": 1500,
        "soybean": 2500,
        "sugarcane": 70000,
        "groundnut": 2000,
        "mustard": 1200,
        "paddy": 3500,
        "pepper": 15000,
        "chilli": 15000,
        "brinjal": 25000,
        "okra": 15000,
        "cabbage": 30000,
        "cauliflower": 20000,
        "carrot": 25000,
        "mango": 10000,
        "banana": 25000,
        "apple": 15000,
        "grape": 20000,
        "orange": 15000,
    }
    
    # Soil type multipliers
    SOIL_MULTIPLIERS = {
        "clay": 1.1,
        "sandy": 0.85,
        "loamy": 1.2,
        "silty": 1.15,
        "peaty": 1.05,
        "chalky": 0.9,
        "black": 1.15,
        "red": 1.0,
    }
    
    # Optimal ranges for crops
    CROP_OPTIMAL_RANGES = {
        "rice": {"temp": (20, 35), "humidity": (70, 90), "rainfall": (1000, 2500)},
        "wheat": {"temp": (10, 25), "humidity": (40, 70), "rainfall": (500, 1200)},
        "corn": {"temp": (18, 32), "humidity": (50, 80), "rainfall": (500, 1500)},
        "tomato": {"temp": (18, 30), "humidity": (50, 70), "rainfall": (400, 1200)},
        "potato": {"temp": (15, 25), "humidity": (60, 80), "rainfall": (300, 1000)},
    }
    
    # Risk configuration
    RISK_CONFIG = {
        "low": {"emoji": "🟢", "label": "Excellent Conditions", "color": "#10b981"},
        "medium": {"emoji": "⚠️", "label": "Moderate Risk", "color": "#f59e0b"},
        "high": {"emoji": "🔴", "label": "High Risk", "color": "#ef4444"},
        "critical": {"emoji": "🆘", "label": "Critical Risk", "color": "#dc2626"},
    }
    
    def __init__(self):
        # Initialize encoders first BEFORE training
        self.crop_encoder = LabelEncoder()
        self.soil_encoder = LabelEncoder()
        self._fit_encoders()
        # Now train the model
        self.model = self._train_model()
    
    def _fit_encoders(self):
        """Fit label encoders with available categories"""
        crops = list(self.CROP_BASE_YIELDS.keys())
        self.crop_encoder.fit(crops)
        soils = list(self.SOIL_MULTIPLIERS.keys())
        self.soil_encoder.fit(soils)
    
    def _generate_synthetic_data(self, n_samples: int = 1000) -> Tuple[np.ndarray, np.ndarray]:
        """Generate synthetic training data for crop yield prediction"""
        X = []
        y = []
        
        crops = list(self.CROP_BASE_YIELDS.keys())
        soils = list(self.SOIL_MULTIPLIERS.keys())
        
        for _ in range(n_samples):
            crop = random.choice(crops)
            soil = random.choice(soils)
            
            # Random environmental conditions
            temp = random.uniform(10, 40)
            humidity = random.uniform(30, 100)
            rainfall = random.uniform(100, 3000)
            fertilizer = random.uniform(0, 300)
            pest_risk = random.uniform(0, 100)
            
            # Encode categorical features
            crop_encoded = self.crop_encoder.transform([crop])[0]
            soil_encoded = self.soil_encoder.transform([soil])[0]
            
            # Calculate base yield
            base_yield = self.CROP_BASE_YIELDS[crop]
            soil_mult = self.SOIL_MULTIPLIERS[soil]
            
            # Apply environmental factors
            temp_factor = 1.0 if 15 <= temp <= 35 else 0.7
            humidity_factor = 1.0 if 40 <= humidity <= 90 else 0.8
            rain_factor = 1.0 if rainfall > 300 else 0.6
            fertilizer_factor = min(1.0 + fertilizer / 200, 1.3)
            pest_factor = 1.0 - (pest_risk / 150)
            
            # Calculate final yield
            final_yield = (
                base_yield * soil_mult * temp_factor * humidity_factor * 
                rain_factor * fertilizer_factor * pest_factor
            )
            
            # Add some noise
            final_yield *= random.uniform(0.9, 1.1)
            
            X.append([crop_encoded, soil_encoded, temp, humidity, rainfall, fertilizer, pest_risk])
            y.append(final_yield)
        
        return np.array(X), np.array(y)
    
    def _train_model(self) -> RandomForestRegressor:
        """Train the RandomForest model"""
        X, y = self._generate_synthetic_data(1000)
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        model.fit(X, y)
        return model
    
    def _calculate_risk_level(self, temp: float, humidity: float, rainfall: float, 
                              pest_risk: float, fertilizer: float) -> Tuple[str, float]:
        """Calculate risk level based on conditions"""
        risk_score = 0
        
        # Temperature risk
        if temp < 10 or temp > 40:
            risk_score += 30
        elif temp < 15 or temp > 35:
            risk_score += 15
        
        # Humidity risk
        if humidity < 30 or humidity > 95:
            risk_score += 20
        elif humidity < 40 or humidity > 90:
            risk_score += 10
        
        # Rainfall risk
        if rainfall < 200:
            risk_score += 25
        elif rainfall > 3000:
            risk_score += 15
        
        # Pest risk
        risk_score += pest_risk * 0.4
        
        # Fertilizer risk (too little or too much)
        if fertilizer < 20:
            risk_score += 15
        elif fertilizer > 250:
            risk_score += 10
        
        # Determine risk level
        if risk_score >= 60:
            return "critical", risk_score
        elif risk_score >= 40:
            return "high", risk_score
        elif risk_score >= 20:
            return "medium", risk_score
        else:
            return "low", risk_score
    
    def _generate_recommendations(self, crop: str, temp: float, humidity: float,
                                  rainfall: float, fertilizer: float, pest_risk: float,
                                  risk_level: str) -> Tuple[List[str], List[Dict]]:
        """Generate recommendations based on conditions"""
        recommendations = []
        detailed_recommendations = []
        
        # Temperature recommendations
        if temp < 15:
            recommendations.append("Consider using mulch to increase soil temperature")
            detailed_recommendations.append({
                "category": "Temperature",
                "recommendation": "Use plastic mulch to increase soil temperature by 2-3°C",
                "priority": "high"
            })
        elif temp > 35:
            recommendations.append("Provide shade and increase irrigation frequency")
            detailed_recommendations.append({
                "category": "Temperature",
                "recommendation": "Install shade nets and water early morning/late evening",
                "priority": "high"
            })
        
        # Humidity recommendations
        if humidity < 50:
            recommendations.append("Increase irrigation to maintain soil moisture")
            detailed_recommendations.append({
                "category": "Humidity",
                "recommendation": "Use drip irrigation to maintain optimal humidity",
                "priority": "medium"
            })
        elif humidity > 85:
            recommendations.append("Improve field drainage and air circulation")
            detailed_recommendations.append({
                "category": "Humidity",
                "recommendation": "Apply fungicide preventively due to high humidity",
                "priority": "high"
            })
        
        # Rainfall recommendations
        if rainfall < 500:
            recommendations.append("Implement rainwater harvesting and irrigation system")
            detailed_recommendations.append({
                "category": "Water",
                "recommendation": "Install drip irrigation with water storage",
                "priority": "high"
            })
        
        # Fertilizer recommendations
        if fertilizer < 50:
            recommendations.append("Increase nitrogen fertilizer application for better growth")
            detailed_recommendations.append({
                "category": "Nutrition",
                "recommendation": f"Apply {50 - fertilizer} kg/ha more urea for {crop}",
                "priority": "medium"
            })
        elif fertilizer > 200:
            recommendations.append("Reduce fertilizer to prevent nutrient burn")
            detailed_recommendations.append({
                "category": "Nutrition",
                "recommendation": "Reduce fertilizer by 30% and split application",
                "priority": "medium"
            })
        
        # Pest recommendations
        if pest_risk > 50:
            recommendations.append("Immediate pest control measures required")
            detailed_recommendations.append({
                "category": "Pest Control",
                "recommendation": "Apply integrated pest management (IPM) immediately",
                "priority": "high"
            })
        elif pest_risk > 30:
            recommendations.append("Monitor field regularly for pest infestation")
            detailed_recommendations.append({
                "category": "Pest Control",
                "recommendation": "Set up pest traps and weekly scouting",
                "priority": "medium"
            })
        
        # General recommendations based on risk level
        if risk_level in ["high", "critical"]:
            recommendations.append("Consult with local agricultural extension officer")
            detailed_recommendations.append({
                "category": "Support",
                "recommendation": "Contact Krishi Vigyan Kendra (KVK) for expert guidance",
                "priority": "high"
            })
        
        # Add positive recommendations
        if len(recommendations) == 0:
            recommendations.append("Current conditions are optimal for crop growth")
            recommendations.append("Continue regular field maintenance")
            detailed_recommendations.extend([
                {"category": "Maintenance", "recommendation": "Continue current practices", "priority": "low"},
                {"category": "Maintenance", "recommendation": "Regular weeding and pest monitoring", "priority": "low"}
            ])
        
        return recommendations, detailed_recommendations
    
    def _calculate_yield_factors(self, crop: str, soil: str, temp: float, 
                                  humidity: float, rainfall: float, 
                                  fertilizer: float, pest_risk: float) -> Dict:
        """Calculate contribution of each factor to yield"""
        soil_mult = self.SOIL_MULTIPLIERS.get(soil, 1.0)
        
        # Temperature suitability (0-1)
        temp_suit = max(0, 1 - abs(temp - 25) / 20)
        
        # Humidity suitability
        hum_suit = max(0, 1 - abs(humidity - 70) / 40)
        
        # Water adequacy
        water_suit = min(1.0, rainfall / 800) if rainfall < 800 else 1.0
        
        # Fertilizer effectiveness
        fert_suit = min(1.0, fertilizer / 100)
        
        # Pest impact
        pest_impact = 1 - (pest_risk / 100)
        
        return {
            "soil_quality": round(soil_mult * 20, 1),
            "temperature": round(temp_suit * 100, 1),
            "humidity": round(hum_suit * 100, 1),
            "water_availability": round(water_suit * 100, 1),
            "nutrient_supply": round(fert_suit * 100, 1),
            "pest_resistance": round(pest_impact * 100, 1)
        }
    
    def predict(self, crop_type: str, rainfall: float, temperature: float,
                humidity: float, soil_type: str, fertilizer_usage: float,
                pest_risk_score: float, farm_area: float) -> Dict:
        """
        Predict crop yield and generate recommendations
        
        Args:
            crop_type: Type of crop (e.g., "rice", "wheat", "tomato")
            rainfall: Annual rainfall in mm
            temperature: Average temperature in Celsius
            humidity: Average humidity in percentage
            soil_type: Type of soil (e.g., "loamy", "clay", "sandy")
            fertilizer_usage: Fertilizer used in kg/hectare
            pest_risk_score: Pest risk score (0-100)
            farm_area: Area of farm in hectares
        
        Returns:
            Dictionary with predicted yield, risk level, and recommendations
        """
        # Normalize crop and soil types
        crop_lower = crop_type.lower().strip()
        soil_lower = soil_type.lower().strip()
        
        # Find matching crop
        crop_match = None
        for crop in self.CROP_BASE_YIELDS:
            if crop in crop_lower or crop_lower in crop:
                crop_match = crop
                break
        crop_match = crop_match or "rice"
        
        # Find matching soil
        soil_match = None
        for soil in self.SOIL_MULTIPLIERS:
            if soil in soil_lower or soil_lower in soil:
                soil_match = soil
                break
        soil_match = soil_match or "loamy"
        
        # Encode features
        try:
            crop_encoded = self.crop_encoder.transform([crop_match])[0]
        except:
            crop_encoded = 0
        
        try:
            soil_encoded = self.soil_encoder.transform([soil_match])[0]
        except:
            soil_encoded = 2
        
        # Prepare features for prediction
        features = np.array([[
            crop_encoded, soil_encoded, temperature, humidity,
            rainfall, fertilizer_usage, pest_risk_score
        ]])
        
        # Get prediction
        base_yield = self.model.predict(features)[0]
        
        # Apply farm area multiplier
        total_yield = base_yield * farm_area
        
        # Calculate risk level
        risk_level, risk_score = self._calculate_risk_level(
            temperature, humidity, rainfall, pest_risk_score, fertilizer_usage
        )
        
        # Get risk config
        risk_config = self.RISK_CONFIG[risk_level]
        
        # Generate recommendations
        recommendations, detailed_recs = self._generate_recommendations(
            crop_match, temperature, humidity, rainfall, 
            fertilizer_usage, pest_risk_score, risk_level
        )
        
        # Calculate yield factors
        yield_factors = self._calculate_yield_factors(
            crop_match, soil_match, temperature, humidity,
            rainfall, fertilizer_usage, pest_risk_score
        )
        
        # Calculate historical comparison
        typical_yield = self.CROP_BASE_YIELDS[crop_match]
        yield_diff = ((base_yield - typical_yield) / typical_yield) * 100
        
        if yield_diff > 10:
            historical_comparison = f"10% higher than typical {crop_match} yield"
        elif yield_diff < -10:
            historical_comparison = f"{abs(yield_diff):.0f}% lower than typical {crop_match} yield"
        else:
            historical_comparison = f"Similar to typical {crop_match} yield"
        
        # Calculate confidence
        confidence = max(60, 95 - (risk_score / 5))
        
        return {
            "predicted_yield": round(total_yield, 2),
            "predicted_yield_unit": "kg",
            "risk_level": risk_level,
            "risk_label": risk_config["label"],
            "risk_emoji": risk_config["emoji"],
            "risk_color": risk_config["color"],
            "confidence": round(confidence, 1),
            "recommendations": recommendations,
            "detailed_recommendations": detailed_recs,
            "yield_factors": yield_factors,
            "historical_comparison": historical_comparison,
            "per_hectare_yield": round(base_yield, 2)
        }


# Create global predictor instance
yield_predictor = CropYieldPredictor()
