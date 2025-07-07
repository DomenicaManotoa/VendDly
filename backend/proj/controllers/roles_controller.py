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

def create_rol(db: Session, rol_data: dict):
    nuevo_rol = Rol(**rol_data)
    db.add(nuevo_rol)
    db.commit()
    db.refresh(nuevo_rol)
    return nuevo_rol

def update_rol(db: Session, id_rol: int, rol_data: dict):
    rol = db.query(Rol).filter(Rol.id_rol == id_rol).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    for key, value in rol_data.items():
        setattr(rol, key, value)
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