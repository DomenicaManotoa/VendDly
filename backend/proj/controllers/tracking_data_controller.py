from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import TrackingData

def get_tracking_data(db: Session):
    return db.query(TrackingData).all()

def get_tracking(db: Session, id_tracking: int):
    tracking = db.query(TrackingData).filter(TrackingData.id_tracking == id_tracking).first()
    if not tracking:
        raise HTTPException(status_code=404, detail="TrackingData no encontrada")
    return tracking

def create_tracking(db: Session, tracking_data: dict):
    nuevo_tracking = TrackingData(**tracking_data)
    db.add(nuevo_tracking)
    db.commit()
    db.refresh(nuevo_tracking)
    return nuevo_tracking

def update_tracking(db: Session, id_tracking: int, tracking_data: dict):
    tracking = db.query(TrackingData).filter(TrackingData.id_tracking == id_tracking).first()
    if not tracking:
        raise HTTPException(status_code=404, detail="TrackingData no encontrada")
    for key, value in tracking_data.items():
        setattr(tracking, key, value)
    db.commit()
    db.refresh(tracking)
    return tracking

def delete_tracking(db: Session, id_tracking: int):
    tracking = db.query(TrackingData).filter(TrackingData.id_tracking == id_tracking).first()
    if not tracking:
        raise HTTPException(status_code=404, detail="TrackingData no encontrada")
    db.delete(tracking)
    db.commit()
    return {"mensaje": "TrackingData eliminada"}