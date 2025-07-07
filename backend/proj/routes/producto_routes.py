from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from database import SessionLocal
from controllers import producto_controller

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/productos")
def listar_productos(db: Session = Depends(get_db)):
    return producto_controller.get_productos(db)

@router.get("/productos/{id_producto}")
def obtener_producto(id_producto: int, db: Session = Depends(get_db)):
    return producto_controller.get_producto(db, id_producto)

@router.post("/productos")
def crear_producto(producto: dict = Body(...), db: Session = Depends(get_db)):
    return producto_controller.create_producto(db, producto)

@router.put("/productos/{id_producto}")
def editar_producto(id_producto: int, producto: dict = Body(...), db: Session = Depends(get_db)):
    return producto_controller.update_producto(db, id_producto, producto)

@router.delete("/productos/{id_producto}")
def eliminar_producto(id_producto: int, db: Session = Depends(get_db)):
    return producto_controller.delete_producto(db, id_producto)