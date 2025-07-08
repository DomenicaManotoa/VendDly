from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user
from controllers import auth_controller
from models.models import LoginRequest, Usuario
from models.token_models import Token, UserResponse, LoginResponse

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
def login(
    datos: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Endpoint para login de usuarios
    """
    try:
        print(f"Intento de login con RUC: {datos.rucempresarial}, Email: {datos.correo}")
        result = auth_controller.login(db, datos.rucempresarial, datos.correo, datos.contrasena)
        return result
    except Exception as e:
        print(f"Error en endpoint login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: Usuario = Depends(get_current_user)
):
    """
    Endpoint para obtener información del usuario actual
    """
    return current_user

@router.get("/protected")
def protected_route(
    current_user: Usuario = Depends(get_current_user)
):
    """
    Ejemplo de ruta protegida que requiere autenticación
    """
    return {
        "mensaje": f"Hola {current_user.nombre}, esta es una ruta protegida",
        "usuario": current_user.identificacion
    }

@router.post("/logout")
def logout():
    """
    Endpoint para logout (principalmente para documentación)
    El logout se maneja en el frontend eliminando el token
    """
    return {"mensaje": "Logout exitoso"}