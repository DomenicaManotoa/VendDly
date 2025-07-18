from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_role, require_admin
from controllers import clientes_controller
from models.models import Usuario
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/clientes")
def listar_clientes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Lista todos los clientes (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita lista de clientes")
        clientes = clientes_controller.get_clientes(db)
        logger.info(f"Se encontraron {len(clientes)} clientes")
        return clientes
    except Exception as e:
        logger.error(f"Error al listar clientes: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/clientes/{cod_cliente}")
def obtener_cliente(
    cod_cliente: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene un cliente específico (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita cliente ID: {cod_cliente}")
        return clientes_controller.get_cliente(db, cod_cliente)
    except Exception as e:
        logger.error(f"Error al obtener cliente {cod_cliente}: {e}")
        raise

@router.post("/clientes")
def crear_cliente(
    cliente: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Crea un nuevo cliente (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} crea nuevo cliente")
        return clientes_controller.create_cliente(db, cliente)
    except Exception as e:
        logger.error(f"Error al crear cliente: {e}")
        raise

@router.put("/clientes/{cod_cliente}")
def editar_cliente(
    cod_cliente: int,
    cliente: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Edita un cliente (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} edita cliente ID: {cod_cliente}")
        return clientes_controller.update_cliente(db, cod_cliente, cliente)
    except Exception as e:
        logger.error(f"Error al editar cliente {cod_cliente}: {e}")
        raise

@router.delete("/clientes/{cod_cliente}")
def eliminar_cliente(
    cod_cliente: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Elimina un cliente (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} elimina cliente ID: {cod_cliente}")
        return clientes_controller.delete_cliente(db, cod_cliente)
    except Exception as e:
        logger.error(f"Error al eliminar cliente {cod_cliente}: {e}")
        raise