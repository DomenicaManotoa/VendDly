from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_role, require_admin
from controllers import clientes_controller
from models.models import Usuario
import logging
from fastapi.responses import StreamingResponse
import io
from datetime import datetime


# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# IMPORTANTE: La ruta de exportar debe ir ANTES que la ruta con parámetro dinámico
@router.get("/clientes/exportar-excel")
def exportar_clientes_excel(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Exporta los clientes a un archivo Excel (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita exportar clientes a Excel")
        
        # Generar archivo Excel
        excel_data = clientes_controller.export_clientes_to_excel(db)
        
        # Crear nombre del archivo con fecha
        fecha_actual = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"clientes_{fecha_actual}.xlsx"
        
        logger.info(f"Archivo Excel generado exitosamente: {filename}")
        
        # Crear el BytesIO stream
        excel_stream = io.BytesIO(excel_data)
        excel_stream.seek(0)
        
        return StreamingResponse(
            excel_stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Error al exportar clientes a Excel: {e}")
        raise HTTPException(status_code=500, detail=f"Error al generar archivo Excel: {str(e)}")

@router.get("/clientes/con-ubicaciones")
def listar_clientes_con_ubicaciones(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Lista todos los clientes con información detallada de sus ubicaciones (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita lista de clientes con ubicaciones")
        clientes = clientes_controller.get_clientes_con_ubicaciones(db)
        logger.info(f"Se encontraron {len(clientes)} clientes con información de ubicaciones")
        return clientes
    except Exception as e:
        logger.error(f"Error al listar clientes con ubicaciones: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/clientes")
def listar_clientes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Lista todos los clientes (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita lista de clientes")
        clientes = clientes_controller.get_clientes(db)
        logger.info(f"Se encontraron {len(clientes)} clientes")
        return clientes
    except Exception as e:
        logger.error(f"Error al listar clientes: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/clientes/{cod_cliente}")
def obtener_cliente(
    cod_cliente: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene un cliente específico con información de ubicaciones (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita cliente ID: {cod_cliente}")
        return clientes_controller.get_cliente(db, cod_cliente)
    except Exception as e:
        logger.error(f"Error al obtener cliente {cod_cliente}: {e}")
        raise

@router.post("/clientes")
def crear_cliente(
    cliente: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Crea un nuevo cliente (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} crea nuevo cliente")
        
        # Validar datos requeridos
        campos_requeridos = ['cod_cliente', 'identificacion', 'nombre', 'direccion', 'celular', 'correo', 'tipo_cliente', 'sector']
        for campo in campos_requeridos:
            if not cliente.get(campo):
                raise HTTPException(status_code=400, detail=f"El campo {campo} es requerido")
        
        return clientes_controller.create_cliente(db, cliente)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al crear cliente: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.put("/clientes/{cod_cliente}")
def editar_cliente(
    cod_cliente: str,
    cliente: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Edita un cliente (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} edita cliente ID: {cod_cliente}")
        
        # Validar que no se intente cambiar el código del cliente
        if 'cod_cliente' in cliente and cliente['cod_cliente'] != cod_cliente:
            raise HTTPException(status_code=400, detail="No se puede modificar el código del cliente")
        
        return clientes_controller.update_cliente(db, cod_cliente, cliente)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al editar cliente {cod_cliente}: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.delete("/clientes/{cod_cliente}")
def eliminar_cliente(
    cod_cliente: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Elimina un cliente (requiere rol admin)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} elimina cliente ID: {cod_cliente}")
        return clientes_controller.delete_cliente(db, cod_cliente)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al eliminar cliente {cod_cliente}: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")