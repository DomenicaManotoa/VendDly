from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, require_admin
from controllers import vendedor_ruta_controller
from models.models import Usuario

router = APIRouter()

@router.get("/vendedor/rutas")
def listar_vendedor_rutas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    return vendedor_ruta_controller.get_vendedor_rutas(db)

@router.get("/vendedor/rutas/{id_asignacion}")
def obtener_vendedor_ruta(
    id_asignacion: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    return vendedor_ruta_controller.get_vendedor_ruta(db, id_asignacion)

@router.post("/vendedor/rutas")
def crear_vendedor_ruta(
    datos: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    return vendedor_ruta_controller.create_vendedor_ruta(
        db,
        id_ruta=datos["id_ruta"],
        identificacion_usuario=datos["identificacion_usuario"],
        tipo_usuario=datos.get("tipo_usuario", "vendedor")
    )

@router.put("/vendedor_rutas/{id_asignacion}")
def editar_vendedor_ruta(
    id_asignacion: int,
    datos: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    return vendedor_ruta_controller.update_vendedor_ruta(
        db,
        id_asignacion=id_asignacion,
        id_ruta=datos["id_ruta"],
        identificacion_usuario=datos["identificacion_usuario"],
        tipo_usuario=datos.get("tipo_usuario", "vendedor")
    )

@router.delete("/vendedor_rutas/{id_asignacion}")
def eliminar_vendedor_ruta(
    id_asignacion: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    return vendedor_ruta_controller.delete_vendedor_ruta(db, id_asignacion)