from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import UbicacionCliente, Cliente

def get_ubicaciones(db: Session):
    return db.query(UbicacionCliente).all()

def get_ubicacion(db: Session, id_ubicacion: int):
    ubicacion = db.query(UbicacionCliente).filter(UbicacionCliente.id_ubicacion == id_ubicacion).first()
    if not ubicacion:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    return ubicacion

def create_ubicacion(db: Session, ubicacion_data: dict):
    """
    Crea una nueva ubicación y automáticamente la establece como ubicación principal
    si el cliente no tiene una ubicación principal asignada
    """
    try:
        # Verificar que el cliente exista
        cliente = db.query(Cliente).filter(Cliente.cod_cliente == ubicacion_data['cod_cliente']).first()
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
        # Crear nueva ubicación
        nueva_ubicacion = UbicacionCliente(**ubicacion_data)
        db.add(nueva_ubicacion)
        db.commit()
        db.refresh(nueva_ubicacion)
        
        # Si el cliente no tiene ubicación principal, establecer esta como principal
        if not cliente.id_ubicacion_principal:
            cliente.id_ubicacion_principal = nueva_ubicacion.id_ubicacion
            db.commit()
            db.refresh(cliente)
            
        return nueva_ubicacion
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear ubicación: {str(e)}")

def update_ubicacion(db: Session, id_ubicacion: int, ubicacion_data: dict):
    """
    Actualiza una ubicación existente
    """
    try:
        ubicacion = db.query(UbicacionCliente).filter(UbicacionCliente.id_ubicacion == id_ubicacion).first()
        if not ubicacion:
            raise HTTPException(status_code=404, detail="Ubicación no encontrada")
        
        for key, value in ubicacion_data.items():
            setattr(ubicacion, key, value)
        
        db.commit()
        db.refresh(ubicacion)
        return ubicacion
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar ubicación: {str(e)}")

def delete_ubicacion(db: Session, id_ubicacion: int):
    """
    Elimina una ubicación y maneja la ubicación principal del cliente
    """
    try:
        ubicacion = db.query(UbicacionCliente).filter(UbicacionCliente.id_ubicacion == id_ubicacion).first()
        if not ubicacion:
            raise HTTPException(status_code=404, detail="Ubicación no encontrada")
        
        cod_cliente = ubicacion.cod_cliente
        
        # Verificar si esta ubicación es la principal del cliente
        cliente = db.query(Cliente).filter(Cliente.cod_cliente == cod_cliente).first()
        if cliente and cliente.id_ubicacion_principal == id_ubicacion:
            # Buscar otra ubicación del mismo cliente para establecer como principal
            otra_ubicacion = db.query(UbicacionCliente).filter(
                UbicacionCliente.cod_cliente == cod_cliente,
                UbicacionCliente.id_ubicacion != id_ubicacion
            ).first()
            
            if otra_ubicacion:
                cliente.id_ubicacion_principal = otra_ubicacion.id_ubicacion
            else:
                cliente.id_ubicacion_principal = None
            
            db.commit()
        
        # Eliminar la ubicación
        db.delete(ubicacion)
        db.commit()
        
        return {"mensaje": "Ubicación eliminada correctamente"}
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar ubicación: {str(e)}")

def set_ubicacion_principal(db: Session, cod_cliente: str, id_ubicacion: int):
    """
    Establece una ubicación específica como principal para un cliente
    """
    try:
        # Verificar que el cliente exista
        cliente = db.query(Cliente).filter(Cliente.cod_cliente == cod_cliente).first()
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
        # Verificar que la ubicación exista y pertenezca al cliente
        ubicacion = db.query(UbicacionCliente).filter(
            UbicacionCliente.id_ubicacion == id_ubicacion,
            UbicacionCliente.cod_cliente == cod_cliente
        ).first()
        
        if not ubicacion:
            raise HTTPException(
                status_code=404, 
                detail="Ubicación no encontrada o no pertenece al cliente"
            )
        
        # Establecer como ubicación principal
        cliente.id_ubicacion_principal = id_ubicacion
        db.commit()
        db.refresh(cliente)
        
        return {"mensaje": "Ubicación principal actualizada correctamente"}
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al establecer ubicación principal: {str(e)}")

def get_ubicaciones_by_cliente(db: Session, cod_cliente: str):
    """
    Obtiene todas las ubicaciones de un cliente específico
    """
    return db.query(UbicacionCliente).filter(UbicacionCliente.cod_cliente == cod_cliente).all()