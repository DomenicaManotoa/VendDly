from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from database import SessionLocal
from controllers import roles_controller

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/roles")
def listar_roles(db: Session = Depends(get_db)):
    return roles_controller.get_roles(db)

@router.get("/roles/{id_rol}")
def obtener_rol(id_rol: int, db: Session = Depends(get_db)):
    return roles_controller.get_rol(db, id_rol)

@router.post("/roles")
def crear_rol(rol: dict = Body(...), db: Session = Depends(get_db)):
    return roles_controller.create_rol(db, rol["descripcion"])

@router.put("/roles/{id_rol}")
def editar_rol(id_rol: int, rol: dict = Body(...), db: Session = Depends(get_db)):
    return roles_controller.update_rol(db, id_rol, rol["descripcion"])

@router.delete("/roles/{id_rol}")
def eliminar_rol(id_rol: int, db: Session = Depends(get_db)):
    return roles_controller.delete_rol(db, id_rol)