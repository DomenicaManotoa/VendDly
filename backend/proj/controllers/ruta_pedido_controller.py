from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import RutaPedido

def get_rutas_pedido(db: Session):
    return db.query(RutaPedido).all()

def get_ruta_pedido(db: Session, id_ruta_pedido: int):
    ruta_pedido = db.query(RutaPedido).filter(RutaPedido.id_ruta_pedido == id_ruta_pedido).first()
    if not ruta_pedido:
        raise HTTPException(status_code=404, detail="RutaPedido no encontrada")
    return ruta_pedido

def create_ruta_pedido(db: Session, ruta_pedido_data: dict):
    nueva_ruta_pedido = RutaPedido(**ruta_pedido_data)
    db.add(nueva_ruta_pedido)
    db.commit()
    db.refresh(nueva_ruta_pedido)
    return nueva_ruta_pedido

def update_ruta_pedido(db: Session, id_ruta_pedido: int, ruta_pedido_data: dict):
    ruta_pedido = db.query(RutaPedido).filter(RutaPedido.id_ruta_pedido == id_ruta_pedido).first()
    if not ruta_pedido:
        raise HTTPException(status_code=404, detail="RutaPedido no encontrada")
    for key, value in ruta_pedido_data.items():
        setattr(ruta_pedido, key, value)
    db.commit()
    db.refresh(ruta_pedido)
    return ruta_pedido

def delete_ruta_pedido(db: Session, id_ruta_pedido: int):
    ruta_pedido = db.query(RutaPedido).filter(RutaPedido.id_ruta_pedido == id_ruta_pedido).first()
    if not ruta_pedido:
        raise HTTPException(status_code=404, detail="RutaPedido no encontrada")
    db.delete(ruta_pedido)
    db.commit()
    return {"mensaje": "RutaPedido eliminada"}