from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_admin
from controllers import tracking_data_controller
from models.models import Usuario
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/tracking_data")
def listar_tracking_data(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        return tracking_data_controller.get_tracking_data(db)
    except Exception as e:
        logger.error(f"Error al listar tracking_data: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/tracking_data/{id_tracking}")
def obtener_tracking(
    id_tracking: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        return tracking_data_controller.get_tracking(db, id_tracking)
    except Exception as e:
        logger.error(f"Error al obtener tracking {id_tracking}: {e}")
        raise

@router.post("/tracking_data")
def crear_tracking(
    tracking: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        return tracking_data_controller.create_tracking(db, tracking)
    except Exception as e:
        logger.error(f"Error al crear tracking: {e}")
        raise

@router.put("/tracking_data/{id_tracking}")
def editar_tracking(
    id_tracking: int,
    tracking: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    try:
        return tracking_data_controller.update_tracking(db, id_tracking, tracking)
    except Exception as e:
        logger.error(f"Error al editar tracking {id_tracking}: {e}")
        raise

@router.delete("/tracking_data/{id_tracking}")
def eliminar_tracking(
    id_tracking: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    try:
        return tracking_data_controller.delete_tracking(db, id_tracking)
    except Exception as e:
        logger.error(f"Error al eliminar tracking {id_tracking}: {e}")
        raise