from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user, require_admin
from controllers import producto_controller
from models.models import Usuario
import logging
from typing import Optional
import os
import uuid
from datetime import datetime
from fastapi.responses import StreamingResponse
import io

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/productos/exportar-excel")
def exportar_productos_excel(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Exporta los productos a un archivo Excel (requiere autenticación)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita exportar productos a Excel")
        
        # Generar archivo Excel
        excel_data = producto_controller.export_productos_to_excel(db)
        
        # Crear nombre del archivo con fecha
        fecha_actual = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"inventario_{fecha_actual}.xlsx"
        
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
        logger.error(f"Error al exportar productos a Excel: {e}")
        raise HTTPException(status_code=500, detail=f"Error al generar archivo Excel: {str(e)}")

@router.get("/productos")
def listar_productos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita lista de productos")
        productos = producto_controller.get_productos(db)
        logger.info(f"Se encontraron {len(productos)} productos")
        return productos
    except Exception as e:
        logger.error(f"Error al listar productos: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/productos/{id_producto}")
def obtener_producto(
    id_producto: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita producto ID: {id_producto}")
        return producto_controller.get_producto(db, id_producto)
    except Exception as e:
        logger.error(f"Error al obtener producto {id_producto}: {e}")
        raise

@router.post("/productos")
async def crear_producto(
    nombre: str = Form(...),
    id_marca: int = Form(...),
    stock: str = Form(...),
    precio_mayorista: float = Form(...),
    precio_minorista: float = Form(...),
    id_categoria: int = Form(...),
    iva: float = Form(0.12),
    estado: str = Form("activo"),
    imagen: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        producto_data = {
            "nombre": nombre,
            "id_marca": id_marca,
            "stock": stock,
            "precio_mayorista": precio_mayorista,
            "precio_minorista": precio_minorista,
            "id_categoria": id_categoria,
            "iva": iva,
            "estado": estado
        }
        
        if imagen and imagen.filename:
            # Validar tipo de archivo
            allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
            file_extension = os.path.splitext(imagen.filename)[1].lower()
            
            if file_extension not in allowed_extensions:
                raise HTTPException(status_code=400, detail="Tipo de archivo no permitido")
            
            # Crear nombre único para el archivo
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            
            upload_dir = "uploads/productos"
            os.makedirs(upload_dir, exist_ok=True)
            file_location = f"{upload_dir}/{unique_filename}"
            
            # Guardar archivo
            with open(file_location, "wb+") as file_object:
                content = await imagen.read()
                file_object.write(content)
            
            # Guardar solo la ruta relativa en la base de datos
            producto_data["imagen"] = f"/uploads/productos/{unique_filename}"
        
        producto = producto_controller.create_producto(db, producto_data)
        logger.info(f"Producto creado: {producto.nombre}")
        return producto
        
    except Exception as e:
        logger.error(f"Error al crear producto: {e}")
        raise HTTPException(status_code=422, detail=str(e))

@router.put("/productos/{id_producto}")
async def editar_producto(
    id_producto: int,
    nombre: Optional[str] = Form(None),
    id_marca: Optional[int] = Form(None),
    stock: Optional[str] = Form(None),
    precio_mayorista: Optional[float] = Form(None),
    precio_minorista: Optional[float] = Form(None),
    id_categoria: Optional[int] = Form(None),
    iva: Optional[float] = Form(None),
    estado: Optional[str] = Form(None),
    imagen: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        logger.info(f"Usuario {current_user.identificacion} edita producto ID: {id_producto}")
        
        # Obtener producto actual para manejar la imagen existente
        producto_actual = producto_controller.get_producto(db, id_producto)
        
        producto_data = {}
        if nombre is not None:
            producto_data["nombre"] = nombre
        if id_marca is not None:
            producto_data["id_marca"] = id_marca
        if stock is not None:
            producto_data["stock"] = stock
        if precio_mayorista is not None:
            producto_data["precio_mayorista"] = precio_mayorista
        if precio_minorista is not None:
            producto_data["precio_minorista"] = precio_minorista
        if id_categoria is not None:
            producto_data["id_categoria"] = id_categoria
        if iva is not None:
            producto_data["iva"] = iva
        if estado is not None:
            producto_data["estado"] = estado
        
        # Procesar nueva imagen si se proporciona
        if imagen and imagen.filename:
            # Validar tipo de archivo
            allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
            file_extension = os.path.splitext(imagen.filename)[1].lower()
            
            if file_extension not in allowed_extensions:
                raise HTTPException(status_code=400, detail="Tipo de archivo no permitido")
            
            # Eliminar imagen anterior si existe
            if producto_actual.imagen:
                try:
                    old_image_path = producto_actual.imagen
                    if old_image_path.startswith('/uploads/'):
                        old_image_path = old_image_path[1:]  # Remover el primer '/'
                    
                    if os.path.exists(old_image_path):
                        os.remove(old_image_path)
                except Exception as e:
                    logger.warning(f"No se pudo eliminar imagen anterior: {e}")
            
            # Crear nombre único para el nuevo archivo
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            
            upload_dir = "uploads/productos"
            os.makedirs(upload_dir, exist_ok=True)
            file_location = f"{upload_dir}/{unique_filename}"
            
            # Guardar nuevo archivo
            with open(file_location, "wb+") as file_object:
                content = await imagen.read()
                file_object.write(content)
            
            producto_data["imagen"] = f"/uploads/productos/{unique_filename}"
        
        producto = producto_controller.update_producto(db, id_producto, producto_data)
        logger.info(f"Producto actualizado: {producto.nombre}")
        return producto
        
    except Exception as e:
        logger.error(f"Error al editar producto {id_producto}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/productos/{id_producto}")
def eliminar_producto(
    id_producto: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin())
):
    try:
        logger.info(f"Usuario {current_user.identificacion} elimina producto ID: {id_producto}")
        return producto_controller.delete_producto(db, id_producto)
    except Exception as e:
        logger.error(f"Error al eliminar producto {id_producto}: {e}")
        raise