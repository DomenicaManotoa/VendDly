from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from database import SessionLocal
from controllers import factura_controller

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/facturas")
def listar_facturas(db: Session = Depends(get_db)):
    return factura_controller.get_facturas(db)

@router.get("/facturas/{id_factura}")
def obtener_factura(id_factura: int, db: Session = Depends(get_db)):
    return factura_controller.get_factura(db, id_factura)

@router.post("/facturas")
def crear_factura(factura: dict = Body(...), db: Session = Depends(get_db)):
    return factura_controller.create_factura(db, factura)

@router.put("/facturas/{id_factura}")
def editar_factura(id_factura: int, factura: dict = Body(...), db: Session = Depends(get_db)):
    return factura_controller.update_factura(db, id_factura, factura)

@router.delete("/facturas/{id_factura}")
def eliminar_factura(id_factura: int, db: Session = Depends(get_db)):
    return factura_controller.delete_factura(db, id_factura)