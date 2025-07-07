from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import SessionLocal
from models.models import Usuario
from utils.security import verify_token

# Configuración del esquema de autenticación Bearer
security = HTTPBearer()

def get_db():
    """Dependencia para obtener la sesión de base de datos"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Usuario:
    """
    Dependencia para obtener el usuario actual desde el token JWT
    """
    token = credentials.credentials
    
    # Verificar y decodificar el token
    payload = verify_token(token)
    
    # Extraer la identificación del usuario del token
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Buscar el usuario en la base de datos
    user = db.query(Usuario).filter(Usuario.identificacion == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

def require_role(required_role_id: int):
    """
    Dependencia para verificar que el usuario tenga un rol específico por ID
    """
    def role_checker(current_user: Usuario = Depends(get_current_user)):
        if current_user.id_rol != required_role_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permisos insuficientes"
            )
        return current_user
    return role_checker

def require_role_by_name(required_role_name: str):
    """
    Dependencia para verificar que el usuario tenga un rol específico por nombre
    """
    def role_checker(current_user: Usuario = Depends(get_current_user)):
        if current_user.rol.descripcion != required_role_name:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permisos insuficientes"
            )
        return current_user
    return role_checker

def require_admin():
    """
    Dependencia específica para verificar que el usuario sea Admin
    """
    def admin_checker(current_user: Usuario = Depends(get_current_user)):
        if current_user.id_rol != 1:  # Admin = id_rol 1
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permisos insuficientes - Se requiere rol de administrador"
            )
        return current_user
    return admin_checker