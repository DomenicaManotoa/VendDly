from sqlalchemy import Column, Integer, String, Date, ForeignKey, Float
from sqlalchemy.orm import relationship
from database import Base  
from pydantic import BaseModel
from pydantic import BaseModel, validator, EmailStr
from datetime import datetime
from typing import Optional



# Modelo Pydantic para login con validaciones mejoradas
class LoginRequest(BaseModel):
    rucempresarial: str
    correo: str
    contrasena: str

    @validator('rucempresarial')
    def validate_ruc(cls, v):
        if not v:
            raise ValueError('El RUC no puede estar vacío')
        v = v.strip()
        if len(v) < 10 or len(v) > 13:
            raise ValueError('El RUC debe tener entre 10 y 13 caracteres')
        # Remover validación de solo números para permitir más flexibilidad
        return v

    @validator('correo')
    def validate_email(cls, v):
        if not v:
            raise ValueError('El correo no puede estar vacío')
        v = v.strip().lower()  # Normalizar email
        if '@' not in v or '.' not in v.split('@')[-1]:
            raise ValueError('Formato de correo electrónico inválido')
        return v

    @validator('contrasena')
    def validate_password(cls, v):
        if not v:
            raise ValueError('La contraseña no puede estar vacía')
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        return v
    
class Rol(Base):
    __tablename__ = 'roles'

    id_rol = Column(Integer, primary_key=True, index=True)
    descripcion = Column(String(100))

    usuarios = relationship("Usuario", back_populates="rol")

class Usuario(Base):
    __tablename__ = 'usuarios'

    identificacion = Column(String(50), primary_key=True, index=True)  # Cambiado de Integer a String(50)
    rucempresarial = Column(String(50), nullable=True)
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

class Producto(Base):
    __tablename__ = 'productos'

    id_producto = Column(Integer, primary_key=True, autoincrement=True, index=True)
    id_marca = Column(Integer, ForeignKey('marca.id_marca'))
    stock = Column(String)  # Si quieres que sea numérico, usa Float o Integer según tu necesidad
    precio_mayorista = Column(Float)
    precio_minorista = Column(Float)
    id_categoria = Column(Integer, ForeignKey('categoria.id_categoria'))
    iva = Column(Float)
    estado = Column(String(50))

    marca = relationship("Marca")
    categoria = relationship("Categoria")


class Pedido(Base):
    __tablename__ = 'pedido'

    id_pedido = Column(Integer, primary_key=True, autoincrement=True, index=True)
    estado = Column(String(50))
    numero_pedido = Column(String)
    fecha_pedido = Column(Date)
    subtotal = Column(Float)
    iva = Column(Float)
    total = Column(Float)
    cod_cliente = Column(Integer, ForeignKey('cliente.cod_cliente'))

    cliente = relationship("Cliente")
    
class EstadoPedido(Base):
    __tablename__ = 'estado_pedido'

    id_estado_pedido = Column(Integer, primary_key=True, autoincrement=True, index=True)
    id_pedido = Column(Integer, ForeignKey('pedido.id_pedido'))
    fecha_actualizada = Column(Date)
    descripcion = Column(String(200))

    pedido = relationship("Pedido")

class DetallePedido(Base):
    __tablename__ = 'detalle_pedido'

    id_detalle_pedido = Column(Integer, primary_key=True, autoincrement=True, index=True)
    id_pedido = Column(Integer, ForeignKey('pedido.id_pedido'))
    id_producto = Column(Integer, ForeignKey('productos.id_producto'))
    cantidad = Column(Integer)
    precio_unitario = Column(Float)
    descuento = Column(Float)
    subtotal_lineal = Column(Float)
    subtotal = Column(Float)

    pedido = relationship("Pedido")
    producto = relationship("Producto")

class Factura(Base):
    __tablename__ = 'factura'

    id_factura = Column(Integer, primary_key=True, autoincrement=True, index=True)
    cod_cliente = Column(Integer, ForeignKey('cliente.cod_cliente'))
    numero_factura = Column(Integer, autoincrement=True)
    fecha_emision = Column(Date)
    estado = Column(String(50))
    subtotal = Column(Float)
    iva = Column(Float)
    total = Column(Float)

    cliente = relationship("Cliente")

class DetalleFactura(Base):
    __tablename__ = 'detalle_factura'

    id_detalle_factura = Column(Integer, primary_key=True, autoincrement=True, index=True)
    id_factura = Column(Integer, ForeignKey('factura.id_factura'))
    id_producto = Column(Integer, ForeignKey('productos.id_producto'))
    cantidad = Column(Integer)
    precio_unitario = Column(Float)
    iva_producto = Column(Float)
    subtotal_lineal = Column(Float)

    factura = relationship("Factura", backref="detalles_factura")
    producto = relationship("Producto")