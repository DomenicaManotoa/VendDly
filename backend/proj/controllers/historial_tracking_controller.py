from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import HistorialTracking

def get_historial_tracking(db: Session):
    return db.query(HistorialTracking).all()

def get_historial(db: Session, id_historial: int):
    historial = db.query(HistorialTracking).filter(HistorialTracking.id_historial == id_historial).first()
    if not historial:
        raise HTTPException(status_code=404, detail="HistorialTracking no encontrado")
    return historial

def create_historial(db: Session, historial_data: dict):
    nuevo_historial = HistorialTracking(**historial_data)
    db.add(nuevo_historial)
    db.commit()
    db.refresh(nuevo_historial)
    return nuevo_historial

def update_historial(db: Session, id_historial: int, historial_data: dict):
    historial = db.query(HistorialTracking).filter(HistorialTracking.id_historial == id_historial).first()
    if not historial:
        raise HTTPException(status_code=404, detail="HistorialTracking no encontrado")
    for key, value in historial_data.items():
        setattr(historial, key, value)
    db.commit()
    db.refresh(historial)
    return historial

def delete_historial(db: Session, id_historial: int):
    historial = db.query(HistorialTracking).filter(HistorialTracking.id_historial == id_historial).first()
    if not historial:
        raise HTTPException(status_code=404, detail="HistorialTracking no encontrado")
    db.delete(historial)
    db.commit()
    return {"mensaje": "HistorialTracking eliminado"}