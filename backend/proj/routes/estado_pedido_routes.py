from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_role, require_admin
from controllers import estado_pedido_controller
from models.models import Usuario
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/estados_pedido")
def listar_estados_pedido(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Lista todos los estados de pedido (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita lista de estados de pedido")
        estados = estado_pedido_controller.get_estados_pedido(db)
        logger.info(f"Se encontraron {len(estados)} estados de pedido")
        return estados
    except Exception as e:
        logger.error(f"Error al listar estados de pedido: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/estados_pedido/{id_estado_pedido}")
def obtener_estado_pedido(
    id_estado_pedido: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene un estado de pedido específico (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita estado de pedido ID: {id_estado_pedido}")
        return estado_pedido_controller.get_estado_pedido(db, id_estado_pedido)
    except Exception as e:
        logger.error(f"Error al obtener estado de pedido {id_estado_pedido}: {e}")
        raise

@router.post("/estados_pedido")
def crear_estado_pedido(
    estado: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Crea un nuevo estado de pedido (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} crea nuevo estado de pedido")
        return estado_pedido_controller.create_estado_pedido(db, estado)
    except Exception as e:
        logger.error(f"Error al crear estado de pedido: {e}")
        raise

@router.put("/estados_pedido/{id_estado_pedido}")
def editar_estado_pedido(
    id_estado_pedido: int,
    estado: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Edita un estado de pedido (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} edita estado de pedido ID: {id_estado_pedido}")
        return estado_pedido_controller.update_estado_pedido(db, id_estado_pedido, estado)
    except Exception as e:
        logger.error(f"Error al editar estado de pedido {id_estado_pedido}: {e}")
        raise

@router.delete("/estados_pedido/{id_estado_pedido}")
def eliminar_estado_pedido(
    id_estado_pedido: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Elimina un estado de pedido (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} elimina estado de pedido ID: {id_estado_pedido}")
        return estado_pedido_controller.delete_estado_pedido(db, id_estado_pedido)
    except Exception as e:
        logger.error(f"Error al eliminar estado de pedido {id_estado_pedido}: {e}")
        raise