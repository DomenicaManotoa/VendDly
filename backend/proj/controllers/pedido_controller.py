from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import Pedido

def get_pedidos(db: Session):
    return db.query(Pedido).all()

def get_pedido(db: Session, id_pedido: int):
    pedido = db.query(Pedido).filter(Pedido.id_pedido == id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return pedido

def create_pedido(db: Session, pedido_data: dict):
    nuevo_pedido = Pedido(**pedido_data)
    db.add(nuevo_pedido)
    db.commit()
    db.refresh(nuevo_pedido)
    return nuevo_pedido

def update_pedido(db: Session, id_pedido: int, pedido_data: dict):
    pedido = db.query(Pedido).filter(Pedido.id_pedido == id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    for key, value in pedido_data.items():
        setattr(pedido, key, value)
    db.commit()
    db.refresh(pedido)
    return pedido

def delete_pedido(db: Session, id_pedido: int):
    pedido = db.query(Pedido).filter(Pedido.id_pedido == id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    db.delete(pedido)
    db.commit()
    return {"mensaje": "Pedido eliminado"}