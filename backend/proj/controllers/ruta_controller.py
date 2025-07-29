from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import Ruta

def get_rutas(db: Session):
    return db.query(Ruta).all()

def get_ruta(db: Session, id_ruta: int):
    ruta = db.query(Ruta).filter(Ruta.id_ruta == id_ruta).first()
    if not ruta:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    return ruta

def create_ruta(db: Session, ruta_data: dict):
    nueva_ruta = Ruta(**ruta_data)
    db.add(nueva_ruta)
    db.commit()
    db.refresh(nueva_ruta)
    return nueva_ruta

def update_ruta(db: Session, id_ruta: int, ruta_data: dict):
    ruta = db.query(Ruta).filter(Ruta.id_ruta == id_ruta).first()
    if not ruta:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    for key, value in ruta_data.items():
        setattr(ruta, key, value)
    db.commit()
    db.refresh(ruta)
    return ruta

def delete_ruta(db: Session, id_ruta: int):
    ruta = db.query(Ruta).filter(Ruta.id_ruta == id_ruta).first()
    if not ruta:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    db.delete(ruta)
    db.commit()
    return {"mensaje": "Ruta eliminada"}