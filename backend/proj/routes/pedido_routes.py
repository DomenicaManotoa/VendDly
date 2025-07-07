from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from database import SessionLocal
from controllers import pedido_controller

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/pedidos")
def listar_pedidos(db: Session = Depends(get_db)):
    return pedido_controller.get_pedidos(db)

@router.get("/pedidos/{id_pedido}")
def obtener_pedido(id_pedido: int, db: Session = Depends(get_db)):
    return pedido_controller.get_pedido(db, id_pedido)

@router.post("/pedidos")
def crear_pedido(pedido: dict = Body(...), db: Session = Depends(get_db)):
    return pedido_controller.create_pedido(db, pedido)

@router.put("/pedidos/{id_pedido}")
def editar_pedido(id_pedido: int, pedido: dict = Body(...), db: Session = Depends(get_db)):
    return pedido_controller.update_pedido(db, id_pedido, pedido)

@router.delete("/pedidos/{id_pedido}")
def eliminar_pedido(id_pedido: int, db: Session = Depends(get_db)):
    return pedido_controller.delete_pedido(db, id_pedido)