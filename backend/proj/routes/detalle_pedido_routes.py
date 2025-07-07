from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from database import SessionLocal
from controllers import detalle_pedido_controller

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/detalles_pedido")
def listar_detalles_pedido(db: Session = Depends(get_db)):
    return detalle_pedido_controller.get_detalles_pedido(db)

@router.get("/detalles_pedido/{id_detalle_pedido}")
def obtener_detalle_pedido(id_detalle_pedido: int, db: Session = Depends(get_db)):
    return detalle_pedido_controller.get_detalle_pedido(db, id_detalle_pedido)

@router.post("/detalles_pedido")
def crear_detalle_pedido(detalle: dict = Body(...), db: Session = Depends(get_db)):
    return detalle_pedido_controller.create_detalle_pedido(db, detalle)

@router.put("/detalles_pedido/{id_detalle_pedido}")
def editar_detalle_pedido(id_detalle_pedido: int, detalle: dict = Body(...), db: Session = Depends(get_db)):
    return detalle_pedido_controller.update_detalle_pedido(db, id_detalle_pedido, detalle)

@router.delete("/detalles_pedido/{id_detalle_pedido}")
def eliminar_detalle_pedido(id_detalle_pedido: int, db: Session = Depends(get_db)):
    return detalle_pedido_controller.delete_detalle_pedido(db, id_detalle_pedido)