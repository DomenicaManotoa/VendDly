from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from database import SessionLocal
from controllers import marca_controller

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/marcas")
def listar_marcas(db: Session = Depends(get_db)):
    return marca_controller.get_marcas(db)

@router.get("/marcas/{id_marca}")
def obtener_marca(id_marca: int, db: Session = Depends(get_db)):
    return marca_controller.get_marca(db, id_marca)

@router.post("/marcas")
def crear_marca(marca: dict = Body(...), db: Session = Depends(get_db)):
    return marca_controller.create_marca(db, marca["descripcion"])

@router.put("/marcas/{id_marca}")
def editar_marca(id_marca: int, marca: dict = Body(...), db: Session = Depends(get_db)):
    return marca_controller.update_marca(db, id_marca, marca["descripcion"])

@router.delete("/marcas/{id_marca}")
def eliminar_marca(id_marca: int, db: Session = Depends(get_db)):
    return marca_controller.delete_marca(db, id_marca)