from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from database import SessionLocal
from controllers import clientes_controller

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/clientes")
def listar_clientes(db: Session = Depends(get_db)):
    return clientes_controller.get_clientes(db)

@router.get("/clientes/{cod_cliente}")
def obtener_cliente(cod_cliente: int, db: Session = Depends(get_db)):
    return clientes_controller.get_cliente(db, cod_cliente)

@router.post("/clientes")
def crear_cliente(cliente: dict = Body(...), db: Session = Depends(get_db)):
    return clientes_controller.create_cliente(db, cliente)

@router.put("/clientes/{cod_cliente}")
def editar_cliente(cod_cliente: int, cliente: dict = Body(...), db: Session = Depends(get_db)):
    return clientes_controller.update_cliente(db, cod_cliente, cliente)

@router.delete("/clientes/{cod_cliente}")
def eliminar_cliente(cod_cliente: int, db: Session = Depends(get_db)):
    return clientes_controller.delete_cliente(db, cod_cliente)