from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_role, require_admin
from controllers import detalle_pedido_controller
from models.models import Usuario
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/detalles_pedido")
def listar_detalles_pedido(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Lista todos los detalles de pedido (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita lista de detalles de pedido")
        detalles = detalle_pedido_controller.get_detalles_pedido(db)
        logger.info(f"Se encontraron {len(detalles)} detalles de pedido")
        return detalles
    except Exception as e:
        logger.error(f"Error al listar detalles de pedido: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/detalles_pedido/{id_detalle_pedido}")
def obtener_detalle_pedido(
    id_detalle_pedido: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene un detalle de pedido específico (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita detalle de pedido ID: {id_detalle_pedido}")
        return detalle_pedido_controller.get_detalle_pedido(db, id_detalle_pedido)
    except Exception as e:
        logger.error(f"Error al obtener detalle de pedido {id_detalle_pedido}: {e}")
        raise

@router.post("/detalles_pedido")
def crear_detalle_pedido(
    detalle: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Crea un nuevo detalle de pedido (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} crea nuevo detalle de pedido")
        return detalle_pedido_controller.create_detalle_pedido(db, detalle)
    except Exception as e:
        logger.error(f"Error al crear detalle de pedido: {e}")
        raise

@router.put("/detalles_pedido/{id_detalle_pedido}")
def editar_detalle_pedido(
    id_detalle_pedido: int,
    detalle: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Edita un detalle de pedido (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} edita detalle de pedido ID: {id_detalle_pedido}")
        return detalle_pedido_controller.update_detalle_pedido(db, id_detalle_pedido, detalle)
    except Exception as e:
        logger.error(f"Error al editar detalle de pedido {id_detalle_pedido}: {e}")
        raise

@router.delete("/detalles_pedido/{id_detalle_pedido}")
def eliminar_detalle_pedido(
    id_detalle_pedido: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Elimina un detalle de pedido (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} elimina detalle de pedido ID: {id_detalle_pedido}")
        return detalle_pedido_controller.delete_detalle_pedido(db, id_detalle_pedido)
    except Exception as e:
        logger.error(f"Error al eliminar detalle de pedido {id_detalle_pedido}: {e}")
        raise