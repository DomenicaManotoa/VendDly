from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_admin
from controllers import ruta_cliente_controller
from models.models import Usuario
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/rutas_cliente")
def listar_rutas_cliente(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        rutas_cliente = ruta_cliente_controller.get_rutas_cliente(db)
        return rutas_cliente
    except Exception as e:
        logger.error(f"Error al listar rutas_cliente: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/rutas_cliente/{id_ruta_cliente}")
def obtener_ruta_cliente(
    id_ruta_cliente: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        return ruta_cliente_controller.get_ruta_cliente(db, id_ruta_cliente)
    except Exception as e:
        logger.error(f"Error al obtener ruta_cliente {id_ruta_cliente}: {e}")
        raise

@router.post("/rutas_cliente")
def crear_ruta_cliente(
    ruta_cliente: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    try:
        return ruta_cliente_controller.create_ruta_cliente(db, ruta_cliente)
    except Exception as e:
        logger.error(f"Error al crear ruta_cliente: {e}")
        raise

@router.put("/rutas_cliente/{id_ruta_cliente}")
def editar_ruta_cliente(
    id_ruta_cliente: int,
    ruta_cliente: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    try:
        return ruta_cliente_controller.update_ruta_cliente(db, id_ruta_cliente, ruta_cliente)
    except Exception as e:
        logger.error(f"Error al editar ruta_cliente {id_ruta_cliente}: {e}")
        raise

@router.delete("/rutas_cliente/{id_ruta_cliente}")
def eliminar_ruta_cliente(
    id_ruta_cliente: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    try:
        return ruta_cliente_controller.delete_ruta_cliente(db, id_ruta_cliente)
    except Exception as e:
        logger.error(f"Error al eliminar ruta_cliente {id_ruta_cliente}: {e}")
        raise