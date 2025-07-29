from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_admin
from controllers import ruta_controller
from models.models import Usuario
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/rutas")
def listar_rutas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita lista de rutas")
        rutas = ruta_controller.get_rutas(db)
        logger.info(f"Se encontraron {len(rutas)} rutas")
        return rutas
    except Exception as e:
        logger.error(f"Error al listar rutas: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/rutas/{id_ruta}")
def obtener_ruta(
    id_ruta: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita ruta ID: {id_ruta}")
        return ruta_controller.get_ruta(db, id_ruta)
    except Exception as e:
        logger.error(f"Error al obtener ruta {id_ruta}: {e}")
        raise

@router.post("/rutas")
def crear_ruta(
    ruta: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    try:
        logger.info(f"Usuario {current_user.identificacion} crea nueva ruta")
        return ruta_controller.create_ruta(db, ruta)
    except Exception as e:
        logger.error(f"Error al crear ruta: {e}")
        raise

@router.put("/rutas/{id_ruta}")
def editar_ruta(
    id_ruta: int,
    ruta: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    try:
        logger.info(f"Usuario {current_user.identificacion} edita ruta ID: {id_ruta}")
        return ruta_controller.update_ruta(db, id_ruta, ruta)
    except Exception as e:
        logger.error(f"Error al editar ruta {id_ruta}: {e}")
        raise

@router.delete("/rutas/{id_ruta}")
def eliminar_ruta(
    id_ruta: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    try:
        logger.info(f"Usuario {current_user.identificacion} elimina ruta ID: {id_ruta}")
        return ruta_controller.delete_ruta(db, id_ruta)
    except Exception as e:
        logger.error(f"Error al eliminar ruta {id_ruta}: {e}")
        raise