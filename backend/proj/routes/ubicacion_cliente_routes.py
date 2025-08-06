from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_admin
from controllers import ubicacion_cliente_controller
from models.models import Usuario
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/ubicaciones_cliente")
def listar_ubicaciones(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita lista de ubicaciones de clientes")
        ubicaciones = ubicacion_cliente_controller.get_ubicaciones(db)
        logger.info(f"Se encontraron {len(ubicaciones)} ubicaciones")
        return ubicaciones
    except Exception as e:
        logger.error(f"Error al listar ubicaciones: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/ubicaciones_cliente/cliente/{cod_cliente}")
def obtener_ubicaciones_cliente(
    cod_cliente: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene todas las ubicaciones de un cliente específico
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita ubicaciones del cliente: {cod_cliente}")
        ubicaciones = ubicacion_cliente_controller.get_ubicaciones_by_cliente(db, cod_cliente)
        logger.info(f"Se encontraron {len(ubicaciones)} ubicaciones para el cliente {cod_cliente}")
        return ubicaciones
    except Exception as e:
        logger.error(f"Error al obtener ubicaciones del cliente {cod_cliente}: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/ubicaciones_cliente/{id_ubicacion}")
def obtener_ubicacion(
    id_ubicacion: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita ubicación ID: {id_ubicacion}")
        return ubicacion_cliente_controller.get_ubicacion(db, id_ubicacion)
    except Exception as e:
        logger.error(f"Error al obtener ubicación {id_ubicacion}: {e}")
        raise

@router.post("/ubicaciones_cliente")
def crear_ubicacion(
    ubicacion: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Crea una nueva ubicación y automáticamente la establece como principal
    si el cliente no tiene ubicación principal
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} crea nueva ubicación de cliente")
        
        # Validar campos requeridos
        campos_requeridos = ['cod_cliente', 'latitud', 'longitud', 'direccion', 'sector']
        for campo in campos_requeridos:
            if campo not in ubicacion or ubicacion[campo] is None:
                raise HTTPException(status_code=400, detail=f"El campo {campo} es requerido")
        
        resultado = ubicacion_cliente_controller.create_ubicacion(db, ubicacion)
        logger.info(f"Ubicación creada exitosamente con ID: {resultado.id_ubicacion}")
        return resultado
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al crear ubicación: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.put("/ubicaciones_cliente/{id_ubicacion}")
def editar_ubicacion(
    id_ubicacion: int,
    ubicacion: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        logger.info(f"Usuario {current_user.identificacion} edita ubicación ID: {id_ubicacion}")
        return ubicacion_cliente_controller.update_ubicacion(db, id_ubicacion, ubicacion)
    except Exception as e:
        logger.error(f"Error al editar ubicación {id_ubicacion}: {e}")
        raise

@router.put("/ubicaciones_cliente/cliente/{cod_cliente}/principal/{id_ubicacion}")
def establecer_ubicacion_principal(
    cod_cliente: str,
    id_ubicacion: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Establece una ubicación específica como principal para un cliente
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} establece ubicación {id_ubicacion} como principal para cliente {cod_cliente}")
        return ubicacion_cliente_controller.set_ubicacion_principal(db, cod_cliente, id_ubicacion)
    except Exception as e:
        logger.error(f"Error al establecer ubicación principal: {e}")
        raise

@router.delete("/ubicaciones_cliente/{id_ubicacion}")
def eliminar_ubicacion(
    id_ubicacion: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    try:
        logger.info(f"Usuario {current_user.identificacion} elimina ubicación ID: {id_ubicacion}")
        return ubicacion_cliente_controller.delete_ubicacion(db, id_ubicacion)
    except Exception as e:
        logger.error(f"Error al eliminar ubicación {id_ubicacion}: {e}")
        raise