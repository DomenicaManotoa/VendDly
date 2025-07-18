from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_role, require_admin
from controllers import pedido_controller
from models.models import Usuario
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/pedidos")
def listar_pedidos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Lista todos los pedidos (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita lista de pedidos")
        pedidos = pedido_controller.get_pedidos(db)
        logger.info(f"Se encontraron {len(pedidos)} pedidos")
        return pedidos
    except Exception as e:
        logger.error(f"Error al listar pedidos: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/pedidos/{id_pedido}")
def obtener_pedido(
    id_pedido: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene un pedido específico (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita pedido ID: {id_pedido}")
        return pedido_controller.get_pedido(db, id_pedido)
    except Exception as e:
        logger.error(f"Error al obtener pedido {id_pedido}: {e}")
        raise

@router.post("/pedidos")
def crear_pedido(
    pedido: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Crea un nuevo pedido (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} crea nuevo pedido")
        return pedido_controller.create_pedido(db, pedido)
    except Exception as e:
        logger.error(f"Error al crear pedido: {e}")
        raise

@router.put("/pedidos/{id_pedido}")
def editar_pedido(
    id_pedido: int,
    pedido: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Edita un pedido (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} edita pedido ID: {id_pedido}")
        return pedido_controller.update_pedido(db, id_pedido, pedido)
    except Exception as e:
        logger.error(f"Error al editar pedido {id_pedido}: {e}")
        raise

@router.delete("/pedidos/{id_pedido}")
def eliminar_pedido(
    id_pedido: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Elimina un pedido (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} elimina pedido ID: {id_pedido}")
        return pedido_controller.delete_pedido(db, id_pedido)
    except Exception as e:
        logger.error(f"Error al eliminar pedido {id_pedido}: {e}")
        raise