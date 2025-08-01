from sqlalchemy import Column, Integer, String, Date, ForeignKey, Float, Text, DECIMAL, TIMESTAMP, Enum
from sqlalchemy.orm import relationship
from database import Base  
from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional
from sqlalchemy import func  # Añade este import al inicio del archivo models.py


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
        return v

    @validator('correo')
    def validate_email(cls, v):
        if not v:
            raise ValueError('El correo no puede estar vacío')
        v = v.strip().lower()
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

    identificacion = Column(String(50), primary_key=True, index=True)
    rucempresarial = Column(String(50), nullable=True)
    nombre = Column(String(100))
    correo = Column(String(100))
    celular = Column(String(20))
    contrasena = Column(String(100))
    salt = Column(String(64), nullable=False)
    estado = Column(String(50))
    fecha_actualizacion = Column(Date)
    id_rol = Column(Integer, ForeignKey('roles.id_rol'))

    rol = relationship("Rol", back_populates="usuarios")
    tracking_data = relationship("TrackingData", back_populates="usuario")
    historial_tracking = relationship("HistorialTracking", back_populates="usuario")

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
    nombre = Column(String(255))
    id_marca = Column(Integer, ForeignKey('marca.id_marca'))
    stock = Column(String)
    precio_mayorista = Column(Float)
    precio_minorista = Column(Float)
    id_categoria = Column(Integer, ForeignKey('categoria.id_categoria'))
    iva = Column(Float)
    estado = Column(String(50))
    imagen = Column(String(255))

    marca = relationship("Marca")
    categoria = relationship("Categoria")

class UbicacionCliente(Base):
    __tablename__ = 'ubicacion_cliente'

    id_ubicacion = Column(Integer, primary_key=True, autoincrement=True, index=True)
    cod_cliente = Column(String(50), ForeignKey('cliente.cod_cliente'), nullable=False)
    latitud = Column(DECIMAL(10, 8), nullable=False)
    longitud = Column(DECIMAL(11, 8), nullable=False)
    direccion = Column(Text, nullable=False)
    sector = Column(String(100), nullable=False)
    referencia = Column(Text)
    fecha_registro = Column(TIMESTAMP, server_default=func.now())  # Cambiado aquí

    cliente = relationship(
        "Cliente",
        back_populates="ubicaciones",
        foreign_keys=[cod_cliente]  # <--- Especificar aquí
    )

class Cliente(Base):
    __tablename__ = 'cliente'

    cod_cliente = Column(String(50), primary_key=True, index=True)
    identificacion = Column(String(50), ForeignKey('usuarios.identificacion'))
    nombre = Column(String(100))
    direccion = Column(String(200))
    celular = Column(String(20))
    correo = Column(String(100))
    tipo_cliente = Column(String(50))
    razon_social = Column(String(100))
    sector = Column(String(100))
    fecha_registro = Column(Date)
    id_ubicacion_principal = Column(Integer, ForeignKey('ubicacion_cliente.id_ubicacion'))

    usuario = relationship("Usuario", backref="clientes")
    ubicaciones = relationship(
        "UbicacionCliente",
        back_populates="cliente",
        foreign_keys="[UbicacionCliente.cod_cliente]"  # <--- Especificar aquí
    )
    pedidos = relationship("Pedido", back_populates="cliente")
    facturas = relationship("Factura", back_populates="cliente")

class Ruta(Base):
    __tablename__ = 'ruta'
    
    id_ruta = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    tipo_ruta = Column(Enum('venta', 'entrega', name='tipo_ruta_enum'), nullable=False)
    sector = Column(String(100))
    direccion = Column(String(255))
    estado = Column(String(50), server_default='Planificada')
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())
    fecha_ejecucion = Column(Date)
    poligono_geojson = Column(Text)
    
    # Relaciones
    asignaciones = relationship("AsignacionRuta", back_populates="ruta")
    pedidos_venta = relationship("Pedido", foreign_keys="Pedido.id_ruta_venta", back_populates="ruta_venta")
    pedidos_entrega = relationship("Pedido", foreign_keys="Pedido.id_ruta_entrega", back_populates="ruta_entrega")
    tracking_data = relationship("TrackingData", back_populates="ruta")

class AsignacionRuta(Base):
    __tablename__ = 'asignacion_ruta'
    
    id_asignacion = Column(Integer, primary_key=True, autoincrement=True)
    id_ruta = Column(Integer, ForeignKey('ruta.id_ruta'), nullable=False)
    
    # Campos para usuario (vendedor/transportista)
    identificacion_usuario = Column(String(50), ForeignKey('usuarios.identificacion'), nullable=True)
    tipo_usuario = Column(Enum('vendedor', 'transportista', name='tipo_usuario_enum'), nullable=True)
    
    # Campos para cliente (solo en rutas de venta)
    cod_cliente = Column(String(50), ForeignKey('cliente.cod_cliente'), nullable=True)
    id_ubicacion = Column(Integer, ForeignKey('ubicacion_cliente.id_ubicacion'), nullable=True)
    orden_visita = Column(Integer, nullable=True)
    
    # Relaciones
    ruta = relationship("Ruta", back_populates="asignaciones")
    usuario = relationship("Usuario")
    cliente = relationship("Cliente")
    ubicacion = relationship("UbicacionCliente")

