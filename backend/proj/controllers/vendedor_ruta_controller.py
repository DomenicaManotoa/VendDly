from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import AsignacionRuta

def get_vendedor_rutas(db: Session):
    return db.query(AsignacionRuta).all()

def get_vendedor_ruta(db: Session, id_asignacion: int):
    asignacion = db.query(AsignacionRuta).filter(AsignacionRuta.id_asignacion == id_asignacion).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    return asignacion

def create_vendedor_ruta(db: Session, id_ruta: int, identificacion_usuario: str, tipo_usuario: str = "vendedor"):
    nueva_asignacion = AsignacionRuta(
        id_ruta=id_ruta,
        identificacion_usuario=identificacion_usuario,
        tipo_usuario=tipo_usuario
    )
    db.add(nueva_asignacion)
    db.commit()
    db.refresh(nueva_asignacion)
    return nueva_asignacion

def update_vendedor_ruta(db: Session, id_asignacion: int, id_ruta: int, identificacion_usuario: str, tipo_usuario: str = "vendedor"):
    asignacion = db.query(AsignacionRuta).filter(AsignacionRuta.id_asignacion == id_asignacion).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    asignacion.id_ruta = id_ruta
    asignacion.identificacion_usuario = identificacion_usuario
    asignacion.tipo_usuario = tipo_usuario
    db.commit()
    db.refresh(asignacion)
    return asignacion

def delete_vendedor_ruta(db: Session, id_asignacion: int):
    asignacion = db.query(AsignacionRuta).filter(AsignacionRuta.id_asignacion == id_asignacion).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    db.delete(asignacion)
    db.commit()
    return {"mensaje": "Asignación eliminada"}