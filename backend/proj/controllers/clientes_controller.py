from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import Cliente

def get_clientes(db: Session):
    return db.query(Cliente).all()

def get_cliente(db: Session, cod_cliente: int):
    cliente = db.query(Cliente).filter(Cliente.cod_cliente == cod_cliente).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente

def create_cliente(db: Session, cliente_data: dict):
    nuevo_cliente = Cliente(**cliente_data)
    db.add(nuevo_cliente)
    db.commit()
    db.refresh(nuevo_cliente)
    return nuevo_cliente

def update_cliente(db: Session, cod_cliente: int, cliente_data: dict):
    cliente = db.query(Cliente).filter(Cliente.cod_cliente == cod_cliente).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    for key, value in cliente_data.items():
        setattr(cliente, key, value)
    db.commit()
    db.refresh(cliente)
    return cliente

def delete_cliente(db: Session, cod_cliente: int):
    cliente = db.query(Cliente).filter(Cliente.cod_cliente == cod_cliente).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    db.delete(cliente)
    db.commit()
    return {"mensaje": "Cliente eliminado"}