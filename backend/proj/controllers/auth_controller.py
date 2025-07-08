from datetime import timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from models.models import Usuario
from utils.security import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

def authenticate_user(db: Session, rucempresarial: str, correo: str, contrasena: str) -> Usuario:
    """
    Autentica un usuario verificando sus credenciales
    """
    print(f"Buscando usuario con RUC: {rucempresarial} y correo: {correo}")
    
    usuario = db.query(Usuario).filter(
        Usuario.rucempresarial == rucempresarial,
        Usuario.correo == correo
    ).first()
    
    if not usuario:
        print("Usuario no encontrado")
        return None
    
    print(f"Usuario encontrado: {usuario.nombre}")
    
    if not verify_password(contrasena, usuario.contrasena):
        print("Contraseña incorrecta")
        return None
    
    print("Autenticación exitosa")
    return usuario

def login(db: Session, rucempresarial: str, correo: str, contrasena: str):
    """
    Procesa el login del usuario y retorna un token JWT
    """
    try:
        # Autenticar usuario
        usuario = authenticate_user(db, rucempresarial, correo, contrasena)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verificar que el usuario esté activo
        if usuario.estado != 'activo':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario inactivo",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Crear token de acceso
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": usuario.identificacion}, 
            expires_delta=access_token_expires
        )
        
        # Retornar respuesta consistente con lo que espera el frontend
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "identificacion": usuario.identificacion,
                "nombre": usuario.nombre,
                "correo": usuario.correo,
                "rucempresarial": usuario.rucempresarial,
                "estado": usuario.estado,
                "rol": usuario.id_rol
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )