"""
app/api/v1/endpoints/alerts.py
Complete alerts CRUD API for AgriGuard farmer app
Supports critical/high/medium alerts with real-time filtering
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime, timedelta

import app.curd as crud
import app.schemas as schemas
from app.database import get_db
from app.models import Alert

router = APIRouter()

@router.get("/", response_model=List[schemas.Alert])
async def get_user_alerts(
    active_only: bool = True,
    alert_type: Optional[str] = None,  # critical, warning, info
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get user's alerts (mock user_id=1)
    
    Query params:
    - active_only: Show only active alerts (default: true)
    - alert_type: Filter by type (critical/warning/info)
    - limit: Max number of alerts
    """
    user_id = 1  # Replace with real user auth
    
    query = db.query(Alert).filter(Alert.user_id == user_id)
    
    # Filter active alerts
    if active_only:
        query = query.filter(Alert.is_active == True)
    
    # Filter by type
    if alert_type:
        query = query.filter(Alert.type == alert_type)
    
    # Order by created_at desc, limit results
    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
    
    return alerts

@router.get("/active", response_model=List[schemas.Alert])
async def get_active_alerts(
    db: Session = Depends(get_db)
):
    """Get only active alerts (homepage strip)"""
    return await get_user_alerts(active_only=True, limit=5, db=db)

@router.get("/{alert_id}", response_model=schemas.Alert)
async def get_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    """Get single alert by ID"""
    alert = crud.get_alert(db, alert_id, user_id=1)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    return alert

@router.post("/", response_model=schemas.Alert, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert: schemas.AlertCreate,
    db: Session = Depends(get_db)
):
    """Create new alert (admin/system use)"""
    db_alert = crud.create_alert(db, alert, user_id=1)
    return db_alert

@router.put("/{alert_id}", response_model=schemas.Alert)
async def update_alert(
    alert_id: int,
    alert_update: schemas.AlertCreate,
    db: Session = Depends(get_db)
):
    """Update alert (mark as read, change status)"""
    db_alert = crud.get_alert(db, alert_id, user_id=1)
    if not db_alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    updated_alert = crud.update_alert(db, alert_id, alert_update)
    return updated_alert

@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    """Delete/Snooze alert"""
    alert = crud.get_alert(db, alert_id, user_id=1)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    crud.delete_alert(db, alert_id)
    return None

@router.post("/dismiss/{alert_id}")
async def dismiss_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    """Mark alert as dismissed (set is_active=False)"""
    alert = crud.get_alert(db, alert_id, user_id=1)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.is_active = False
    db.commit()
    db.refresh(alert)
    return {"message": "Alert dismissed", "alert_id": alert_id}

@router.post("/critical")
async def create_critical_alert(
    title: str,
    field: str = "Main Field",
    db: Session = Depends(get_db)
):
    """Quick create critical alert (system trigger)"""
    alert_data = schemas.AlertCreate(
        title=title,
        type="critical",
        field=field,
        action="Act immediately! Call 1800-180-1551"
    )
    return await create_alert(alert_data, db=db)

# Auto-generate demo alerts endpoint (dev only)
@router.post("/generate-demo")
async def generate_demo_alerts(
    db: Session = Depends(get_db)
):
    """Generate sample alerts for testing"""
    demo_alerts = [
        schemas.AlertCreate(
            title="Fall Armyworm Found! 🆘",
            type="critical",
            field="North Field",
            action="Spray Emamectin Benzoate immediately! Call 1800-180-1551"
        ),
        schemas.AlertCreate(
            title="Aphids Spreading ⚠️",
            type="warning",
            field="East Field - Tomatoes",
            action="Apply neem oil spray today. Check all tomato plants."
        ),
        schemas.AlertCreate(
            title="Good Conditions for Whitefly ℹ️",
            type="info",
            field="Greenhouse",
            action="Put yellow sticky traps in greenhouse today."
        )
    ]
    
    created = []
    for alert_data in demo_alerts:
        alert = crud.create_alert(db, alert_data, user_id=1)
        created.append(alert)
    
    return {"message": f"Created {len(created)} demo alerts"}
