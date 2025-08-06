from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from dependencias.auth import get_db, require_admin
from controllers import transportista_ruta_controller
from models.models import Usuario

router = APIRouter()

@router.get("/transportista_rutas")
def listar_transportista_rutas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    return transportista_ruta_controller.get_transportista_rutas(db)

@router.get("/transportista_rutas/{id_asignacion}")
def obtener_transportista_ruta(
    id_asignacion: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    return transportista_ruta_controller.get_transportista_ruta(db, id_asignacion)

@router.post("/transportista_rutas")
def crear_transportista_ruta(
    datos: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    return transportista_ruta_controller.create_transportista_ruta(
        db,
        id_ruta=datos["id_ruta"],
        identificacion_usuario=datos["identificacion_usuario"],
        tipo_usuario=datos.get("tipo_usuario", "transportista")
    )

@router.put("/transportista_rutas/{id_asignacion}")
def editar_transportista_ruta(
    id_asignacion: int,
    datos: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    return transportista_ruta_controller.update_transportista_ruta(
        db,
        id_asignacion=id_asignacion,
        id_ruta=datos["id_ruta"],
        identificacion_usuario=datos["identificacion_usuario"],
        tipo_usuario=datos.get("tipo_usuario", "transportista")
    )

@router.delete("/transportista_rutas/{id_asignacion}")
def eliminar_transportista_ruta(
    id_asignacion: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    return transportista_ruta_controller.delete_transportista_ruta(db, id_asignacion)