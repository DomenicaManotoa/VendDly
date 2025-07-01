from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base  
from pydantic import BaseModel

class LoginRequest(BaseModel):
    rucempresarial: str
    correo: str
    contrasena: str
    
class Rol(Base):
    __tablename__ = 'roles'

    id_rol = Column(Integer, primary_key=True, index=True)
    descripcion = Column(String(100))

    usuarios = relationship("Usuario", back_populates="rol")

class Usuario(Base):
    __tablename__ = 'usuarios'

    identificacion = Column(String(50), primary_key=True, index=True)  # Cambiado de Integer a String(50)
    rucempresarial = Column(String(50)) 
    nombre = Column(String(100))
    correo = Column(String(100))
    celular = Column(String(200))
    contrasena = Column(String(100))
    estado = Column(String(50))
    fecha_actualizacion = Column(Date)
    id_rol = Column(Integer, ForeignKey('roles.id_rol'))

    rol = relationship("Rol", back_populates="usuarios")
    

class Cliente(Base):
    __tablename__ = 'cliente'

    cod_cliente = Column(Integer, primary_key=True, index=True, autoincrement=True)
    identificacion = Column(String(50), ForeignKey('usuarios.identificacion'))
    nombre = Column(String(100))
    direccion = Column(String(200))
    celular = Column(String(20))
    tipo_cliente = Column(String(50))
    razon_social = Column(String(100))
    sector = Column(String(100))
    fecha_registro = Column(Date)

    usuario = relationship("Usuario", backref="clientes")

class Categoria(Base):
    __tablename__ = 'categoria'

    id_categoria = Column(Integer, primary_key=True, autoincrement=True, index=True)
    descripcion = Column(String(100), nullable=False)

class Marca(Base):
    __tablename__ = 'marca'

    id_marca = Column(Integer, primary_key=True, autoincrement=True, index=True)
    descripcion = Column(String(100), nullable=False)
