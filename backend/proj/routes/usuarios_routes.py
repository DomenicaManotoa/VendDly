from fastapi import APIRouter, Depends, Body, HTTPException
from fastapi.responses import StreamingResponse  # ← Nueva importación
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_role, require_admin
from controllers import usuarios_controller
from models.models import Usuario, Rol
import logging
import io  # ← Nueva importación
from datetime import datetime  # ← Nueva importación

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/usuarios")
def listar_usuarios(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Lista todos los usuarios (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita lista de usuarios")
        usuarios = usuarios_controller.get_usuarios(db)
        logger.info(f"Se encontraron {len(usuarios)} usuarios")
        return usuarios
    except Exception as e:
        logger.error(f"Error al listar usuarios: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# ← Mover la ruta de exportar Excel ANTES de la ruta con parámetro dinámico
@router.get("/usuarios/exportar-excel")
def exportar_usuarios_excel(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Exporta los usuarios a un archivo Excel (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita exportar usuarios a Excel")
        
        # Generar archivo Excel
        excel_data = usuarios_controller.export_usuarios_to_excel(db)
        
        # Crear nombre del archivo con fecha
        fecha_actual = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"usuarios_{fecha_actual}.xlsx"
        
        # Crear el stream de respuesta
        excel_stream = io.BytesIO(excel_data)
        
        logger.info(f"Archivo Excel generado exitosamente: {filename}")
        
        return StreamingResponse(
            io.BytesIO(excel_data),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Error al exportar usuarios a Excel: {e}")
        raise HTTPException(status_code=500, detail="Error al generar archivo Excel")

@router.get("/usuarios/{identificacion}")
def obtener_usuario(
    identificacion: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene un usuario específico (requiere autenticación)
    """
    try:
        logger.info(f"Buscando usuario con identificación: {identificacion}")
        return usuarios_controller.get_usuario(db, identificacion)
    except Exception as e:
        logger.error(f"Error al obtener usuario {identificacion}: {e}")
        raise

@router.post("/usuarios")
def crear_usuario(
    usuario: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Crea un nuevo usuario (requiere rol admin)
    """
    try:
        logger.info(f"Creando nuevo usuario: {usuario.get('identificacion')}")
        return usuarios_controller.create_usuario(db, usuario)
    except Exception as e:
        logger.error(f"Error al crear usuario: {e}")
        raise

@router.put("/usuarios/{identificacion}")
def editar_usuario(
    identificacion: str,
    usuario: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Edita un usuario (requiere autenticación)
    """
    try:
        logger.info(f"Editando usuario: {identificacion}")
        return usuarios_controller.update_usuario(db, identificacion, usuario)
    except Exception as e:
        logger.error(f"Error al editar usuario {identificacion}: {e}")
        raise

@router.delete("/usuarios/{identificacion}")
def eliminar_usuario(
    identificacion: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    """
    Elimina un usuario (requiere rol admin)
    """
    try:
        logger.info(f"Eliminando usuario: {identificacion}")
        return usuarios_controller.delete_usuario(db, identificacion)
    except Exception as e:
        logger.error(f"Error al eliminar usuario {identificacion}: {e}")
        raise

@router.get("/usuarios/rol/{rol}")
def obtener_usuarios_por_rol(
    rol: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener usuarios por rol específico"""
    try:
        # Buscar el rol por descripción (case insensitive)
        rol_obj = db.query(Rol).filter(Rol.descripcion.ilike(f"{rol}")).first()
        if not rol_obj:
            raise HTTPException(status_code=404, detail=f"Rol '{rol}' no encontrado")
        
        # Obtener usuarios con ese rol y estado activo
        usuarios = db.query(Usuario).filter(
            Usuario.id_rol == rol_obj.id_rol,
            Usuario.estado == 'activo'
        ).all()
        
        # Formatear respuesta
        resultado = []
        for usuario in usuarios:
            usuario_dict = {
                "identificacion": usuario.identificacion,
                "nombre": usuario.nombre,
                "correo": usuario.correo,
                "celular": usuario.celular,
                "estado": usuario.estado,
                "id_rol": usuario.id_rol,
                "rol": {
                    "id_rol": rol_obj.id_rol,
                    "descripcion": rol_obj.descripcion
                }
            }
            resultado.append(usuario_dict)
        
        return resultado
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno del servidor")