class Pedido(Base):
    __tablename__ = 'pedido'
    
    id_pedido = Column(Integer, primary_key=True, autoincrement=True)
    estado = Column(String(50))
    numero_pedido = Column(String)
    fecha_pedido = Column(Date)
    subtotal = Column(Float)
    iva = Column(Float)
    total = Column(Float)
    cod_cliente = Column(String(50), ForeignKey('cliente.cod_cliente'))
    id_ubicacion_entrega = Column(Integer, ForeignKey('ubicacion_cliente.id_ubicacion'))
    id_ruta_venta = Column(Integer, ForeignKey('ruta.id_ruta'))  # Ruta donde se generó el pedido
    id_ruta_entrega = Column(Integer, ForeignKey('ruta.id_ruta'))  # Ruta para la entrega
    estado_entrega = Column(String(50), server_default='Pendiente')
    
    # Relaciones
    cliente = relationship("Cliente", back_populates="pedidos")
    ubicacion_entrega = relationship("UbicacionCliente")
    ruta_venta = relationship("Ruta", foreign_keys=[id_ruta_venta], back_populates="pedidos_venta")
    ruta_entrega = relationship("Ruta", foreign_keys=[id_ruta_entrega], back_populates="pedidos_entrega")
    estados = relationship("EstadoPedido", back_populates="pedido")
    detalles = relationship("DetallePedido", back_populates="pedido")

class EstadoPedido(Base):
    __tablename__ = 'estado_pedido'

    id_estado_pedido = Column(Integer, primary_key=True, autoincrement=True, index=True)
    id_pedido = Column(Integer, ForeignKey('pedido.id_pedido'))
    fecha_actualizada = Column(Date)
    descripcion = Column(String(200))

    pedido = relationship("Pedido", back_populates="estados")

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

    pedido = relationship("Pedido", back_populates="detalles")
    producto = relationship("Producto")


class TrackingData(Base):
    __tablename__ = 'tracking_data'

    id_tracking = Column(Integer, primary_key=True, autoincrement=True, index=True)
    id_ruta = Column(Integer, ForeignKey('ruta.id_ruta'), nullable=False)
    identificacion_usuario = Column(String(50), ForeignKey('usuarios.identificacion'), nullable=False)
    cod_cliente = Column(String(50), ForeignKey('cliente.cod_cliente'))
    latitud = Column(DECIMAL(10, 8), nullable=False)
    longitud = Column(DECIMAL(11, 8), nullable=False)
    precision = Column(Float)
    velocidad = Column(Float)
    evento = Column(String(50))
    observaciones = Column(Text)
    fecha_hora = Column(TIMESTAMP, server_default=func.now())  # Cambiado aquí

    ruta = relationship("Ruta", back_populates="tracking_data")
    usuario = relationship("Usuario", back_populates="tracking_data")
    cliente = relationship("Cliente")

class HistorialTracking(Base):
    __tablename__ = 'historial_tracking'

    id_historial = Column(Integer, primary_key=True, autoincrement=True, index=True)
    identificacion_usuario = Column(String(50), ForeignKey('usuarios.identificacion'), nullable=False)
    latitud = Column(DECIMAL(10, 8), nullable=False)
    longitud = Column(DECIMAL(11, 8), nullable=False)
    fecha_hora = Column(TIMESTAMP, server_default=func.now())  # Cambiado aquí

    usuario = relationship("Usuario", back_populates="historial_tracking")

class Factura(Base):
    __tablename__ = 'factura'

    id_factura = Column(Integer, primary_key=True, autoincrement=True, index=True)
    cod_cliente = Column(String(50), ForeignKey('cliente.cod_cliente'))
    numero_factura = Column(Integer, autoincrement=True)
    fecha_emision = Column(Date)
    estado = Column(String(50))
    subtotal = Column(Float)
    iva = Column(Float)
    total = Column(Float)

    cliente = relationship("Cliente", back_populates="facturas")
    detalles = relationship("DetalleFactura", back_populates="factura")

class DetalleFactura(Base):
    __tablename__ = 'detalle_factura'

    id_detalle_factura = Column(Integer, primary_key=True, autoincrement=True, index=True)
    id_factura = Column(Integer, ForeignKey('factura.id_factura'))
    id_producto = Column(Integer, ForeignKey('productos.id_producto'))
    cantidad = Column(Integer)
    precio_unitario = Column(Float)
    iva_producto = Column(Float)
    subtotal_lineal = Column(Float)

    factura = relationship("Factura", back_populates="detalles")
    producto = relationship("Producto")