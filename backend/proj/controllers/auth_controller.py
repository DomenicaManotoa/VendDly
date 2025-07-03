from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import Usuario

def login(db: Session, rucempresarial: str, correo: str, contrasena: str):
    usuario = db.query(Usuario).filter(
        Usuario.rucempresarial == rucempresarial,
        Usuario.correo == correo,
        Usuario.contrasena == contrasena
    ).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    return {"mensaje": "Login exitoso", "usuario": usuario.nombre}