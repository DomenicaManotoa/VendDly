from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import Rol

def get_roles(db: Session):
    return db.query(Rol).all()

def get_rol(db: Session, id_rol: int):
    rol = db.query(Rol).filter(Rol.id_rol == id_rol).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return rol

def create_rol(db: Session, descripcion: str):
    nuevo_rol = Rol(descripcion=descripcion)
    db.add(nuevo_rol)
    db.commit()
    db.refresh(nuevo_rol)
    return nuevo_rol

def update_rol(db: Session, id_rol: int, descripcion: str):
    rol = db.query(Rol).filter(Rol.id_rol == id_rol).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    rol.descripcion = descripcion
    db.commit()
    db.refresh(rol)
    return rol

def delete_rol(db: Session, id_rol: int):
    rol = db.query(Rol).filter(Rol.id_rol == id_rol).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    db.delete(rol)
    db.commit()
    return {"mensaje": "Rol eliminado"}