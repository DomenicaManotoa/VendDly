from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import Ruta, AsignacionRuta, UbicacionCliente, Usuario, Rol, Pedido, EstadoPedido, Cliente  # Agregar Cliente aquí  
from sqlalchemy import and_, func, or_
from datetime import datetime

# En ruta_controller.py - Corregir validate_user_role (línea ~8)
def validate_user_role(db: Session, user_id: str, required_role: str):
    """Valida que el usuario tenga el rol requerido (por descripción exacta)"""
    user = db.query(Usuario).filter(Usuario.identificacion == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    role = db.query(Rol).filter(Rol.id_rol == user.id_rol).first()
    if not role:
        raise HTTPException(status_code=404, detail="Rol del usuario no encontrado")
    
    # Hacer la comparación más flexible - buscar por palabras clave
    role_desc = role.descripcion.lower().strip()
    required_role_lower = required_role.lower().strip()
    
    # Permitir coincidencias por palabras clave
    if required_role_lower == 'vendedor' and 'vendedor' in role_desc:
        return True
    elif required_role_lower == 'transportista' and ('transportista' in role_desc or 'transporte' in role_desc):
        return True
    elif role_desc == required_role_lower:
        return True
    else:
        raise HTTPException(
            status_code=400, 
            detail=f"El usuario debe tener rol de {required_role}. Rol actual: {role.descripcion}"
        )
    
# Agregar nueva función para validar asignaciones
def validate_assignment_constraints(db: Session, ruta_data: dict, asignaciones_data: list):
    """Validar restricciones específicas de asignación según tipo de ruta"""
    tipo_ruta = ruta_data['tipo_ruta']
    
    for asignacion_data in asignaciones_data:
        usuario_id = asignacion_data.get('identificacion_usuario')
        if not usuario_id:
            continue
            
        # Validar rol según tipo de ruta - usar nombres más flexibles
        if tipo_ruta == 'venta':
            required_role = 'vendedor'
        elif tipo_ruta == 'entrega':
            required_role = 'transportista'
        else:
            raise HTTPException(status_code=400, detail="Tipo de ruta inválido")
        
        validate_user_role(db, usuario_id, required_role)

def get_rutas(db: Session):
    return db.query(Ruta).all()

def get_ruta(db: Session, id_ruta: int):
    ruta = db.query(Ruta).filter(Ruta.id_ruta == id_ruta).first()
    if not ruta:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    return ruta


def get_rutas_usuario(db: Session, user_id: str):
    """Obtener rutas asignadas a un usuario específico"""
    try:
        rutas = db.query(Ruta).join(AsignacionRuta).filter(
            AsignacionRuta.identificacion_usuario == user_id
        ).all()
        
        resultado = []
        for ruta in rutas:
            ruta_dict = {
                "id_ruta": ruta.id_ruta,
                "nombre": ruta.nombre,
                "tipo_ruta": ruta.tipo_ruta,
                "sector": ruta.sector,
                "direccion": ruta.direccion,
                "estado": ruta.estado,
                "fecha_creacion": ruta.fecha_creacion,
                "fecha_ejecucion": ruta.fecha_ejecucion
            }
            resultado.append(ruta_dict)
        
        return resultado
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener rutas del usuario: {str(e)}")

# Modificar la función create_ruta para usar la nueva validación
def create_ruta(db: Session, ruta_data: dict):
    try:
        asignaciones_data = ruta_data.pop('asignaciones', [])
        
        # Validar asignaciones antes de crear la ruta
        if asignaciones_data:
            validate_assignment_constraints(db, ruta_data, asignaciones_data)
        
        nueva_ruta = Ruta(**ruta_data)
        db.add(nueva_ruta)
        db.flush()
        
        for asignacion_data in asignaciones_data:
            nueva_asignacion = AsignacionRuta(
                id_ruta=nueva_ruta.id_ruta,
                **asignacion_data
            )
            db.add(nueva_asignacion)
        
        db.commit()
        db.refresh(nueva_ruta)
        return nueva_ruta
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al crear ruta: {str(e)}")

def update_ruta(db: Session, id_ruta: int, ruta_data: dict):
    try:
        ruta = db.query(Ruta).filter(Ruta.id_ruta == id_ruta).first()
        if not ruta:
            raise HTTPException(status_code=404, detail="Ruta no encontrada")
        
        asignaciones_data = ruta_data.pop('asignaciones', None)
        
        for key, value in ruta_data.items():
            setattr(ruta, key, value)
        
        if asignaciones_data is not None:
            # Validar nuevas asignaciones
            for asignacion_data in asignaciones_data:
                if asignacion_data.get('identificacion_usuario'):
                    required_role = 'vendedor' if ruta.tipo_ruta == 'venta' else 'transportista'
                    validate_user_role(db, asignacion_data['identificacion_usuario'], required_role)
            
            db.query(AsignacionRuta).filter(AsignacionRuta.id_ruta == id_ruta).delete()
            
            for asignacion_data in asignaciones_data:
                nueva_asignacion = AsignacionRuta(
                    id_ruta=id_ruta,
                    **asignacion_data
                )
                db.add(nueva_asignacion)
        
        db.commit()
        db.refresh(ruta)
        return ruta
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al actualizar ruta: {str(e)}")

def delete_ruta(db: Session, id_ruta: int):
    try:
        ruta = db.query(Ruta).filter(Ruta.id_ruta == id_ruta).first()
        if not ruta:
            raise HTTPException(status_code=404, detail="Ruta no encontrada")
        
        # Eliminar asignaciones relacionadas
        db.query(AsignacionRuta).filter(AsignacionRuta.id_ruta == id_ruta).delete()
        
        # Eliminar la ruta
        db.delete(ruta)
        db.commit()
        return {"mensaje": "Ruta eliminada"}
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al eliminar ruta: {str(e)}")

# REEMPLAZAR la función get_rutas_con_asignaciones:
def get_rutas_con_asignaciones(db: Session):
    """Obtener rutas con sus asignaciones incluidas"""
    rutas = db.query(Ruta).all()
    resultado = []
    
    for ruta in rutas:
        ruta_dict = {
            "id_ruta": ruta.id_ruta,
            "nombre": ruta.nombre,
            "tipo_ruta": ruta.tipo_ruta,
            "sector": ruta.sector,
            "direccion": ruta.direccion,
            "estado": ruta.estado,
            "fecha_creacion": ruta.fecha_creacion,
            "fecha_ejecucion": ruta.fecha_ejecucion,
            "id_pedido": ruta.id_pedido,  # NUEVO CAMPO
            "pedido_info": None,  # NUEVO CAMPO
            "asignaciones": []
        }
        
        # Si tiene pedido asignado, obtener información del pedido
        if ruta.id_pedido and ruta.pedido:
            ruta_dict["pedido_info"] = {
                "id_pedido": ruta.pedido.id_pedido,
                "numero_pedido": ruta.pedido.numero_pedido,
                "fecha_pedido": ruta.pedido.fecha_pedido.strftime('%Y-%m-%d') if ruta.pedido.fecha_pedido else None,
                "total": float(ruta.pedido.total) if ruta.pedido.total else 0,
                "subtotal": float(ruta.pedido.subtotal) if ruta.pedido.subtotal else 0,
                "iva": float(ruta.pedido.iva) if ruta.pedido.iva else 0,
                "cod_cliente": ruta.pedido.cod_cliente,
                "estado": get_ultimo_estado_pedido(db, ruta.pedido.id_pedido),
                "cliente_info": {
                    "nombre": ruta.pedido.cliente.nombre if ruta.pedido.cliente else None,
                    "direccion": ruta.pedido.cliente.direccion if ruta.pedido.cliente else None,
                    "sector": ruta.pedido.cliente.sector if ruta.pedido.cliente else None
                }
            }
        
        for asignacion in ruta.asignaciones:
            asignacion_dict = {
                "id_asignacion": asignacion.id_asignacion,
                "identificacion_usuario": asignacion.identificacion_usuario,
                "tipo_usuario": asignacion.tipo_usuario,
                "cod_cliente": asignacion.cod_cliente,
                "id_ubicacion": asignacion.id_ubicacion,
                "orden_visita": asignacion.orden_visita,
                "usuario": {
                    "nombre": asignacion.usuario.nombre if asignacion.usuario else None,
                    "correo": asignacion.usuario.correo if asignacion.usuario else None
                } if asignacion.usuario else None
            }
            
            # Agregar información de la ubicación si existe
            if asignacion.ubicacion:
                asignacion_dict["ubicacion_info"] = {
                    "direccion": asignacion.ubicacion.direccion,
                    "sector": asignacion.ubicacion.sector,
                    "latitud": float(asignacion.ubicacion.latitud),
                    "longitud": float(asignacion.ubicacion.longitud),
                    "referencia": asignacion.ubicacion.referencia
                }
            
            ruta_dict["asignaciones"].append(asignacion_dict)
        
        resultado.append(ruta_dict)
    
    return resultado

# NUEVA función para asignar pedido a ruta de entrega:
def asignar_pedido_a_ruta_entrega(db: Session, id_ruta: int, id_pedido: int):
    """Asignar un pedido específico a una ruta de entrega"""
    try:
        # Verificar que la ruta existe y es de tipo entrega
        ruta = db.query(Ruta).filter(Ruta.id_ruta == id_ruta).first()
        if not ruta:
            raise HTTPException(status_code=404, detail="Ruta no encontrada")
        
        if ruta.tipo_ruta != 'entrega':
            raise HTTPException(status_code=400, detail="Solo se pueden asignar pedidos a rutas de entrega")
        
        # Verificar que el pedido existe
        pedido = db.query(Pedido).filter(Pedido.id_pedido == id_pedido).first()
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        
        # Verificar estado del pedido
        ultimo_estado = get_ultimo_estado_pedido(db, id_pedido)
        estados_validos = ['Facturado', 'Despachado', 'Enviado']
        if ultimo_estado not in estados_validos:
            raise HTTPException(
                status_code=400, 
                detail=f"El pedido no está en un estado válido para asignación. Estado actual: {ultimo_estado}"
            )
        
        # Verificar que el pedido no esté ya asignado a otra ruta
        ruta_existente = db.query(Ruta).filter(
            and_(
                Ruta.id_pedido == id_pedido,
                Ruta.id_ruta != id_ruta
            )
        ).first()
        if ruta_existente:
            raise HTTPException(
                status_code=400, 
                detail=f"El pedido ya está asignado a la ruta: {ruta_existente.nombre}"
            )
        
        # Verificar que la ruta no tenga ya un pedido asignado (a menos que sea el mismo)
        if ruta.id_pedido and ruta.id_pedido != id_pedido:
            pedido_actual = db.query(Pedido).filter(Pedido.id_pedido == ruta.id_pedido).first()
            numero_pedido_actual = pedido_actual.numero_pedido if pedido_actual else str(ruta.id_pedido)
            raise HTTPException(
                status_code=400,
                detail=f"La ruta ya tiene el pedido {numero_pedido_actual} asignado. Primero debe desasignarlo."
            )
        
        # Asignar pedido a la ruta
        ruta.id_pedido = id_pedido
        
        # Actualizar estado del pedido
        nuevo_estado = EstadoPedido(
            id_pedido=id_pedido,
            fecha_actualizada=datetime.now().date(),
            descripcion="Asignado a ruta de entrega"
        )
        db.add(nuevo_estado)
        
        db.commit()
        db.refresh(ruta)
        
        return {
            "mensaje": "Pedido asignado a ruta de entrega correctamente",
            "id_ruta": id_ruta,
            "id_pedido": id_pedido,
            "ruta": ruta.nombre,
            "pedido": pedido.numero_pedido,
            "estado_ruta": ruta.estado
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error detallado en asignación: {str(e)}")  # Para debugging
        raise HTTPException(status_code=500, detail=f"Error interno al asignar pedido: {str(e)}")
    
# NUEVA función para desasignar pedido de ruta:
def desasignar_pedido_de_ruta_entrega(db: Session, id_ruta: int):
    """Desasignar pedido de una ruta de entrega"""
    try:
        ruta = db.query(Ruta).filter(Ruta.id_ruta == id_ruta).first()
        if not ruta:
            raise HTTPException(status_code=404, detail="Ruta no encontrada")
        
        if not ruta.id_pedido:
            raise HTTPException(status_code=400, detail="La ruta no tiene pedido asignado")
        
        id_pedido = ruta.id_pedido
        ruta.id_pedido = None
        
        # Actualizar estado del pedido
        nuevo_estado = EstadoPedido(
            id_pedido=id_pedido,
            fecha_actualizada=datetime.now().date(),
            descripcion="Disponible"
        )
        db.add(nuevo_estado)
        
        db.commit()
        
        return {"mensaje": "Pedido desasignado de la ruta correctamente"}
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al desasignar pedido: {str(e)}")

def get_ubicaciones_por_sector(db: Session, sector: str):
    """Obtener ubicaciones de clientes por sector para crear rutas"""
    ubicaciones = db.query(UbicacionCliente).filter(
        UbicacionCliente.sector == sector
    ).all()
    
    return [
        {
            "id_ubicacion": ub.id_ubicacion,
            "cod_cliente": ub.cod_cliente,
            "direccion": ub.direccion,
            "sector": ub.sector,
            "latitud": float(ub.latitud),
            "longitud": float(ub.longitud),
            "referencia": ub.referencia,
            "cliente_info": {
                "nombre": ub.cliente.nombre if ub.cliente else None,
                "celular": ub.cliente.celular if ub.cliente else None
            }
        }
        for ub in ubicaciones
    ]

def get_pedidos_cliente_para_ruta(db: Session, cod_cliente: str, tipo_ruta: str = 'entrega'):
    """Obtener pedidos pendientes de un cliente para asignar a ruta de entrega"""
    from models.models import Pedido, EstadoPedido
    
    # Subquery para obtener el estado más reciente de cada pedido
    subquery = db.query(
        EstadoPedido.id_pedido,
        EstadoPedido.descripcion.label('ultimo_estado')
    ).distinct(EstadoPedido.id_pedido).order_by(
        EstadoPedido.id_pedido,
        EstadoPedido.fecha_actualizada.desc()
    ).subquery()
    
    pedidos = db.query(Pedido).join(
        subquery, Pedido.id_pedido == subquery.c.id_pedido
    ).filter(
        and_(
            Pedido.cod_cliente == cod_cliente,
            or_(
                subquery.c.ultimo_estado == 'Pendiente',
                subquery.c.ultimo_estado == 'Confirmado'
            ),
            Pedido.id_ruta_entrega.is_(None)  # Sin ruta de entrega asignada
        )
    ).all()
    
    return [
        {
            "id_pedido": p.id_pedido,
            "numero_pedido": p.numero_pedido,
            "fecha_pedido": p.fecha_pedido.strftime('%Y-%m-%d') if p.fecha_pedido else None,
            "total": float(p.total) if p.total else 0,
            "estado": get_ultimo_estado_pedido(db, p.id_pedido),
            "cod_cliente": p.cod_cliente
        }
        for p in pedidos
    ]

def get_ultimo_estado_pedido(db: Session, id_pedido: int):
    """Obtener el último estado de un pedido"""
    from models.models import EstadoPedido
    
    ultimo_estado = db.query(EstadoPedido).filter(
        EstadoPedido.id_pedido == id_pedido
    ).order_by(EstadoPedido.fecha_actualizada.desc()).first()
    
    return ultimo_estado.descripcion if ultimo_estado else 'Sin estado'

def get_estadisticas_ruta(db: Session, id_ruta: int):
    """Obtener estadísticas de una ruta"""
    try:
        ruta = db.query(Ruta).filter(Ruta.id_ruta == id_ruta).first()
        if not ruta:
            raise HTTPException(status_code=404, detail="Ruta no encontrada")
        
        estadisticas = {
            "total_asignaciones": len(ruta.asignaciones),
            "total_pedidos": 0,
            "valor_total_pedidos": 0,
            "estados_pedidos": {},
            "clientes_unicos": set()
        }
        
        if ruta.tipo_ruta == 'entrega' and ruta.id_pedido:
            # Para rutas de entrega con pedido específico
            pedido = db.query(Pedido).filter(Pedido.id_pedido == ruta.id_pedido).first()
            if pedido:
                estadisticas["total_pedidos"] = 1
                estadisticas["valor_total_pedidos"] = float(pedido.total or 0)
                estadisticas["clientes_unicos"].add(pedido.cod_cliente)
                
                estado = get_ultimo_estado_pedido(db, pedido.id_pedido)
                estadisticas["estados_pedidos"][estado] = 1
        
        estadisticas["clientes_unicos"] = len(estadisticas["clientes_unicos"])
        return estadisticas
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener estadísticas: {str(e)}")