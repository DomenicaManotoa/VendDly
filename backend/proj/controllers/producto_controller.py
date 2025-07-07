from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import Producto

def get_productos(db: Session):
    return db.query(Producto).all()

def get_producto(db: Session, id_producto: int):
    producto = db.query(Producto).filter(Producto.id_producto == id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto

def create_producto(db: Session, producto_data: dict):
    nuevo_producto = Producto(**producto_data)
    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    return nuevo_producto

def update_producto(db: Session, id_producto: int, producto_data: dict):
    producto = db.query(Producto).filter(Producto.id_producto == id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    for key, value in producto_data.items():
        setattr(producto, key, value)
    db.commit()
    db.refresh(producto)
    return producto

def delete_producto(db: Session, id_producto: int):
    producto = db.query(Producto).filter(Producto.id_producto == id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(producto)
    db.commit()
    return {"mensaje": "Producto eliminado"}