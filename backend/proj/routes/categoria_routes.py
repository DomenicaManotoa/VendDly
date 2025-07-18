from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_role, require_admin
from controllers import categoria_controller
from models.models import Usuario
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/categorias")
def listar_categorias(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Lista todas las categorías (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita lista de categorías")
        categorias = categoria_controller.get_categorias(db)
        logger.info(f"Se encontraron {len(categorias)} categorías")
        return categorias
    except Exception as e:
        logger.error(f"Error al listar categorías: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/categorias/{id_categoria}")
def obtener_categoria(
    id_categoria: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene una categoría específica (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita categoría ID: {id_categoria}")
        return categoria_controller.get_categoria(db, id_categoria)
    except Exception as e:
        logger.error(f"Error al obtener categoría {id_categoria}: {e}")
        raise

@router.post("/categorias")
def crear_categoria(
    categoria: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Crea una nueva categoría (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} crea nueva categoría")
        return categoria_controller.create_categoria(db, categoria["descripcion"])
    except Exception as e:
        logger.error(f"Error al crear categoría: {e}")
        raise

@router.put("/categorias/{id_categoria}")
def editar_categoria(
    id_categoria: int,
    categoria: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Edita una categoría (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} edita categoría ID: {id_categoria}")
        return categoria_controller.update_categoria(db, id_categoria, categoria["descripcion"])
    except Exception as e:
        logger.error(f"Error al editar categoría {id_categoria}: {e}")
        raise

@router.delete("/categorias/{id_categoria}")
def eliminar_categoria(
    id_categoria: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Elimina una categoría (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} elimina categoría ID: {id_categoria}")
        return categoria_controller.delete_categoria(db, id_categoria)
    except Exception as e:
        logger.error(f"Error al eliminar categoría {id_categoria}: {e}")
        raise