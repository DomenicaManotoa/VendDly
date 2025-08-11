from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_admin
from controllers import pedido_controller
from models.models import Usuario
from typing import Dict, Any
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/pedidos")
def listar_pedidos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Lista todos los pedidos con sus detalles (requiere autenticación)"""
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita lista de pedidos")
        pedidos = pedido_controller.get_pedidos(db)
        logger.info(f"Se encontraron {len(pedidos)} pedidos")
        return pedidos
    except Exception as e:
        logger.error(f"Error al listar pedidos: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")
    
@router.get("/pedidos/disponibles-para-ruta")
def obtener_pedidos_disponibles_para_ruta(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtiene pedidos que pueden ser asignados a rutas de entrega"""
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita pedidos disponibles para ruta")
        
        # Obtener pedidos que no están asignados a ninguna ruta de entrega
        from models.models import Pedido, Ruta
        
        # Subconsulta para obtener pedidos ya asignados a rutas
        pedidos_asignados = db.query(Ruta.id_pedido).filter(
            Ruta.id_pedido.isnot(None),
            Ruta.tipo_ruta == 'entrega'
        ).subquery()
        
        # Obtener pedidos no asignados
        pedidos_disponibles = db.query(Pedido).filter(
            ~Pedido.id_pedido.in_(pedidos_asignados)
        ).all()
        
        result = []
        for pedido in pedidos_disponibles:
            # Obtener información del cliente
            cliente_info = None
            if pedido.cliente:
                cliente_info = {
                    "nombre": pedido.cliente.nombre,
                    "direccion": pedido.cliente.direccion,
                    "sector": pedido.cliente.sector
                }
            
            pedido_dict = {
                "id_pedido": pedido.id_pedido,
                "numero_pedido": pedido.numero_pedido,
                "fecha_pedido": pedido.fecha_pedido,
                "cod_cliente": pedido.cod_cliente,
                "total": pedido.total,
                "subtotal": pedido.subtotal,
                "iva": pedido.iva,
                "cliente_info": cliente_info
            }
            result.append(pedido_dict)
        
        logger.info(f"Se encontraron {len(result)} pedidos disponibles para ruta")
        return result
        
    except Exception as e:
        logger.error(f"Error al obtener pedidos disponibles para ruta: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/pedidos/{id_pedido}")
def obtener_pedido(
    id_pedido: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtiene un pedido específico con sus detalles (requiere autenticación)"""
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita pedido ID: {id_pedido}")
        return pedido_controller.get_pedido(db, id_pedido)
    except Exception as e:
        logger.error(f"Error al obtener pedido {id_pedido}: {e}")
        raise

@router.post("/pedidos")
def crear_pedido(
    pedido: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Crea un nuevo pedido con sus detalles (requiere autenticación)
    Estructura esperada:
    {
        "numero_pedido": "PED-123",
        "fecha_pedido": "2025-01-01",
        "subtotal": 100.0,
        "iva": 12.0,
        "total": 112.0,
        "cod_cliente": "CLI001",
        "detalle_pedido": [
            {
                "id_producto": 1,
                "cantidad": 2,
                "precio_unitario": 50.0,
                "descuento": 0.0,
                "subtotal_lineal": 100.0,
                "subtotal": 100.0
            }
        ]
    }
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} crea nuevo pedido")
        logger.info(f"Datos recibidos: {pedido}")
        
        # Validar datos básicos
        if not pedido.get("cod_cliente"):
            raise HTTPException(status_code=400, detail="cod_cliente es requerido")
        
        if not pedido.get("detalle_pedido"):
            raise HTTPException(status_code=400, detail="detalle_pedido es requerido")
        
        # Crear el pedido
        nuevo_pedido = pedido_controller.create_pedido(db, pedido)
        logger.info(f"Pedido creado con ID: {nuevo_pedido['id_pedido']}")
        
        return nuevo_pedido
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al crear pedido: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.put("/pedidos/{id_pedido}")
def editar_pedido(
    id_pedido: int,
    pedido: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Edita un pedido existente con sus detalles (requiere autenticación)
    Estructura esperada similar a crear_pedido pero con "detalles" en lugar de "detalle_pedido"
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} edita pedido ID: {id_pedido}")
        logger.info(f"Datos recibidos: {pedido}")
        
        # Validar que el pedido existe
        pedido_existente = pedido_controller.get_pedido(db, id_pedido)
        if not pedido_existente:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        
        # Actualizar el pedido
        pedido_actualizado = pedido_controller.update_pedido(db, id_pedido, pedido)
        logger.info(f"Pedido {id_pedido} actualizado correctamente")
        
        return pedido_actualizado
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al editar pedido {id_pedido}: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.delete("/pedidos/{id_pedido}")
def eliminar_pedido(
    id_pedido: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """Elimina un pedido y todos sus detalles (requiere rol admin)"""
    try:
        logger.info(f"Usuario {current_user.identificacion} elimina pedido ID: {id_pedido}")
        
        resultado = pedido_controller.delete_pedido(db, id_pedido)
        logger.info(f"Pedido {id_pedido} eliminado correctamente")
        
        return resultado
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al eliminar pedido {id_pedido}: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/productos")
def listar_productos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Lista todos los productos disponibles para pedidos"""
    try:
        from models.models import Producto
        productos = db.query(Producto).filter(Producto.estado == "Activo").all()
        
        result = []
        for producto in productos:
            producto_dict = {
                "id_producto": producto.id_producto,
                "nombre": producto.nombre,
                "precio_mayorista": producto.precio_mayorista,
                "precio_minorista": producto.precio_minorista,
                "stock": producto.stock,
                "iva": producto.iva,
                "estado": producto.estado
            }
            result.append(producto_dict)
        
        return result
        
    except Exception as e:
        logger.error(f"Error al listar productos: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener productos")