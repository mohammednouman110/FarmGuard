# Add these to your existing crud.py

from sqlalchemy.orm import Session
from app import models, schemas

def get_alert(db: Session, alert_id: int, user_id: int):
    return db.query(models.Alert).filter(
        models.Alert.id == alert_id,
        models.Alert.user_id == user_id
    ).first()

def get_alerts(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Alert).filter(
        models.Alert.user_id == user_id
    ).order_by(models.Alert.created_at.desc()).offset(skip).limit(limit).all()

def create_alert(db: Session, alert: schemas.AlertCreate, user_id: int):
    db_alert = models.Alert(**alert.dict(), user_id=user_id)
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

def update_alert(db: Session, alert_id: int, alert_update: schemas.AlertCreate):
    db_alert = db.query(models.Alert).filter(
        models.Alert.id == alert_id
    ).first()
    
    if db_alert:
        for field, value in alert_update.dict().items():
            setattr(db_alert, field, value)
        db.commit()
        db.refresh(db_alert)
        return db_alert

def delete_alert(db: Session, alert_id: int):
    db_alert = db.query(models.Alert).filter(
        models.Alert.id == alert_id
    ).first()
    if db_alert:
        db.delete(db_alert)
        db.commit()
        return True
    return False

def get_recent_scans(db: Session, user_id: int, limit: int = 10):
    from app.models import Scan
    return db.query(Scan).filter(
        Scan.user_id == user_id
    ).order_by(Scan.created_at.desc()).limit(limit).all()

def create_scan(db: Session, scan_data, user_id: int):
    """Create a new scan record"""
    from app.models import Scan
    
    # Extract data from scan_data (which is a ScanCreate or similar object)
    scan_dict = {
        "user_id": user_id,
        "image_url": scan_data.image_url if hasattr(scan_data, 'image_url') else "/uploads/image.jpg",
        "prediction": scan_data.prediction if hasattr(scan_data, 'prediction') else "Unknown",
        "confidence": scan_data.confidence if hasattr(scan_data, 'confidence') else 0.0,
        "damage_level": scan_data.damage_level if hasattr(scan_data, 'damage_level') else "unknown",
        "treatment_steps": str(scan_data.treatment) if hasattr(scan_data, 'treatment') else "",
    }
    
    db_scan = Scan(**scan_dict)
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)
    return db_scan

def get_dashboard_stats(db: Session, user_id: int):
    """Get scan statistics for dashboard - day, week, month"""
    from app.models import Scan
    from datetime import datetime, timedelta
    from sqlalchemy import func
    
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Get counts for each period
    daily_count = db.query(func.count(Scan.id)).filter(
        Scan.user_id == user_id,
        Scan.created_at >= today_start
    ).scalar() or 0
    
    weekly_count = db.query(func.count(Scan.id)).filter(
        Scan.user_id == user_id,
        Scan.created_at >= week_start
    ).scalar() or 0
    
    monthly_count = db.query(func.count(Scan.id)).filter(
        Scan.user_id == user_id,
        Scan.created_at >= month_start
    ).scalar() or 0
    
    total_count = db.query(func.count(Scan.id)).filter(
        Scan.user_id == user_id
    ).scalar() or 0
    
    # Get disease breakdown for current month
    disease_stats = db.query(
        Scan.prediction,
        func.count(Scan.id).label('count')
    ).filter(
        Scan.user_id == user_id,
        Scan.created_at >= month_start
    ).group_by(Scan.prediction).all()
    
    disease_breakdown = {disease: count for disease, count in disease_stats}
    
    # Get recent scans for the period
    recent_scans = db.query(Scan).filter(
        Scan.user_id == user_id
    ).order_by(Scan.created_at.desc()).limit(10).all()
    
    return {
        "daily_count": daily_count,
        "weekly_count": weekly_count,
        "monthly_count": monthly_count,
        "total_count": total_count,
        "disease_breakdown": disease_breakdown,
        "recent_scans": recent_scans
    }
