from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_role, require_admin
from controllers import marca_controller
from models.models import Usuario
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/marcas")
def listar_marcas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Lista todas las marcas (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita lista de marcas")
        marcas = marca_controller.get_marcas(db)
        logger.info(f"Se encontraron {len(marcas)} marcas")
        return marcas
    except Exception as e:
        logger.error(f"Error al listar marcas: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/marcas/{id_marca}")
def obtener_marca(
    id_marca: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene una marca específica (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita marca ID: {id_marca}")
        return marca_controller.get_marca(db, id_marca)
    except Exception as e:
        logger.error(f"Error al obtener marca {id_marca}: {e}")
        raise

@router.post("/marcas")
def crear_marca(
    marca: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Crea una nueva marca (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} crea nueva marca")
        return marca_controller.create_marca(db, marca["descripcion"])
    except Exception as e:
        logger.error(f"Error al crear marca: {e}")
        raise

@router.put("/marcas/{id_marca}")
def editar_marca(
    id_marca: int,
    marca: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Edita una marca (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} edita marca ID: {id_marca}")
        return marca_controller.update_marca(db, id_marca, marca["descripcion"])
    except Exception as e:
        logger.error(f"Error al editar marca {id_marca}: {e}")
        raise

@router.delete("/marcas/{id_marca}")
def eliminar_marca(
    id_marca: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Elimina una marca (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} elimina marca ID: {id_marca}")
        return marca_controller.delete_marca(db, id_marca)
    except Exception as e:
        logger.error(f"Error al eliminar marca {id_marca}: {e}")
        raise