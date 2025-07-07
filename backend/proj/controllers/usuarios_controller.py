from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import Usuario
from utils.security import hash_password

def get_usuarios(db: Session):
    return db.query(Usuario).all()

def get_usuario(db: Session, identificacion: str):
    usuario = db.query(Usuario).filter(Usuario.identificacion == identificacion).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

def create_usuario(db: Session, usuario_data: dict):
    # Hashear la contraseña antes de guardar
    if 'contrasena' in usuario_data:
        usuario_data['contrasena'] = hash_password(usuario_data['contrasena'])
    
    nuevo_usuario = Usuario(**usuario_data)
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

def update_usuario(db: Session, identificacion: str, usuario_data: dict):
    usuario = db.query(Usuario).filter(Usuario.identificacion == identificacion).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Si se está actualizando la contraseña, hashearla
    if 'contrasena' in usuario_data:
        usuario_data['contrasena'] = hash_password(usuario_data['contrasena'])
    
    for key, value in usuario_data.items():
        setattr(usuario, key, value)
    db.commit()
    db.refresh(usuario)
    return usuario

def delete_usuario(db: Session, identificacion: str):
    usuario = db.query(Usuario).filter(Usuario.identificacion == identificacion).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(usuario)
    db.commit()
    return {"mensaje": "Usuario eliminado"}