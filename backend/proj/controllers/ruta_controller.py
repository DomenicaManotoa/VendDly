from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import Ruta, AsignacionRuta, UbicacionCliente, Usuario, Rol
from sqlalchemy import and_, func, or_
from datetime import datetime

# Reemplazar la función validate_user_role existente
def validate_user_role(db: Session, user_id: str, required_role: str):
    """Valida que el usuario tenga el rol requerido (por descripción exacta)"""
    user = db.query(Usuario).filter(Usuario.identificacion == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    role = db.query(Rol).filter(Rol.id_rol == user.id_rol).first()
    if not role:
        raise HTTPException(status_code=404, detail="Rol del usuario no encontrado")
    
    # Comparación exacta de roles (case-insensitive)
    if role.descripcion.lower().strip() != required_role.lower().strip():
        raise HTTPException(
            status_code=400, 
            detail=f"El usuario debe tener rol de {required_role}. Rol actual: {role.descripcion}"
        )
    return True

# Agregar nueva función para validar asignaciones
def validate_assignment_constraints(db: Session, ruta_data: dict, asignaciones_data: list):
    """Validar restricciones específicas de asignación según tipo de ruta"""
    tipo_ruta = ruta_data['tipo_ruta']
    
    for asignacion_data in asignaciones_data:
        usuario_id = asignacion_data.get('identificacion_usuario')
        if not usuario_id:
            continue
            
        # Validar rol según tipo de ruta
        if tipo_ruta == 'venta':
            required_role = 'vendedor'
        elif tipo_ruta == 'entrega':
            required_role = 'transportista'
        else:
            raise HTTPException(status_code=400, detail="Tipo de ruta inválido")
        
        validate_user_role(db, usuario_id, required_role)
        
        # Verificar que el usuario no tenga otra ruta activa del mismo tipo
        rutas_activas = db.query(Ruta).join(AsignacionRuta).filter(
            and_(
                AsignacionRuta.identificacion_usuario == usuario_id,
                Ruta.estado.in_(['Planificada', 'En ejecución']),
                Ruta.tipo_ruta == tipo_ruta
            )
        ).count()
        
        if rutas_activas > 0:
            raise HTTPException(
                status_code=400,
                detail=f"El usuario {usuario_id} ya tiene una ruta {tipo_ruta} activa"
            )

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
            "asignaciones": []
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
                } if asignacion.usuario else None,
                "pedidos": []  # Nuevo campo para pedidos
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
            
            # Si es ruta de entrega y hay cliente, obtener pedidos con sus estados
            if ruta.tipo_ruta == 'entrega' and asignacion.cod_cliente:
                from models.models import Pedido
                pedidos_cliente = db.query(Pedido).filter(
                    Pedido.cod_cliente == asignacion.cod_cliente,
                    Pedido.id_ruta_entrega == ruta.id_ruta
                ).all()
                
                pedidos_info = []
                for pedido in pedidos_cliente:
                    pedidos_info.append({
                        "id_pedido": pedido.id_pedido,
                        "numero_pedido": pedido.numero_pedido,
                        "fecha_pedido": pedido.fecha_pedido.strftime('%Y-%m-%d') if pedido.fecha_pedido else None,
                        "total": float(pedido.total) if pedido.total else 0,
                        "estado": get_ultimo_estado_pedido(db, pedido.id_pedido),
                        "cod_cliente": pedido.cod_cliente
                    })
                
                asignacion_dict["pedidos"] = pedidos_info
            
            ruta_dict["asignaciones"].append(asignacion_dict)
        
        resultado.append(ruta_dict)
    
    return resultado

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

def asignar_pedidos_a_ruta_entrega(db: Session, id_ruta: int, pedidos_ids: list):
    """Asignar pedidos a una ruta de entrega"""
    from models.models import Pedido, EstadoPedido
    from datetime import date
    
    try:
        # Actualizar los pedidos con la ruta de entrega
        db.query(Pedido).filter(
            Pedido.id_pedido.in_(pedidos_ids)
        ).update({
            Pedido.id_ruta_entrega: id_ruta
        }, synchronize_session=False)
        
        # Crear estados "En ruta" para cada pedido
        for pedido_id in pedidos_ids:
            nuevo_estado = EstadoPedido(
                id_pedido=pedido_id,
                fecha_actualizada=date.today(),
                descripcion="En ruta"
            )
            db.add(nuevo_estado)
        
        db.commit()
        return {"mensaje": f"{len(pedidos_ids)} pedidos asignados a la ruta"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al asignar pedidos: {str(e)}")