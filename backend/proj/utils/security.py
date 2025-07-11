from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
import hashlib
import secrets

# Configuración para el hashing de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuración JWT
SECRET_KEY = "tu_clave_secreta_super_segura_aqui"  # En producción, usa variables de entorno
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def generate_salt() -> str:
    """Genera un salt aleatorio"""
    return secrets.token_hex(32)  # 64 caracteres hexadecimales

def hash_password_with_salt(password: str, salt: str) -> str:
    """Hashea una contraseña usando bcrypt con salt personalizado"""
    # Combinar la contraseña con el salt
    salted_password = password + salt
    return pwd_context.hash(salted_password)

def hash_password(password: str) -> str:
    """Hashea una contraseña usando bcrypt (mantener para compatibilidad)"""
    return pwd_context.hash(password)

def verify_password_with_salt(plain_password: str, hashed_password: str, salt: str) -> bool:
    """Verifica una contraseña contra su hash usando salt"""
    # Combinar la contraseña con el salt
    salted_password = plain_password + salt
    return pwd_context.verify(salted_password, hashed_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña contra su hash (mantener para compatibilidad)"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea un token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Verifica y decodifica un token JWT"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )