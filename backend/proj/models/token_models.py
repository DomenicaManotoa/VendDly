from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    """Modelo para la respuesta del token"""
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