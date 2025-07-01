from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import Marca

def get_marcas(db: Session):
    return db.query(Marca).all()

def get_marca(db: Session, id_marca: int):
    marca = db.query(Marca).filter(Marca.id_marca == id_marca).first()
    if not marca:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    return marca

def create_marca(db: Session, descripcion: str):
    nueva_marca = Marca(descripcion=descripcion)
    db.add(nueva_marca)
    db.commit()
    db.refresh(nueva_marca)
    return nueva_marca

def update_marca(db: Session, id_marca: int, descripcion: str):
    marca = db.query(Marca).filter(Marca.id_marca == id_marca).first()
    if not marca:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    marca.descripcion = descripcion
    db.commit()
    db.refresh(marca)
    return marca

def delete_marca(db: Session, id_marca: int):
    marca = db.query(Marca).filter(Marca.id_marca == id_marca).first()
    if not marca:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    db.delete(marca)
    db.commit()
    return {"mensaje": "Marca eliminada"}