from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from database import SessionLocal
from controllers import categoria_controller

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/categorias")
def listar_categorias(db: Session = Depends(get_db)):
    return categoria_controller.get_categorias(db)

@router.get("/categorias/{id_categoria}")
def obtener_categoria(id_categoria: int, db: Session = Depends(get_db)):
    return categoria_controller.get_categoria(db, id_categoria)

@router.post("/categorias")
def crear_categoria(categoria: dict = Body(...), db: Session = Depends(get_db)):
    return categoria_controller.create_categoria(db, categoria["descripcion"])

@router.put("/categorias/{id_categoria}")
def editar_categoria(id_categoria: int, categoria: dict = Body(...), db: Session = Depends(get_db)):
    return categoria_controller.update_categoria(db, id_categoria, categoria["descripcion"])

@router.delete("/categorias/{id_categoria}")
def eliminar_categoria(id_categoria: int, db: Session = Depends(get_db)):
    return categoria_controller.delete_categoria(db, id_categoria)