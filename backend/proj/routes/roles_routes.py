from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_role, require_admin
from controllers.roles_controller import get_roles, get_rol, create_rol, update_rol, delete_rol
from models.models import Usuario
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/roles")
def listar_roles(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Lista todos los roles (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita lista de roles")
        roles = get_roles(db)
        logger.info(f"Se encontraron {len(roles)} roles")
        return roles
    except Exception as e:
        logger.error(f"Error al listar roles: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/roles/{id_rol}")
def obtener_rol(
    id_rol: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene un rol específico (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita rol ID: {id_rol}")
        return get_rol(db, id_rol)
    except Exception as e:
        logger.error(f"Error al obtener rol {id_rol}: {e}")
        raise

@router.post("/roles")
def crear_rol(
    rol: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Crea un nuevo rol (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} crea nuevo rol")
        return create_rol(db, rol)
    except Exception as e:
        logger.error(f"Error al crear rol: {e}")
        raise

@router.put("/roles/{id_rol}")
def editar_rol(
    id_rol: int,
    rol: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Edita un rol (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} edita rol ID: {id_rol}")
        return update_rol(db, id_rol, rol)
    except Exception as e:
        logger.error(f"Error al editar rol {id_rol}: {e}")
        raise

@router.delete("/roles/{id_rol}")
def eliminar_rol(
    id_rol: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Elimina un rol (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} elimina rol ID: {id_rol}")
        return delete_rol(db, id_rol)
    except Exception as e:
        logger.error(f"Error al eliminar rol {id_rol}: {e}")
        raise