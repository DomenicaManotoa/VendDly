from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_role, require_admin
from controllers import factura_controller
from models.models import Usuario
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/facturas")
def listar_facturas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Lista todas las facturas (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita lista de facturas")
        facturas = factura_controller.get_facturas(db)
        logger.info(f"Se encontraron {len(facturas)} facturas")
        return facturas
    except Exception as e:
        logger.error(f"Error al listar facturas: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/facturas/{id_factura}")
def obtener_factura(
    id_factura: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene una factura específica (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita factura ID: {id_factura}")
        return factura_controller.get_factura(db, id_factura)
    except Exception as e:
        logger.error(f"Error al obtener factura {id_factura}: {e}")
        raise

@router.post("/facturas")
def crear_factura(
    factura: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Crea una nueva factura (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} crea nueva factura")
        return factura_controller.create_factura(db, factura)
    except Exception as e:
        logger.error(f"Error al crear factura: {e}")
        raise

@router.put("/facturas/{id_factura}")
def editar_factura(
    id_factura: int,
    factura: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Edita una factura (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} edita factura ID: {id_factura}")
        return factura_controller.update_factura(db, id_factura, factura)
    except Exception as e:
        logger.error(f"Error al editar factura {id_factura}: {e}")
        raise

@router.delete("/facturas/{id_factura}")
def eliminar_factura(
    id_factura: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Elimina una factura (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} elimina factura ID: {id_factura}")
        return factura_controller.delete_factura(db, id_factura)
    except Exception as e:
        logger.error(f"Error al eliminar factura {id_factura}: {e}")
        raise