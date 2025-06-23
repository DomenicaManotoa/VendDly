from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base  
from pydantic import BaseModel

class LoginRequest(BaseModel):
    correo: str
    contrasena: str
    
class Rol(Base):
    __tablename__ = 'roles'

    id_rol = Column(Integer, primary_key=True, index=True)
    descripcion = Column(String(100))

    usuarios = relationship("Usuario", back_populates="rol")

class Usuario(Base):
    __tablename__ = 'usuarios'

    identificacion = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100))
    correo = Column(String(100))
    celular = Column(String(200))
    contrasena = Column(String(100))
    estado = Column(String(50))
    fecha_actualizacion = Column(Date)
    id_rol = Column(Integer, ForeignKey('roles.id_rol'))

    rol = relationship("Rol", back_populates="usuarios")