from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import Factura

def get_facturas(db: Session):
    return db.query(Factura).all()

def get_factura(db: Session, id_factura: int):
    factura = db.query(Factura).filter(Factura.id_factura == id_factura).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return factura

def create_factura(db: Session, factura_data: dict):
    nueva_factura = Factura(**factura_data)
    db.add(nueva_factura)
    db.commit()
    db.refresh(nueva_factura)
    return nueva_factura

def update_factura(db: Session, id_factura: int, factura_data: dict):
    factura = db.query(Factura).filter(Factura.id_factura == id_factura).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    for key, value in factura_data.items():
        setattr(factura, key, value)
    db.commit()
    db.refresh(factura)
    return factura

def delete_factura(db: Session, id_factura: int):
    factura = db.query(Factura).filter(Factura.id_factura == id_factura).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    db.delete(factura)
    db.commit()
    return {"mensaje": "Factura eliminada"}