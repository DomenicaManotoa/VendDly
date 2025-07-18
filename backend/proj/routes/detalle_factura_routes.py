from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_role, require_admin
from controllers import detalle_factura_controller
from models.models import Usuario
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/detalles_factura")
def listar_detalles_factura(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Lista todos los detalles de factura (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita lista de detalles de factura")
        detalles = detalle_factura_controller.get_detalles_factura(db)
        logger.info(f"Se encontraron {len(detalles)} detalles de factura")
        return detalles
    except Exception as e:
        logger.error(f"Error al listar detalles de factura: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/detalles_factura/{id_detalle_factura}")
def obtener_detalle_factura(
    id_detalle_factura: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene un detalle de factura específico (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita detalle de factura ID: {id_detalle_factura}")
        return detalle_factura_controller.get_detalle_factura(db, id_detalle_factura)
    except Exception as e:
        logger.error(f"Error al obtener detalle de factura {id_detalle_factura}: {e}")
        raise

@router.post("/detalles_factura")
def crear_detalle_factura(
    detalle: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Crea un nuevo detalle de factura (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} crea nuevo detalle de factura")
        return detalle_factura_controller.create_detalle_factura(db, detalle)
    except Exception as e:
        logger.error(f"Error al crear detalle de factura: {e}")
        raise

@router.put("/detalles_factura/{id_detalle_factura}")
def editar_detalle_factura(
    id_detalle_factura: int,
    detalle: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Edita un detalle de factura (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} edita detalle de factura ID: {id_detalle_factura}")
        return detalle_factura_controller.update_detalle_factura(db, id_detalle_factura, detalle)
    except Exception as e:
        logger.error(f"Error al editar detalle de factura {id_detalle_factura}: {e}")
        raise

@router.delete("/detalles_factura/{id_detalle_factura}")
def eliminar_detalle_factura(
    id_detalle_factura: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Elimina un detalle de factura (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} elimina detalle de factura ID: {id_detalle_factura}")
        return detalle_factura_controller.delete_detalle_factura(db, id_detalle_factura)
    except Exception as e:
        logger.error(f"Error al eliminar detalle de factura {id_detalle_factura}: {e}")
        raise