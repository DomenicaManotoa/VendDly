from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    """Modelo básico para la respuesta del token"""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """Modelo para los datos del token"""
    identificacion: Optional[str] = None

class UserResponse(BaseModel):
    """Modelo para respuesta de usuario (sin contraseña)"""
    identificacion: str
    rucempresarial: str
    nombre: str
    correo: str
    celular: str
    estado: str
    
    class Config:
        from_attributes = True

class RolInfo(BaseModel):
    id_rol: int
    descripcion: str

class UserLoginInfo(BaseModel):
    identificacion: str
    nombre: str
    correo: str
    rucempresarial: str
    estado: str
    rol: RolInfo

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserLoginInfo