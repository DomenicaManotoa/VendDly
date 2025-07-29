from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from dependencias.auth import get_db, get_current_user
from controllers.catalogo_pdf_controller import generate_catalog_pdf
from models.models import Usuario
import logging
import os
from typing import Optional

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/catalogo/export/pdf")
async def exportar_catalogo_pdf(
    # Parámetros de filtro opcionales
    search: Optional[str] = Query(None, description="Texto de búsqueda"),
    marca_id: Optional[int] = Query(None, description="ID de la marca a filtrar"),
    categoria_id: Optional[int] = Query(None, description="ID de la categoría a filtrar"),
    price_range: Optional[str] = Query("all", description="Rango de precio: all, low, medium, high"),
    # Dependencias
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Exportar catálogo de productos a PDF con filtros opcionales
    
    - **search**: Buscar en nombre, marca o categoría
    - **marca_id**: Filtrar por ID de marca específica
    - **categoria_id**: Filtrar por ID de categoría específica  
    - **price_range**: Filtrar por rango de precio (all, low, medium, high)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita exportación de catálogo PDF")
        
        # Preparar filtros
        filters = {}
        if search:
            filters['search'] = search.strip()
        if marca_id:
            filters['marca_id'] = marca_id
        if categoria_id:
            filters['categoria_id'] = categoria_id
        if price_range and price_range != 'all':
            filters['price_range'] = price_range
            
        logger.info(f"Filtros aplicados: {filters}")
        
        # Generar PDF
        pdf_file_path = generate_catalog_pdf(db, filters)
        
        if not os.path.exists(pdf_file_path):
            raise HTTPException(status_code=500, detail="Error al generar el archivo PDF")
        
        # Generar nombre del archivo con timestamp
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"catalogo_productos_{timestamp}.pdf"
        
        logger.info(f"PDF generado exitosamente: {filename}")
        
        # Retornar archivo como respuesta
        return FileResponse(
            path=pdf_file_path,
            filename=filename,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Cache-Control": "no-cache"
            }
        )
        
    except Exception as e:
        logger.error(f"Error al exportar catálogo PDF: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error al generar PDF del catálogo: {str(e)}"
        )

@router.get("/catalogo/export/pdf/preview")
async def preview_catalogo_pdf(
    # Parámetros de filtro opcionales (mismos que el endpoint principal)
    search: Optional[str] = Query(None),
    marca_id: Optional[int] = Query(None),
    categoria_id: Optional[int] = Query(None),
    price_range: Optional[str] = Query("all"),
    # Dependencias
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Vista previa del PDF del catálogo (abre en el navegador)
    """
    try:
        logger.info(f"Usuario {current_user.identificacion} solicita vista previa de catálogo PDF")
        
        # Preparar filtros (mismo código que el endpoint principal)
        filters = {}
        if search:
            filters['search'] = search.strip()
        if marca_id:
            filters['marca_id'] = marca_id
        if categoria_id:
            filters['categoria_id'] = categoria_id
        if price_range and price_range != 'all':
            filters['price_range'] = price_range
        
        # Generar PDF
        pdf_file_path = generate_catalog_pdf(db, filters)
        
        if not os.path.exists(pdf_file_path):
            raise HTTPException(status_code=500, detail="Error al generar el archivo PDF")
        
        # Retornar archivo para vista previa (inline)
        return FileResponse(
            path=pdf_file_path,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "inline",
                "Cache-Control": "no-cache"
            }
        )
        
    except Exception as e:
        logger.error(f"Error al generar vista previa PDF: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error al generar vista previa PDF: {str(e)}"
        )

@router.get("/catalogo/export/info")
async def obtener_info_exportacion(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtener información sobre la exportación disponible
    """
    try:
        from controllers.producto_controller import get_productos
        
        productos = get_productos(db)
        productos_activos = [p for p in productos if p.estado == 'activo']
        
        # Estadísticas por marca
        marcas_stats = {}
        for producto in productos_activos:
            if producto.marca:
                marca = producto.marca.descripcion
                marcas_stats[marca] = marcas_stats.get(marca, 0) + 1
        
        # Estadísticas por categoría
        categorias_stats = {}
        for producto in productos_activos:
            if producto.categoria:
                categoria = producto.categoria.descripcion
                categorias_stats[categoria] = categorias_stats.get(categoria, 0) + 1
        
        return {
            "total_productos": len(productos),
            "productos_activos": len(productos_activos),
            "productos_inactivos": len(productos) - len(productos_activos),
            "estadisticas_marcas": marcas_stats,
            "estadisticas_categorias": categorias_stats,
            "formatos_disponibles": ["PDF"],
            "filtros_disponibles": {
                "search": "Búsqueda por texto",
                "marca_id": "Filtro por marca",
                "categoria_id": "Filtro por categoría",
                "price_range": "Rango de precio (all, low, medium, high)"
            }
        }
        
    except Exception as e:
        logger.error(f"Error al obtener información de exportación: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error al obtener información de exportación"
        )