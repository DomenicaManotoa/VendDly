from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_admin
from controllers import ruta_controller
from models.models import Usuario, AsignacionRuta, Ruta, Rol
from sqlalchemy import and_
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