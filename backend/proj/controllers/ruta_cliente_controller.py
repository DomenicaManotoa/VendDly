from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import RutaCliente

def get_rutas_cliente(db: Session):
    return db.query(RutaCliente).all()

def get_ruta_cliente(db: Session, id_ruta_cliente: int):
    ruta_cliente = db.query(RutaCliente).filter(RutaCliente.id_ruta_cliente == id_ruta_cliente).first()
    if not ruta_cliente:
        raise HTTPException(status_code=404, detail="RutaCliente no encontrada")
    return ruta_cliente

def create_ruta_cliente(db: Session, ruta_cliente_data: dict):
    nueva_ruta_cliente = RutaCliente(**ruta_cliente_data)
    db.add(nueva_ruta_cliente)
    db.commit()
    db.refresh(nueva_ruta_cliente)
    return nueva_ruta_cliente

def update_ruta_cliente(db: Session, id_ruta_cliente: int, ruta_cliente_data: dict):
    ruta_cliente = db.query(RutaCliente).filter(RutaCliente.id_ruta_cliente == id_ruta_cliente).first()
    if not ruta_cliente:
        raise HTTPException(status_code=404, detail="RutaCliente no encontrada")
    for key, value in ruta_cliente_data.items():
        setattr(ruta_cliente, key, value)
    db.commit()
    db.refresh(ruta_cliente)
    return ruta_cliente

def delete_ruta_cliente(db: Session, id_ruta_cliente: int):
    ruta_cliente = db.query(RutaCliente).filter(RutaCliente.id_ruta_cliente == id_ruta_cliente).first()
    if not ruta_cliente:
        raise HTTPException(status_code=404, detail="RutaCliente no encontrada")
    db.delete(ruta_cliente)
    db.commit()
    return {"mensaje": "RutaCliente eliminada"}