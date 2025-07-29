from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import UbicacionCliente

def get_ubicaciones(db: Session):
    return db.query(UbicacionCliente).all()

def get_ubicacion(db: Session, id_ubicacion: int):
    ubicacion = db.query(UbicacionCliente).filter(UbicacionCliente.id_ubicacion == id_ubicacion).first()
    if not ubicacion:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    return ubicacion

def create_ubicacion(db: Session, ubicacion_data: dict):
    nueva_ubicacion = UbicacionCliente(**ubicacion_data)
    db.add(nueva_ubicacion)
    db.commit()
    db.refresh(nueva_ubicacion)
    return nueva_ubicacion

def update_ubicacion(db: Session, id_ubicacion: int, ubicacion_data: dict):
    ubicacion = db.query(UbicacionCliente).filter(UbicacionCliente.id_ubicacion == id_ubicacion).first()
    if not ubicacion:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    for key, value in ubicacion_data.items():
        setattr(ubicacion, key, value)
    db.commit()
    db.refresh(ubicacion)
    return ubicacion

def delete_ubicacion(db: Session, id_ubicacion: int):
    ubicacion = db.query(UbicacionCliente).filter(UbicacionCliente.id_ubicacion == id_ubicacion).first()
    if not ubicacion:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    db.delete(ubicacion)
    db.commit()
    return {"mensaje": "Ubicación eliminada"}