from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_admin
from controllers import ruta_controller
from models.models import Usuario, AsignacionRuta, Ruta, Rol, Pedido
from sqlalchemy import and_, or_
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/rutas")
def listar_rutas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita lista de rutas")
        rutas = ruta_controller.get_rutas_con_asignaciones(db)
        logger.info(f"Se encontraron {len(rutas)} rutas")
        return rutas
    except Exception as e:
        logger.error(f"Error al listar rutas: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/rutas/{id_ruta}")
def obtener_ruta(
    id_ruta: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita ruta ID: {id_ruta}")
        return ruta_controller.get_ruta(db, id_ruta)
    except Exception as e:
        logger.error(f"Error al obtener ruta {id_ruta}: {e}")
        raise

@router.post("/rutas")
def crear_ruta(
    ruta: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    try:
        logger.info(f"Usuario {current_user.identificacion} crea nueva ruta")
        return ruta_controller.create_ruta(db, ruta)
    except Exception as e:
        logger.error(f"Error al crear ruta: {e}")
        raise

@router.put("/rutas/{id_ruta}")
def editar_ruta(
    id_ruta: int,
    ruta: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    try:
        logger.info(f"Usuario {current_user.identificacion} edita ruta ID: {id_ruta}")
        return ruta_controller.update_ruta(db, id_ruta, ruta)
    except Exception as e:
        logger.error(f"Error al editar ruta {id_ruta}: {e}")
        raise

@router.delete("/rutas/{id_ruta}")
def eliminar_ruta(
    id_ruta: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    try:
        logger.info(f"Usuario {current_user.identificacion} elimina ruta ID: {id_ruta}")
        return ruta_controller.delete_ruta(db, id_ruta)
    except Exception as e:
        logger.error(f"Error al eliminar ruta {id_ruta}: {e}")
        raise

@router.get("/rutas/ubicaciones/sector/{sector}")
def obtener_ubicaciones_por_sector(
    sector: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Endpoint para obtener ubicaciones de clientes por sector para crear rutas"""
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita ubicaciones del sector: {sector}")
        ubicaciones = ruta_controller.get_ubicaciones_por_sector(db, sector)
        return ubicaciones
    except Exception as e:
        logger.error(f"Error al obtener ubicaciones del sector {sector}: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")
    
@router.get("/rutas/usuario/{user_id}")
def obtener_rutas_usuario(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtener rutas asignadas a un usuario específico
    Los usuarios solo pueden ver sus propias rutas, admin puede ver todas
    """
    try:
        # Verificar permisos (mantener este bloque igual)
        if current_user.identificacion != user_id:
            user_role = db.query(Rol).filter(Rol.id_rol == current_user.id_rol).first()
            if not user_role or user_role.descripcion.lower() != 'Admin':
                raise HTTPException(
                    status_code=403,
                    detail="No tienes permisos para ver las rutas de este usuario"
                )

        logger.info(f"Usuario {current_user.identificacion} solicita rutas de {user_id}")
        return ruta_controller.get_rutas_usuario(db, user_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener rutas del usuario {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/rutas/{id_ruta}/asignaciones")
def obtener_asignaciones_ruta(
    id_ruta: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtener asignaciones detalladas de una ruta específica
    """
    try:
        ruta = db.query(Ruta).filter(Ruta.id_ruta == id_ruta).first()
        if not ruta:
            raise HTTPException(status_code=404, detail="Ruta no encontrada")

        # Verificar si el usuario tiene acceso a esta ruta
        es_admin = False
        user_role = db.query(Rol).filter(Rol.id_rol == current_user.id_rol).first()
        if user_role and user_role.descripcion.lower() == 'Admin':
            es_admin = True
        
        if not es_admin:
            # Verificar si el usuario está asignado a esta ruta
            asignacion_usuario = db.query(AsignacionRuta).filter(
                and_(
                    AsignacionRuta.id_ruta == id_ruta,
                    AsignacionRuta.identificacion_usuario == current_user.identificacion
                )
            ).first()
            
            if not asignacion_usuario:
                raise HTTPException(
                    status_code=403,
                    detail="No tienes acceso a esta ruta"
                )

        logger.info(f"Usuario {current_user.identificacion} solicita asignaciones de ruta {id_ruta}")
        
        asignaciones = db.query(AsignacionRuta).filter(
            AsignacionRuta.id_ruta == id_ruta
        ).order_by(AsignacionRuta.orden_visita).all()
        
        resultado = []
        for asignacion in asignaciones:
            asignacion_dict = {
                "id_asignacion": asignacion.id_asignacion,
                "identificacion_usuario": asignacion.identificacion_usuario,
                "tipo_usuario": asignacion.tipo_usuario,
                "cod_cliente": asignacion.cod_cliente,
                "id_ubicacion": asignacion.id_ubicacion,
                "orden_visita": asignacion.orden_visita,
                "usuario_info": None,
                "ubicacion_info": None
            }
            
            if asignacion.usuario:
                asignacion_dict["usuario_info"] = {
                    "nombre": asignacion.usuario.nombre,
                    "correo": asignacion.usuario.correo
                }
            
            if asignacion.ubicacion:
                asignacion_dict["ubicacion_info"] = {
                    "direccion": asignacion.ubicacion.direccion,
                    "sector": asignacion.ubicacion.sector,
                    "latitud": float(asignacion.ubicacion.latitud),
                    "longitud": float(asignacion.ubicacion.longitud),
                    "referencia": asignacion.ubicacion.referencia
                }
            
            resultado.append(asignacion_dict)
        
        return resultado
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener asignaciones de ruta {id_ruta}: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.put("/rutas/{id_ruta}/estado")
def actualizar_estado_ruta(
    id_ruta: int,
    estado_data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Actualizar estado de una ruta
    Solo usuarios asignados o admin pueden cambiar el estado
    """
    try:
        ruta = db.query(Ruta).filter(Ruta.id_ruta == id_ruta).first()
        if not ruta:
            raise HTTPException(status_code=404, detail="Ruta no encontrada")

        nuevo_estado = estado_data.get('estado')
        estados_validos = ['Planificada', 'En ejecución', 'Completada', 'Cancelada']
        
        if nuevo_estado not in estados_validos:
            raise HTTPException(
                status_code=400,
                detail=f"Estado inválido. Estados válidos: {', '.join(estados_validos)}"
            )

        # Verificar permisos
        es_admin = False
        user_role = db.query(Rol).filter(Rol.id_rol == current_user.id_rol).first()
        if user_role and user_role.descripcion.lower() == 'Admin':
            es_admin = True
        
        if not es_admin:
            # Verificar si el usuario está asignado a esta ruta
            asignacion_usuario = db.query(AsignacionRuta).filter(
                and_(
                    AsignacionRuta.id_ruta == id_ruta,
                    AsignacionRuta.identificacion_usuario == current_user.identificacion
                )
            ).first()
            
            if not asignacion_usuario:
                raise HTTPException(
                    status_code=403,
                    detail="No tienes permisos para modificar esta ruta"
                )

        ruta.estado = nuevo_estado
        db.commit()
        db.refresh(ruta)
        
        logger.info(f"Usuario {current_user.identificacion} cambió estado de ruta {id_ruta} a {nuevo_estado}")
        
        return {"mensaje": f"Estado de ruta actualizado a {nuevo_estado}", "ruta": ruta}
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error al actualizar estado de ruta {id_ruta}: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# NUEVO endpoint para asignar pedido a ruta:
@router.post("/rutas/{id_ruta}/asignar-pedido")
def asignar_pedido_ruta(
    id_ruta: int,
    pedido_data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """Asignar un pedido específico a una ruta de entrega"""
    try:
        id_pedido = pedido_data.get('id_pedido')
        
        logger.info(f"=== INICIO ASIGNACIÓN ===")
        logger.info(f"Usuario: {current_user.identificacion}")
        logger.info(f"Ruta ID: {id_ruta}")
        logger.info(f"Pedido ID: {id_pedido}")
        logger.info(f"Datos recibidos: {pedido_data}")
        
        if not id_pedido:
            logger.error("ID de pedido no proporcionado")
            raise HTTPException(status_code=400, detail="Debe proporcionar el ID del pedido")
        
        # Validar que id_pedido sea un entero válido
        try:
            id_pedido = int(id_pedido)
        except (ValueError, TypeError):
            logger.error(f"ID de pedido inválido: {id_pedido}")
            raise HTTPException(status_code=400, detail="El ID del pedido debe ser un número entero válido")
        
        logger.info(f"Llamando a controlador con ruta {id_ruta} y pedido {id_pedido}")
        resultado = ruta_controller.asignar_pedido_a_ruta_entrega(db, id_ruta, id_pedido)
        logger.info(f"Resultado del controlador: {resultado}")
        
        return resultado
        
    except HTTPException as he:
        logger.error(f"HTTPException en asignación: {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"Error inesperado al asignar pedido a ruta {id_ruta}: {str(e)}")
        logger.error(f"Tipo de error: {type(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")
    
# NUEVO endpoint para desasignar pedido:
@router.delete("/rutas/{id_ruta}/desasignar-pedido")
def desasignar_pedido_ruta(
    id_ruta: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """Desasignar pedido de una ruta de entrega"""
    try:
        return ruta_controller.desasignar_pedido_de_ruta_entrega(db, id_ruta)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al desasignar pedido de ruta {id_ruta}: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/pedidos/disponibles-para-ruta")
def obtener_pedidos_disponibles(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener pedidos disponibles para asignar a rutas de entrega"""
    try:
        # Obtener pedidos que no están asignados a ninguna ruta
        pedidos = db.query(Pedido).outerjoin(Ruta, Ruta.id_pedido == Pedido.id_pedido).filter(
            Ruta.id_pedido.is_(None)
        ).all()
        
        resultado = []
        for pedido in pedidos:
            ultimo_estado = ruta_controller.get_ultimo_estado_pedido(db, pedido.id_pedido)
            
            # Solo incluir pedidos con estados válidos
            if ultimo_estado in ['Pendiente', 'Confirmado']:
                pedido_info = {
                    "id_pedido": pedido.id_pedido,
                    "numero_pedido": pedido.numero_pedido,
                    "fecha_pedido": pedido.fecha_pedido.strftime('%Y-%m-%d') if pedido.fecha_pedido else None,
                    "cod_cliente": pedido.cod_cliente,
                    "total": float(pedido.total) if pedido.total else 0,
                    "subtotal": float(pedido.subtotal) if pedido.subtotal else 0,
                    "iva": float(pedido.iva) if pedido.iva else 0,
                    "estado": ultimo_estado,
                    "cliente_info": {
                        "nombre": pedido.cliente.nombre if pedido.cliente else None,
                        "direccion": pedido.cliente.direccion if pedido.cliente else None,
                        "sector": pedido.cliente.sector if pedido.cliente else None
                    }
                }
                resultado.append(pedido_info)
        
        return resultado
        
    except Exception as e:
        logger.error(f"Error al obtener pedidos disponibles: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/rutas/{id_ruta}/estadisticas")
def obtener_estadisticas_ruta(
    id_ruta: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener estadísticas de una ruta específica"""
    try:
        return ruta_controller.get_estadisticas_ruta(db, id_ruta)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener estadísticas de ruta {id_ruta}: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")
    
@router.get("/rutas/{id_ruta}/pedido")
def obtener_pedido_ruta(
    id_ruta: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener el pedido asignado a una ruta de entrega"""
    try:
        ruta = db.query(Ruta).filter(Ruta.id_ruta == id_ruta).first()
        if not ruta:
            raise HTTPException(status_code=404, detail="Ruta no encontrada")
        
        if not ruta.id_pedido:
            return {"mensaje": "No hay pedido asignado a esta ruta"}
        
        pedido = db.query(Pedido).filter(Pedido.id_pedido == ruta.id_pedido).first()
        if not pedido:
            return {"mensaje": "Pedido no encontrado"}
        
        ultimo_estado = ruta_controller.get_ultimo_estado_pedido(db, pedido.id_pedido)
        
        pedido_info = {
            "id_pedido": pedido.id_pedido,
            "numero_pedido": pedido.numero_pedido,
            "fecha_pedido": pedido.fecha_pedido.strftime('%Y-%m-%d') if pedido.fecha_pedido else None,
            "cod_cliente": pedido.cod_cliente,
            "total": float(pedido.total) if pedido.total else 0,
            "subtotal": float(pedido.subtotal) if pedido.subtotal else 0,
            "iva": float(pedido.iva) if pedido.iva else 0,
            "estado": ultimo_estado,
            "cliente_info": {
                "nombre": pedido.cliente.nombre if pedido.cliente else None,
                "direccion": pedido.cliente.direccion if pedido.cliente else None,
                "sector": pedido.cliente.sector if pedido.cliente else None
            }
        }
        
        return pedido_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener pedido de ruta {id_ruta}: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")