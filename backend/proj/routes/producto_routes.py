from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_role, require_admin
from controllers import producto_controller
from models.models import Usuario
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/productos")
def listar_productos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Lista todos los productos (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita lista de productos")
        productos = producto_controller.get_productos(db)
        logger.info(f"Se encontraron {len(productos)} productos")
        return productos
    except Exception as e:
        logger.error(f"Error al listar productos: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/productos/{id_producto}")
def obtener_producto(
    id_producto: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene un producto específico (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita producto ID: {id_producto}")
        return producto_controller.get_producto(db, id_producto)
    except Exception as e:
        logger.error(f"Error al obtener producto {id_producto}: {e}")
        raise

@router.post("/productos")
def crear_producto(
    producto: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Crea un nuevo producto (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} crea nuevo producto")
        return producto_controller.create_producto(db, producto)
    except Exception as e:
        logger.error(f"Error al crear producto: {e}")
        raise

@router.put("/productos/{id_producto}")
def editar_producto(
    id_producto: int,
    producto: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Edita un producto (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} edita producto ID: {id_producto}")
        return producto_controller.update_producto(db, id_producto, producto)
    except Exception as e:
        logger.error(f"Error al editar producto {id_producto}: {e}")
        raise

@router.delete("/productos/{id_producto}")
def eliminar_producto(
    id_producto: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Elimina un producto (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} elimina producto ID: {id_producto}")
        return producto_controller.delete_producto(db, id_producto)
    except Exception as e:
        logger.error(f"Error al eliminar producto {id_producto}: {e}")
        raise