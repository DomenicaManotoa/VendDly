from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_role, require_admin
from controllers import usuarios_controller
from models.models import Usuario

router = APIRouter()

@router.get("/usuarios")
def listar_usuarios(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Lista todos los usuarios (requiere autenticación)
    """
    return usuarios_controller.get_usuarios(db)

@router.get("/usuarios/{identificacion}")
def obtener_usuario(
    identificacion: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene un usuario específico (requiere autenticación)
    """
    return usuarios_controller.get_usuario(db, identificacion)

@router.post("/usuarios")
def crear_usuario(
    usuario: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())  # Usando la nueva función require_admin
):
    """
    Crea un nuevo usuario (requiere rol admin)
    """
    return usuarios_controller.create_usuario(db, usuario)  # Cambiado a crear_usuario

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
    return usuarios_controller.update_usuario(db, identificacion, usuario)

@router.delete("/usuarios/{identificacion}")
def eliminar_usuario(
    identificacion: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())  # Usando la nueva función require_admin
):
    """
    Elimina un usuario (requiere rol admin)
    """
    return usuarios_controller.delete_usuario(db, identificacion)