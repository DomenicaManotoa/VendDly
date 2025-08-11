from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import Pedido, DetallePedido
from typing import Dict, Any
from datetime import datetime

def get_pedidos(db: Session):
    """Obtiene todos los pedidos con sus detalles"""
    pedidos = db.query(Pedido).all()
    result = []
    for pedido in pedidos:
        pedido_dict = {
            "id_pedido": pedido.id_pedido,
            "numero_pedido": pedido.numero_pedido,
            "fecha_pedido": pedido.fecha_pedido,
            "subtotal": pedido.subtotal,
            "iva": pedido.iva,
            "total": pedido.total,
            "cod_cliente": pedido.cod_cliente,
            "detalles": []
        }
        
        # Cargar detalles del pedido
        for detalle in pedido.detalles:
            detalle_dict = {
                "id_detalle_pedido": detalle.id_detalle_pedido,
                "id_pedido": detalle.id_pedido,
                "id_producto": detalle.id_producto,
                "cantidad": detalle.cantidad,
                "precio_unitario": detalle.precio_unitario,
                "descuento": detalle.descuento,
                "subtotal_lineal": detalle.subtotal_lineal,
                "subtotal": detalle.subtotal
            }
            pedido_dict["detalles"].append(detalle_dict)
        
        result.append(pedido_dict)
    
    return result

