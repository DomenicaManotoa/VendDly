from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import DetallePedido

def get_detalles_pedido(db: Session):
    return db.query(DetallePedido).all()

def get_detalle_pedido(db: Session, id_detalle_pedido: int):
    detalle = db.query(DetallePedido).filter(DetallePedido.id_detalle_pedido == id_detalle_pedido).first()
    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle de pedido no encontrado")
    return detalle

def create_detalle_pedido(db: Session, detalle_data: dict):
    nuevo_detalle = DetallePedido(**detalle_data)
    db.add(nuevo_detalle)
    db.commit()
    db.refresh(nuevo_detalle)
    return nuevo_detalle

def update_detalle_pedido(db: Session, id_detalle_pedido: int, detalle_data: dict):
    detalle = db.query(DetallePedido).filter(DetallePedido.id_detalle_pedido == id_detalle_pedido).first()
    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle de pedido no encontrado")
    for key, value in detalle_data.items():
        setattr(detalle, key, value)
    db.commit()
    db.refresh(detalle)
    return detalle

def delete_detalle_pedido(db: Session, id_detalle_pedido: int):
    detalle = db.query(DetallePedido).filter(DetallePedido.id_detalle_pedido == id_detalle_pedido).first()
    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle de pedido no encontrado")
    db.delete(detalle)
    db.commit()
    return {"mensaje": "Detalle de pedido eliminado"}