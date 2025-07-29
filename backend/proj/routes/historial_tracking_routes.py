from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_admin
from controllers import historial_tracking_controller
from models.models import Usuario
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/historial_tracking")
def listar_historial_tracking(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        return historial_tracking_controller.get_historial_tracking(db)
    except Exception as e:
        logger.error(f"Error al listar historial_tracking: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/historial_tracking/{id_historial}")
def obtener_historial(
    id_historial: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        return historial_tracking_controller.get_historial(db, id_historial)
    except Exception as e:
        logger.error(f"Error al obtener historial {id_historial}: {e}")
        raise

@router.post("/historial_tracking")
def crear_historial(
    historial: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        return historial_tracking_controller.create_historial(db, historial)
    except Exception as e:
        logger.error(f"Error al crear historial: {e}")
        raise

@router.put("/historial_tracking/{id_historial}")
def editar_historial(
    id_historial: int,
    historial: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    try:
        return historial_tracking_controller.update_historial(db, id_historial, historial)
    except Exception as e:
        logger.error(f"Error al editar historial {id_historial}: {e}")
        raise

@router.delete("/historial_tracking/{id_historial}")
def eliminar_historial(
    id_historial: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    try:
        return historial_tracking_controller.delete_historial(db, id_historial)
    except Exception as e:
        logger.error(f"Error al eliminar historial {id_historial}: {e}")
        raise