def get_pedido(db: Session, id_pedido: int):
    """Obtiene un pedido específico con sus detalles"""
    pedido = db.query(Pedido).filter(Pedido.id_pedido == id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    pedido_dict = {
        "id_pedido": pedido.id_pedido,
        "numero_pedido": pedido.numero_pedido,
        "fecha_pedido": pedido.fecha_pedido,
        "subtotal": pedido.subtotal,
        "iva": pedido.iva,
        "total": pedido.total,
        "cod_cliente": pedido.cod_cliente,
        "detalles": []
    }
    
    # Cargar detalles del pedido
    for detalle in pedido.detalles:
        detalle_dict = {
            "id_detalle_pedido": detalle.id_detalle_pedido,
            "id_pedido": detalle.id_pedido,
            "id_producto": detalle.id_producto,
            "cantidad": detalle.cantidad,
            "precio_unitario": detalle.precio_unitario,
            "descuento": detalle.descuento,
            "subtotal_lineal": detalle.subtotal_lineal,
            "subtotal": detalle.subtotal
        }
        pedido_dict["detalles"].append(detalle_dict)
    
    return pedido_dict

def create_pedido(db: Session, pedido_data: Dict[str, Any]):
    """Crea un nuevo pedido con sus detalles"""
    try:
        data_copy = pedido_data.copy()
        detalles_data = data_copy.get('detalle_pedido', [])
        
        fecha_pedido = data_copy.get("fecha_pedido")
        if isinstance(fecha_pedido, str):
            fecha_pedido = datetime.strptime(fecha_pedido, "%Y-%m-%d").date()
        
        pedido_fields = {
            "numero_pedido": data_copy.get("numero_pedido"),
            "fecha_pedido": fecha_pedido,
            "subtotal": float(data_copy.get("subtotal", 0)),
            "iva": float(data_copy.get("iva", 0)),
            "total": float(data_copy.get("total", 0)),
            "cod_cliente": data_copy.get("cod_cliente")
        }
        
        # Filtrar campos None
        pedido_fields = {k: v for k, v in pedido_fields.items() if v is not None}
        
        # Crear el pedido
        nuevo_pedido = Pedido(**pedido_fields)
        db.add(nuevo_pedido)
        db.flush()  # Para obtener el ID del pedido sin hacer commit
        
        # Crear los detalles del pedido
        detalles_creados = []
        for detalle_data in detalles_data:
            detalle_fields = {
                "id_pedido": nuevo_pedido.id_pedido,
                "id_producto": detalle_data.get("id_producto"),
                "cantidad": detalle_data.get("cantidad", 1),
                "precio_unitario": detalle_data.get("precio_unitario", 0),
                "descuento": detalle_data.get("descuento", 0),
                "subtotal_lineal": detalle_data.get("subtotal_lineal", 0),
                "subtotal": detalle_data.get("subtotal", 0)
            }
            
            nuevo_detalle = DetallePedido(**detalle_fields)
            db.add(nuevo_detalle)
            detalles_creados.append(nuevo_detalle)
        
        # Hacer commit de todo
        db.commit()
        db.refresh(nuevo_pedido)
        
        response = {
            "id_pedido": nuevo_pedido.id_pedido,
            "numero_pedido": nuevo_pedido.numero_pedido,
            "fecha_pedido": nuevo_pedido.fecha_pedido,
            "subtotal": nuevo_pedido.subtotal,
            "iva": nuevo_pedido.iva,
            "total": nuevo_pedido.total,
            "cod_cliente": nuevo_pedido.cod_cliente,
            "detalles": []
        }
        
        for detalle in detalles_creados:
            db.refresh(detalle)
            detalle_dict = {
                "id_detalle_pedido": detalle.id_detalle_pedido,
                "id_pedido": detalle.id_pedido,
                "id_producto": detalle.id_producto,
                "cantidad": detalle.cantidad,
                "precio_unitario": detalle.precio_unitario,
                "descuento": detalle.descuento,
                "subtotal_lineal": detalle.subtotal_lineal,
                "subtotal": detalle.subtotal
            }
            response["detalles"].append(detalle_dict)
        
        return response
        
    except Exception as e:
        db.rollback()
        print(f"Error detallado al crear pedido: {str(e)}")
        print(f"Tipo de error: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al crear pedido: {str(e)}")

def update_pedido(db: Session, id_pedido: int, pedido_data: Dict[str, Any]):
    """Actualiza un pedido existente con sus detalles"""
    try:
        pedido = db.query(Pedido).filter(Pedido.id_pedido == id_pedido).first()
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        
        # Extraer detalles del pedido_data
        detalles_data = pedido_data.pop('detalles', [])
        
        # Actualizar campos del pedido
        for key, value in pedido_data.items():
            if hasattr(pedido, key) and value is not None:
                setattr(pedido, key, value)
        
        # Eliminar detalles existentes
        db.query(DetallePedido).filter(DetallePedido.id_pedido == id_pedido).delete()
        
        # Crear nuevos detalles
        detalles_actualizados = []
        for detalle_data in detalles_data:
            detalle_fields = {
                "id_pedido": id_pedido,
                "id_producto": detalle_data.get("id_producto"),
                "cantidad": detalle_data.get("cantidad", 1),
                "precio_unitario": detalle_data.get("precio_unitario", 0),
                "descuento": detalle_data.get("descuento", 0),
                "subtotal_lineal": detalle_data.get("subtotal_lineal", 0),
                "subtotal": detalle_data.get("subtotal", 0)
            }
            
            nuevo_detalle = DetallePedido(**detalle_fields)
            db.add(nuevo_detalle)
            detalles_actualizados.append(nuevo_detalle)
        
        db.commit()
        db.refresh(pedido)
        
        # Preparar respuesta con detalles actualizados
        response = {
            "id_pedido": pedido.id_pedido,
            "numero_pedido": pedido.numero_pedido,
            "fecha_pedido": pedido.fecha_pedido,
            "subtotal": pedido.subtotal,
            "iva": pedido.iva,
            "total": pedido.total,
            "cod_cliente": pedido.cod_cliente,
            "detalles": []
        }
        
        for detalle in detalles_actualizados:
            db.refresh(detalle)
            detalle_dict = {
                "id_detalle_pedido": detalle.id_detalle_pedido,
                "id_pedido": detalle.id_pedido,
                "id_producto": detalle.id_producto,
                "cantidad": detalle.cantidad,
                "precio_unitario": detalle.precio_unitario,
                "descuento": detalle.descuento,
                "subtotal_lineal": detalle.subtotal_lineal,
                "subtotal": detalle.subtotal
            }
            response["detalles"].append(detalle_dict)
        
        return response
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar pedido: {str(e)}")

def delete_pedido(db: Session, id_pedido: int):
    """Elimina un pedido y sus detalles"""
    try:
        pedido = db.query(Pedido).filter(Pedido.id_pedido == id_pedido).first()
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        
        # Eliminar detalles primero (por integridad referencial)
        db.query(DetallePedido).filter(DetallePedido.id_pedido == id_pedido).delete()
        
        # Eliminar el pedido
        db.delete(pedido)
        db.commit()
        
        return {"mensaje": "Pedido eliminado correctamente"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar pedido: {str(e)}")