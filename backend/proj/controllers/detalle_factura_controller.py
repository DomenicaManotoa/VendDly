from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import DetalleFactura

def get_detalles_factura(db: Session):
    return db.query(DetalleFactura).all()

def get_detalle_factura(db: Session, id_detalle_factura: int):
    detalle = db.query(DetalleFactura).filter(DetalleFactura.id_detalle_factura == id_detalle_factura).first()
    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle de factura no encontrado")
    return detalle

def create_detalle_factura(db: Session, detalle_data: dict):
    nuevo_detalle = DetalleFactura(**detalle_data)
    db.add(nuevo_detalle)
    db.commit()
    db.refresh(nuevo_detalle)
    return nuevo_detalle

def update_detalle_factura(db: Session, id_detalle_factura: int, detalle_data: dict):
    detalle = db.query(DetalleFactura).filter(DetalleFactura.id_detalle_factura == id_detalle_factura).first()
    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle de factura no encontrado")
    
    for key, value in detalle_data.items():
        setattr(detalle, key, value)
    
    db.commit()
    db.refresh(detalle)
    return detalle

def delete_detalle_factura(db: Session, id_detalle_factura: int):
    detalle = db.query(DetalleFactura).filter(DetalleFactura.id_detalle_factura == id_detalle_factura).first()
    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle de factura no encontrado")
    
    db.delete(detalle)
    db.commit()
    return {"mensaje": "Detalle de factura eliminado correctamente"}