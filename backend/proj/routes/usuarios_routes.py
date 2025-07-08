from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_role, require_admin
from controllers import usuarios_controller
from models.models import Usuario
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/usuarios")
def listar_usuarios(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Lista todos los usuarios (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita lista de usuarios")
        usuarios = usuarios_controller.get_usuarios(db)
        logger.info(f"Se encontraron {len(usuarios)} usuarios")
        return usuarios
    except Exception as e:
        logger.error(f"Error al listar usuarios: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/usuarios/{identificacion}")
def obtener_usuario(
    identificacion: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene un usuario específico (requiere autenticación)
    """
    try:
        logger.info(f"Buscando usuario con identificación: {identificacion}")
        return usuarios_controller.get_usuario(db, identificacion)
    except Exception as e:
        logger.error(f"Error al obtener usuario {identificacion}: {e}")
        raise

@router.post("/usuarios")
def crear_usuario(
    usuario: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Crea un nuevo usuario (requiere rol admin)
    """
    try:
        logger.info(f"Creando nuevo usuario: {usuario.get('identificacion')}")
        return usuarios_controller.create_usuario(db, usuario)
    except Exception as e:
        logger.error(f"Error al crear usuario: {e}")
        raise

@router.put("/usuarios/{identificacion}")
def editar_usuario(
    identificacion: str,
    usuario: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Edita un usuario (requiere autenticación)
    """
    try:
        logger.info(f"Editando usuario: {identificacion}")
        return usuarios_controller.update_usuario(db, identificacion, usuario)
    except Exception as e:
        logger.error(f"Error al editar usuario {identificacion}: {e}")
        raise

@router.delete("/usuarios/{identificacion}")
def eliminar_usuario(
    identificacion: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Elimina un usuario (requiere rol admin)
    """
    try:
        logger.info(f"Eliminando usuario: {identificacion}")
        return usuarios_controller.delete_usuario(db, identificacion)
    except Exception as e:
        logger.error(f"Error al eliminar usuario {identificacion}: {e}")
        raise