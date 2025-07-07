from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from database import SessionLocal
from controllers import detalle_factura_controller

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/detalles_factura")
def listar_detalles_factura(db: Session = Depends(get_db)):
    return detalle_factura_controller.get_detalles_factura(db)

@router.get("/detalles_factura/{id_detalle_factura}")
def obtener_detalle_factura(id_detalle_factura: int, db: Session = Depends(get_db)):
    return detalle_factura_controller.get_detalle_factura(db, id_detalle_factura)

@router.post("/detalles_factura")
def crear_detalle_factura(detalle: dict = Body(...), db: Session = Depends(get_db)):
    return detalle_factura_controller.create_detalle_factura(db, detalle)

@router.put("/detalles_factura/{id_detalle_factura}")
def editar_detalle_factura(id_detalle_factura: int, detalle: dict = Body(...), db: Session = Depends(get_db)):
    return detalle_factura_controller.update_detalle_factura(db, id_detalle_factura, detalle)

@router.delete("/detalles_factura/{id_detalle_factura}")
def eliminar_detalle_factura(id_detalle_factura: int, db: Session = Depends(get_db)):
    return detalle_factura_controller.delete_detalle_factura(db, id_detalle_factura)