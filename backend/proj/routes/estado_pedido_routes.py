from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from database import SessionLocal
from controllers import estado_pedido_controller

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/estados_pedido")
def listar_estados_pedido(db: Session = Depends(get_db)):
    return estado_pedido_controller.get_estados_pedido(db)

@router.get("/estados_pedido/{id_estado_pedido}")
def obtener_estado_pedido(id_estado_pedido: int, db: Session = Depends(get_db)):
    return estado_pedido_controller.get_estado_pedido(db, id_estado_pedido)

@router.post("/estados_pedido")
def crear_estado_pedido(estado: dict = Body(...), db: Session = Depends(get_db)):
    return estado_pedido_controller.create_estado_pedido(db, estado)

@router.put("/estados_pedido/{id_estado_pedido}")
def editar_estado_pedido(id_estado_pedido: int, estado: dict = Body(...), db: Session = Depends(get_db)):
    return estado_pedido_controller.update_estado_pedido(db, id_estado_pedido, estado)

@router.delete("/estados_pedido/{id_estado_pedido}")
def eliminar_estado_pedido(id_estado_pedido: int, db: Session = Depends(get_db)):
    return estado_pedido_controller.delete_estado_pedido(db, id_estado_pedido)