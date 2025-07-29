from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_admin
from controllers import ruta_pedido_controller
from models.models import Usuario
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/rutas_pedido")
def listar_rutas_pedido(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        rutas_pedido = ruta_pedido_controller.get_rutas_pedido(db)
        return rutas_pedido
    except Exception as e:
        logger.error(f"Error al listar rutas_pedido: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/rutas_pedido/{id_ruta_pedido}")
def obtener_ruta_pedido(
    id_ruta_pedido: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        return ruta_pedido_controller.get_ruta_pedido(db, id_ruta_pedido)
    except Exception as e:
        logger.error(f"Error al obtener ruta_pedido {id_ruta_pedido}: {e}")
        raise

@router.post("/rutas_pedido")
def crear_ruta_pedido(
    ruta_pedido: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    try:
        return ruta_pedido_controller.create_ruta_pedido(db, ruta_pedido)
    except Exception as e:
        logger.error(f"Error al crear ruta_pedido: {e}")
        raise

@router.put("/rutas_pedido/{id_ruta_pedido}")
def editar_ruta_pedido(
    id_ruta_pedido: int,
    ruta_pedido: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    try:
        return ruta_pedido_controller.update_ruta_pedido(db, id_ruta_pedido, ruta_pedido)
    except Exception as e:
        logger.error(f"Error al editar ruta_pedido {id_ruta_pedido}: {e}")
        raise

@router.delete("/rutas_pedido/{id_ruta_pedido}")
def eliminar_ruta_pedido(
    id_ruta_pedido: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    try:
        return ruta_pedido_controller.delete_ruta_pedido(db, id_ruta_pedido)
    except Exception as e:
        logger.error(f"Error al eliminar ruta_pedido {id_ruta_pedido}: {e}")
        raise