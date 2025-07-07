from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import EstadoPedido

def get_estados_pedido(db: Session):
    return db.query(EstadoPedido).all()

def get_estado_pedido(db: Session, id_estado_pedido: int):
    estado = db.query(EstadoPedido).filter(EstadoPedido.id_estado_pedido == id_estado_pedido).first()
    if not estado:
        raise HTTPException(status_code=404, detail="Estado de pedido no encontrado")
    return estado

def create_estado_pedido(db: Session, estado_data: dict):
    nuevo_estado = EstadoPedido(**estado_data)
    db.add(nuevo_estado)
    db.commit()
    db.refresh(nuevo_estado)
    return nuevo_estado

def update_estado_pedido(db: Session, id_estado_pedido: int, estado_data: dict):
    estado = db.query(EstadoPedido).filter(EstadoPedido.id_estado_pedido == id_estado_pedido).first()
    if not estado:
        raise HTTPException(status_code=404, detail="Estado de pedido no encontrado")
    for key, value in estado_data.items():
        setattr(estado, key, value)
    db.commit()
    db.refresh(estado)
    return estado

def delete_estado_pedido(db: Session, id_estado_pedido: int):
    estado = db.query(EstadoPedido).filter(EstadoPedido.id_estado_pedido == id_estado_pedido).first()
    if not estado:
        raise HTTPException(status_code=404, detail="Estado de pedido no encontrado")
    db.delete(estado)
    db.commit()
    return {"mensaje": "Estado de pedido eliminado"}