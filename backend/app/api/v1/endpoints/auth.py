"""
Authentication endpoints for AgriGuard AI
Phone-based login for farmers (no password required)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.database import get_db
from app import models
from app.api.core import config
from app.api.core.security import create_access_token, verify_farmer_phone

router = APIRouter()

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{config.settings.API_V1_STR}/auth/login")


# ==================== Schemas ====================

class PhoneLoginRequest(BaseModel):
    """Login request with phone number"""
    phone: str
    name: Optional[str] = None  # Optional for login, required for registration


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str
    user: dict


class UserResponse(BaseModel):
    """User info response"""
    id: int
    name: str
    phone: str
    location: Optional[str] = None
    farm_size: Optional[str] = None
    crops: Optional[str] = None
    language: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Helper Functions ====================

def get_user_by_phone(db: Session, phone: str):
    """Get user by phone number"""
    return db.query(models.User).filter(models.User.phone == phone).first()


def create_user(db: Session, phone: str, name: str, location: str = None, 
                farm_size: str = None, crops: str = None):
    """Create a new user"""
    db_user = models.User(
        phone=phone,
        name=name,
        location=location or "",
        farm_size=farm_size or "",
        crops=crops or "",
        language="en"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# ==================== Endpoints ====================

@router.post("/register", response_model=TokenResponse)
async def register(request: PhoneLoginRequest, db: Session = Depends(get_db)):
    """
    Register a new user with phone number
    Phone-based registration for farmers (no password required)
    """
    # Validate phone number format
    if not verify_farmer_phone(request.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format. Use Indian format (e.g., 9876543210 or +919876543210)"
        )
    
    # Check if user already exists
    existing_user = get_user_by_phone(db, request.phone)
    if existing_user:
        # User exists, return token (auto-login)
        access_token = create_access_token(
            data={"sub": existing_user.phone, "user_id": existing_user.id}
        )
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": existing_user.id,
                "name": existing_user.name,
                "phone": existing_user.phone,
                "location": existing_user.location,
                "farm_size": existing_user.farm_size,
                "crops": existing_user.crops,
                "language": existing_user.language
            }
        )
    
    # Validate name is provided for new registration
    if not request.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name is required for new registration"
        )
    
    # Create new user
    user = create_user(db, phone=request.phone, name=request.name)
    
    # Generate JWT token
    access_token = create_access_token(
        data={"sub": user.phone, "user_id": user.id}
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "name": user.name,
            "phone": user.phone,
            "location": user.location,
            "farm_size": user.farm_size,
            "crops": user.crops,
            "language": user.language
        }
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: PhoneLoginRequest, db: Session = Depends(get_db)):
    """
    Login with phone number
    Returns JWT token for authentication
    """
    # Validate phone number format
    if not verify_farmer_phone(request.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format"
        )
    
    # Check if user exists
    user = get_user_by_phone(db, request.phone)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please register first."
        )
    
    # Generate JWT token
    access_token = create_access_token(
        data={"sub": user.phone, "user_id": user.id}
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "name": user.name,
            "phone": user.phone,
            "location": user.location,
            "farm_size": user.farm_size,
            "crops": user.crops,
            "language": user.language
        }
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Get current authenticated user info
    Requires valid JWT token
    """
    from jose import JWTError, jwt
    from app.api.core.security import ALGORITHM
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, config.settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Fetch user from database
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    request: dict,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Update user profile (location, farm_size, crops, language)
    """
    from jose import JWTError, jwt
    from app.api.core.security import ALGORITHM
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, config.settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Fetch and update user
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    # Update fields
    if "name" in request:
        user.name = request["name"]
    if "location" in request:
        user.location = request["location"]
    if "farm_size" in request:
        user.farm_size = request["farm_size"]
    if "crops" in request:
        user.crops = request["crops"]
    if "language" in request:
        user.language = request["language"]
    
    db.commit()
    db.refresh(user)
    
    return user

