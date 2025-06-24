from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from database import SessionLocal
from controllers import usuarios_controller

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/usuarios")
def listar_usuarios(db: Session = Depends(get_db)):
    return usuarios_controller.get_usuarios(db)

@router.get("/usuarios/{identificacion}")
def obtener_usuario(identificacion: int, db: Session = Depends(get_db)):
    return usuarios_controller.get_usuario(db, identificacion)

@router.post("/usuarios")
def crear_usuario(usuario: dict = Body(...), db: Session = Depends(get_db)):
    return usuarios_controller.create_usuario(db, usuario)

@router.put("/usuarios/{identificacion}")
def editar_usuario(identificacion: int, usuario: dict = Body(...), db: Session = Depends(get_db)):
    return usuarios_controller.update_usuario(db, identificacion, usuario)

@router.delete("/usuarios/{identificacion}")
def eliminar_usuario(identificacion: int, db: Session = Depends(get_db)):
    return usuarios_controller.delete_usuario(db, identificacion)