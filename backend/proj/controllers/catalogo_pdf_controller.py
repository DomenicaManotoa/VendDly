from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, 
    Image as ReportLabImage, PageBreak, KeepTogether, Frame, PageTemplate
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus.doctemplate import BaseDocTemplate
from sqlalchemy.orm import Session
from controllers.producto_controller import get_productos
from datetime import datetime
import os
import tempfile
import requests
from io import BytesIO
from PIL import Image as PILImage
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModernCatalogoPDF:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_colors()          # <-- Primero colores
        self.setup_custom_styles()   # <-- Luego estilos

    def generate_catalog_pdf(self, db: Session, filters: dict = None):
        """Generar PDF del catálogo con diseño promocional"""
        try:
            # Lógica para crear el PDF
            elements = self.create_product_grid_promotional(db, filters)
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
            doc = SimpleDocTemplate(temp_file.name, pagesize=A4)
            doc.build(
                elements,
                onFirstPage=self.create_promotional_header,
                onLaterPages=self.create_promotional_footer
            )
            self.cleanup_temp_files()  # Limpia archivos temporales .jpg
            return temp_file.name
        except Exception as e:
            logger.error(f"Error al generar PDF: {e}")
            raise Exception(f"Error al generar PDF: {str(e)}")
        
    def setup_colors(self):
        """Definir paleta de colores vibrante inspirada en el diseño de referencia"""
        self.colors = {
            'primary_red': colors.HexColor('#E30613'),       # Rojo principal vibrante
            'secondary_red': colors.HexColor('#C41E3A'),     # Rojo más oscuro
            'accent_green': colors.HexColor('#ABD904'),      # Verde de acento
            'white': colors.white,
            'black': colors.black,
            'dark_gray': colors.HexColor('#2C2C2C'),         # Gris oscuro para texto
            'light_gray': colors.HexColor('#F5F5F5'),        # Fondo suave
            'yellow_accent': colors.HexColor('#FFD700'),     # Amarillo para destacar
            'price_orange': colors.HexColor('#FF6B35'),      # Naranja para precios
            'success_green': colors.HexColor('#28A745'),     # Verde para stock alto
            'warning_yellow': colors.HexColor('#FFC107'),    # Amarillo para stock medio
            'danger_red': colors.HexColor('#DC3545')         # Rojo para stock bajo
        }
        
    def setup_custom_styles(self):
        """Configurar estilos personalizados modernos y vibrantes"""
        # Título principal - estilo promocional
        self.title_style = ParagraphStyle(
            'PromoTitle',
            parent=self.styles['Heading1'],
            fontSize=32,
            spaceAfter=20,
            spaceBefore=10,
            alignment=TA_CENTER,
            textColor=self.colors['white'],
            fontName='Helvetica-Bold',
            leading=36
        )
        
        # Subtítulo promocional
        self.promo_subtitle = ParagraphStyle(
            'PromoSubtitle',
            parent=self.styles['Heading2'],
            fontSize=18,
            spaceAfter=15,
            spaceBefore=5,
            alignment=TA_CENTER,
            textColor=self.colors['white'],
            fontName='Helvetica-Bold',
            leading=22
        )
        
        # Información de la empresa - moderna
        self.company_style = ParagraphStyle(
            'CompanyInfo',
            parent=self.styles['Normal'],
            fontSize=10,
            alignment=TA_CENTER,
            textColor=self.colors['white'],
            spaceAfter=15,
            leading=12
        )
        
        # Estilo para nombres de productos
        self.product_name_style = ParagraphStyle(
            'ProductName',
            parent=self.styles['Normal'],
            fontSize=11,
            alignment=TA_LEFT,
            textColor=self.colors['dark_gray'],
            fontName='Helvetica-Bold',
            leading=13
        )
        
        # Estilo para precios destacados
        self.price_highlight_style = ParagraphStyle(
            'PriceHighlight',
            parent=self.styles['Normal'],
            fontSize=14,
            alignment=TA_CENTER,
            textColor=self.colors['white'],
            fontName='Helvetica-Bold',
            leading=16
        )
        
        # Estilo para precios normales
        self.price_normal_style = ParagraphStyle(
            'PriceNormal',
            parent=self.styles['Normal'],
            fontSize=10,
            alignment=TA_CENTER,
            textColor=self.colors['dark_gray'],
            leading=12
        )
        
        # Estilo para información de productos
        self.product_info_style = ParagraphStyle(
            'ProductInfo',
            parent=self.styles['Normal'],
            fontSize=9,
            alignment=TA_LEFT,
            textColor=self.colors['dark_gray'],
            leading=11
        )

    def create_promotional_header(self, canvas, doc):
        """Crear encabezado promocional vibrante"""
        canvas.saveState()
        
        # Fondo rojo vibrante con gradiente visual
        canvas.setFillColor(self.colors['primary_red'])
        canvas.rect(0, doc.height + doc.topMargin - 100, doc.width + doc.leftMargin + doc.rightMargin, 100, fill=1)
        
        # Banda superior más oscura
        canvas.setFillColor(self.colors['secondary_red'])
        canvas.rect(0, doc.height + doc.topMargin - 30, doc.width + doc.leftMargin + doc.rightMargin, 30, fill=1)
        
        # Título principal grande y llamativo
        canvas.setFont('Helvetica-Bold', 28)
        canvas.setFillColor(self.colors['white'])
        canvas.drawCentredString(
            doc.width/2 + doc.leftMargin, 
            doc.height + doc.topMargin - 55, 
            "CATÁLOGO ESPECIAL"
        )
        
        # Subtítulo promocional
        canvas.setFont('Helvetica-Bold', 16)
        canvas.drawCentredString(
            doc.width/2 + doc.leftMargin, 
            doc.height + doc.topMargin - 75, 
            "PRODUCTOS SELECCIONADOS"
        )
        
        # Fecha en la banda superior
        canvas.setFont('Helvetica', 10)
        fecha_actual = datetime.now().strftime("%d de %B de %Y")
        canvas.drawRightString(
            doc.width + doc.leftMargin - 20, 
            doc.height + doc.topMargin - 20, 
            f"Válido desde: {fecha_actual}"
        )
        
        # Logo/Marca en la esquina izquierda
        canvas.setFont('Helvetica-Bold', 12)
        canvas.drawString(
            doc.leftMargin + 20, 
            doc.height + doc.topMargin - 20, 
            "VendDly Solutions"
        )
        
        canvas.restoreState()

    def create_promotional_footer(self, canvas, doc):
        """Crear pie de página promocional"""
        canvas.saveState()
        
        # Fondo rojo para el footer
        canvas.setFillColor(self.colors['primary_red'])
        canvas.rect(0, 0, doc.width + doc.leftMargin + doc.rightMargin, 70, fill=1)
        
        # Información de contacto destacada
        canvas.setFont('Helvetica-Bold', 11)
        canvas.setFillColor(self.colors['white'])
        canvas.drawString(doc.leftMargin + 20, 45, "VendDly Solutions S.A.")
        
        canvas.setFont('Helvetica', 9)
        canvas.drawString(doc.leftMargin + 20, 30, "📞 +593 XX XXX XXXX")
        canvas.drawString(doc.leftMargin + 150, 30, "✉ info@venddly.com")
        canvas.drawString(doc.leftMargin + 280, 30, "🌐 www.venddly.com")
        
        # Número de página en círculo
        canvas.setFillColor(self.colors['white'])
        canvas.circle(doc.width + doc.leftMargin - 30, 35, 15, fill=1)
        canvas.setFillColor(self.colors['primary_red'])
        canvas.setFont('Helvetica-Bold', 12)
        canvas.drawCentredString(doc.width + doc.leftMargin - 30, 31, str(doc.page))
        
        # Línea decorativa amarilla
        canvas.setStrokeColor(self.colors['yellow_accent'])
        canvas.setLineWidth(3)
        canvas.line(doc.leftMargin, 15, doc.width + doc.leftMargin, 15)
        
        canvas.restoreState()


    def download_and_process_image(self, image_url, max_size=(100, 100)):
            """Descargar y procesar imagen de producto con mejor calidad"""
            try:
                if not image_url or image_url == 'https://via.placeholder.com/300x200?text=Sin+Imagen':
                    logger.info("URL de imagen vacía o placeholder")
                    return None

                logger.info(f"Procesando imagen: {image_url}")

                # Obtener la ruta base del proyecto (donde está app.py)
                # Desde controllers/catalogo_pdf_controller.py necesitamos subir hasta la raíz
                current_file_dir = os.path.dirname(__file__)  # controllers/
                project_root = os.path.abspath(os.path.join(current_file_dir, '..', '..', '..'))  # VendDly (raíz)
                
                logger.info(f"Directorio actual: {current_file_dir}")
                logger.info(f"Raíz del proyecto: {project_root}")

                # Si es una URL del servidor local (FastAPI)
                if any(host in image_url for host in ['127.0.0.1:8000', 'localhost:8000']):
                    # Extraer la parte después de /uploads/
                    if '/uploads/' in image_url:
                        relative_path = image_url.split('/uploads/')[-1]
                        # Construir ruta física: VendDly/uploads/productos/imagen.jpg
                        image_path = os.path.join(project_root, 'uploads', relative_path)
                        logger.info(f"Ruta construida para servidor local: {image_path}")
                    else:
                        logger.warning(f"URL del servidor local sin /uploads/: {image_url}")
                        return None
                        
                # Si empieza con /uploads/ (ruta relativa)
                elif image_url.startswith('/uploads/'):
                    relative_path = image_url[9:]  # Quitar '/uploads/'
                    image_path = os.path.join(project_root, 'uploads', relative_path)
                    logger.info(f"Ruta construida para ruta relativa: {image_path}")
                    
                # Si es una URL externa (no local)
                elif image_url.startswith('http') and not any(host in image_url for host in ['127.0.0.1', 'localhost']):
                    logger.info(f"Descargando imagen externa: {image_url}")
                    response = requests.get(image_url, timeout=10)
                    if response.status_code == 200:
                        img = PILImage.open(BytesIO(response.content))
                    else:
                        logger.warning(f"Error al descargar imagen externa: HTTP {response.status_code}")
                        return None
                else:
                    # Intentar como ruta relativa desde la raíz del proyecto
                    image_path = os.path.join(project_root, image_url.lstrip('/'))
                    logger.info(f"Ruta construida como ruta relativa: {image_path}")

                # Para rutas locales, verificar existencia y abrir archivo
                if 'image_path' in locals():
                    logger.info(f"Verificando existencia de archivo: {image_path}")
                    if os.path.exists(image_path):
                        logger.info(f"Archivo encontrado, abriendo: {image_path}")
                        img = PILImage.open(image_path)
                    else:
                        logger.warning(f"Archivo no encontrado: {image_path}")
                        # Listar contenido del directorio para debug
                        parent_dir = os.path.dirname(image_path)
                        if os.path.exists(parent_dir):
                            files_in_dir = os.listdir(parent_dir)
                            logger.info(f"Archivos en directorio {parent_dir}: {files_in_dir[:10]}")  # Mostrar primeros 10
                        return None

                # Procesar imagen
                logger.info("Procesando imagen: convertir a RGB y redimensionar")
                img = img.convert('RGB')
                original_size = img.size
                img.thumbnail(max_size, PILImage.Resampling.LANCZOS)
                new_size = img.size
                logger.info(f"Imagen redimensionada de {original_size} a {new_size}")

                # Crear archivo temporal
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
                img.save(temp_file.name, 'JPEG', quality=95)
                temp_file.close()

                logger.info(f"Imagen procesada exitosamente. Archivo temporal: {temp_file.name}")
                return temp_file.name

            except Exception as e:
                logger.error(f"Error detallado al procesar imagen {image_url}: {str(e)}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
                return None
        
    def debug_project_structure(self):
        """Debug detallado de la estructura del proyecto"""
        try:
            current_file_dir = os.path.dirname(__file__)
            project_root = os.path.abspath(os.path.join(current_file_dir, '..'))
            
            logger.info("=== DEBUG ESTRUCTURA PROYECTO ===")
            logger.info(f"Archivo actual: {__file__}")
            logger.info(f"Directorio del archivo: {current_file_dir}")
            logger.info(f"Raíz del proyecto calculada: {project_root}")
            
            # Verificar estructura
            uploads_dir = os.path.join(project_root, 'uploads')
            productos_dir = os.path.join(uploads_dir, 'productos')
            
            logger.info(f"Directorio uploads: {uploads_dir}")
            logger.info(f"¿Existe uploads/?: {os.path.exists(uploads_dir)}")
            logger.info(f"Directorio productos: {productos_dir}")
            logger.info(f"¿Existe uploads/productos/?: {os.path.exists(productos_dir)}")
            
            if os.path.exists(productos_dir):
                files = os.listdir(productos_dir)
                logger.info(f"Archivos en uploads/productos ({len(files)} total):")
                for i, file in enumerate(files):
                    if i < 5:  # Mostrar solo los primeros 5
                        file_path = os.path.join(productos_dir, file)
                        file_size = os.path.getsize(file_path)
                        logger.info(f"  - {file} ({file_size} bytes)")
                        
            # Verificar app.py
            app_py_path = os.path.join(project_root, 'app.py')
            logger.info(f"¿Existe app.py en {app_py_path}?: {os.path.exists(app_py_path)}")
            
            logger.info("=== FIN DEBUG ===")
            
        except Exception as e:
            logger.error(f"Error en debug de estructura: {e}")

    def test_sample_image(self, sample_url):
        """Probar procesamiento de una imagen específica"""
        logger.info(f"=== PROBANDO IMAGEN: {sample_url} ===")
        result = self.download_and_process_image(sample_url, (100, 100))
        if result:
            logger.info(f"✅ Imagen procesada exitosamente: {result}")
            # Verificar que el archivo temporal existe
            if os.path.exists(result):
                size = os.path.getsize(result)
                logger.info(f"✅ Archivo temporal verificado: {size} bytes")
            else:
                logger.error("❌ Archivo temporal no existe")
        else:
            logger.error("❌ Error al procesar imagen")
        logger.info("=== FIN PRUEBA ===")
        return result
        
    def debug_image_paths(self):
        """Método para debugear rutas de imágenes"""
        try:
            # Obtener directorio base del proyecto
            current_dir = os.path.dirname(__file__)
            base_dir = os.path.abspath(os.path.join(current_dir, '..', '..'))
            uploads_dir = os.path.join(base_dir, 'uploads', 'productos')
            
            logger.info(f"Directorio actual del archivo: {current_dir}")
            logger.info(f"Directorio base del proyecto: {base_dir}")
            logger.info(f"Directorio de uploads esperado: {uploads_dir}")
            logger.info(f"¿Existe el directorio uploads/productos?: {os.path.exists(uploads_dir)}")
            
            if os.path.exists(uploads_dir):
                files = os.listdir(uploads_dir)
                logger.info(f"Archivos encontrados en uploads/productos: {len(files)}")
                for file in files[:5]:  # Mostrar solo los primeros 5
                    logger.info(f"  - {file}")
            
            return base_dir
            
        except Exception as e:
            logger.error(f"Error en debug de rutas: {e}")
            return None

        # Método para limpiar archivos temporales al final
    def cleanup_temp_files(self):
        """Limpiar archivos temporales creados durante el proceso"""
        temp_dir = tempfile.gettempdir()
        try:
            for filename in os.listdir(temp_dir):
                if filename.endswith('.jpg') and filename.startswith('tmp'):
                    file_path = os.path.join(temp_dir, filename)
                    try:
                        os.unlink(file_path)
                    except:
                        pass
        except:
            pass

    def create_product_grid_promotional(self, db: Session, filters: dict = None):
        """Crear layout de productos en formato promocional de cuadrícula"""
        productos = get_productos(db)
        
        if filters:
            productos = self.apply_filters(productos, filters)
            
        elements = []
        
        # Título y información inicial promocional
        elements.extend(self.create_promotional_header_section(productos))
        
        # Crear productos en formato de tarjetas promocionales
        products_per_row = 3  # Cambio a 3 productos por fila para más densidad
        current_row = []
        
        for i, producto in enumerate(productos):
            # Crear tarjeta promocional de producto
            product_card = self.create_promotional_product_card(producto)
            current_row.append(product_card)
            
            # Si completamos una fila o es el último producto
            if len(current_row) == products_per_row or i == len(productos) - 1:
                # Crear tabla para la fila
                while len(current_row) < products_per_row:
                    current_row.append("")  # Llenar espacios vacíos
                    
                row_table = Table([current_row], colWidths=[2.5*inch, 2.5*inch, 2.5*inch])
                row_table.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 8),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                    ('TOPPADDING', (0, 0), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ]))
                
                elements.append(KeepTogether(row_table))
                elements.append(Spacer(1, 12))
                current_row = []
                
        return elements

    def create_promotional_product_card(self, producto):
        """Crear tarjeta promocional de producto"""
        # Contenedor principal de la tarjeta
        card_data = []
        
        # Imagen del producto con mejor manejo
        image_cell = ""
        if producto.imagen:
            image_path = self.download_and_process_image(producto.imagen, (90, 90))
            if image_path:
                try:
                    img = ReportLabImage(image_path, width=80, height=80)
                    image_cell = img

                except Exception as e:
                    logger.warning(f"Error al crear imagen ReportLab: {e}")
                    image_cell = Paragraph(
                        "<para align='center'><font size='24'>📷</font><br/><font size='8'>Imagen no disponible</font></para>", 
                        self.product_info_style
                    )
            else:
                image_cell = Paragraph(
                    "<para align='center'><font size='24'>📷</font><br/><font size='8'>Imagen no disponible</font></para>", 
                    self.product_info_style
                )
        else:
            image_cell = Paragraph(
                "<para align='center'><font size='24'>📷</font><br/><font size='8'>Sin imagen</font></para>", 
                self.product_info_style
            )
        
        # Nombre del producto (truncado)
        nombre_truncado = producto.nombre[:30] + "..." if len(producto.nombre) > 30 else producto.nombre
        nombre_producto = Paragraph(f"<b>{nombre_truncado}</b>", self.product_name_style)
        
        # Información de marca y categoría
        marca = producto.marca.descripcion if producto.marca else "N/A"
        categoria = producto.categoria.descripcion if producto.categoria else "N/A"
        info_producto = Paragraph(
            f"<i>{marca[:15]}{'...' if len(marca) > 15 else ''}</i><br/>"
            f"<i>{categoria[:15]}{'...' if len(categoria) > 15 else ''}</i>", 
            ParagraphStyle('ProductMeta', parent=self.product_info_style, fontSize=8, textColor=self.colors['dark_gray'])
        )
        
        # Precios en formato promocional
        precio_minorista = f"${producto.precio_minorista:.2f}"
        precio_mayorista = f"${producto.precio_mayorista:.2f}"
        
        # Crear celda de precio destacado
        precio_cell = self.create_price_cell(precio_minorista, precio_mayorista)
        
        # Stock con color
        stock_info = self.create_stock_info(producto.stock)
        
        # Layout de la tarjeta: imagen arriba, info abajo
        card_content = [
            [image_cell],
            [nombre_producto],
            [info_producto],
            [precio_cell],
            [stock_info]
        ]
        
        card_table = Table(card_content, colWidths=[2.3*inch])
        
        # Determinar color de fondo basado en stock
        bg_color = self.get_card_background_color(producto.stock)
        
        card_table.setStyle(TableStyle([
            # Fondo y bordes
            ('BACKGROUND', (0, 0), (-1, -1), self.colors['white']),
            ('BOX', (0, 0), (-1, -1), 2, self.colors['primary_red']),
            
            # Imagen
            ('ALIGN', (0, 0), (0, 0), 'CENTER'),
            ('VALIGN', (0, 0), (0, 0), 'MIDDLE'),
            ('BACKGROUND', (0, 0), (0, 0), self.colors['light_gray']),
            
            # Nombre del producto
            ('ALIGN', (0, 1), (0, 1), 'CENTER'),
            ('BACKGROUND', (0, 1), (0, 1), bg_color),
            
            # Info del producto
            ('ALIGN', (0, 2), (0, 2), 'CENTER'),
            
            # Precio
            ('ALIGN', (0, 3), (0, 3), 'CENTER'),
            ('BACKGROUND', (0, 3), (0, 3), self.colors['primary_red']),
            
            # Stock
            ('ALIGN', (0, 4), (0, 4), 'CENTER'),
            
            # Padding general
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        return card_table

    def create_price_cell(self, precio_minorista, precio_mayorista):
        """Crear celda de precio promocional"""
        price_content = f"""
        <para align="center">
            <font color="white" size="12"><b>{precio_minorista}</b></font><br/>
            <font color="white" size="8">Minorista</font><br/>
            <font color="white" size="10">{precio_mayorista}</font><br/>
            <font color="white" size="7">Mayorista</font>
        </para>
        """
        return Paragraph(price_content, self.price_highlight_style)

    def create_stock_info(self, stock):
        """Crear información de stock con colores"""
        try:
            stock_num = int(stock) if str(stock).isdigit() else 0
            if stock_num > 10:
                color = "#28A745"  # Verde
                status = "DISPONIBLE"
            elif stock_num > 0:
                color = "#FFC107"  # Amarillo
                status = "LIMITADO"
            else:
                color = "#DC3545"  # Rojo
                status = "AGOTADO"
                
            stock_content = f"""
            <para align="center">
                <font color="{color}" size="10"><b>{stock} unid.</b></font><br/>
                <font color="{color}" size="8">{status}</font>
            </para>
            """
            return Paragraph(stock_content, self.product_info_style)
        except:
            return Paragraph("Stock: N/A", self.product_info_style)

    def get_card_background_color(self, stock):
        """Obtener color de fondo de tarjeta según stock"""
        try:
            stock_num = int(stock) if str(stock).isdigit() else 0
            if stock_num > 10:
                return self.colors['light_gray']
            elif stock_num > 0:
                return colors.HexColor('#FFF8DC')  # Beige claro
            else:
                return colors.HexColor('#FFE4E1')  # Rosa claro
        except:
            return self.colors['white']

    def create_promotional_header_section(self, productos):
        """Crear sección de encabezado promocional"""
        elements = []
        
        # Banner promocional principal
        promo_data = [[
            Paragraph(
                "<para align='center'>"
                "<font color='white' size='24'><b>¡OFERTAS ESPECIALES!</b></font><br/>"
                "<font color='white' size='14'>Los mejores productos al mejor precio</font><br/>"
                f"<font color='white' size='12'>{len(productos)} productos disponibles</font>"
                "</para>",
                self.promo_subtitle
            )
        ]]
        
        promo_table = Table(promo_data, colWidths=[6.5*inch])
        promo_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), self.colors['primary_red']),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 15),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
            ('BOX', (0, 0), (-1, -1), 3, self.colors['yellow_accent']),
        ]))
        
        elements.append(promo_table)
        elements.append(Spacer(1, 20))
        
        # Información de la empresa en formato promocional
        company_data = [[
            Paragraph(
                "<para align='center'>"
                "<font color='white' size='12'><b>VendDly Solutions S.A.</b></font><br/>"
                "<font color='white' size='10'>Soluciones Comerciales Integrales</font><br/>"
                "<font color='white' size='9'>📞 +593 XX XXX XXXX  •  ✉ info@venddly.com  •  🌐 www.venddly.com</font><br/>"
                f"<font color='white' size='8'>Catálogo generado el {datetime.now().strftime('%d de %B de %Y')}</font>"
                "</para>",
                self.company_style
            )
        ]]
        
        company_table = Table(company_data, colWidths=[6.5*inch])
        company_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), self.colors['secondary_red']),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        
        elements.append(company_table)
        elements.append(Spacer(1, 25))
        
        return elements

    def apply_filters(self, productos, filters):
        """Aplicar filtros a la lista de productos"""
        filtered_products = productos
        
        if filters.get('search'):
            search_text = filters['search'].lower()
            filtered_products = [
                p for p in filtered_products 
                if search_text in p.nombre.lower() or 
                   (p.marca and search_text in p.marca.descripcion.lower()) or
                   (p.categoria and search_text in p.categoria.descripcion.lower())
            ]
        
        if filters.get('marca_id'):
            filtered_products = [p for p in filtered_products if p.id_marca == filters['marca_id']]
        
        if filters.get('categoria_id'):
            filtered_products = [p for p in filtered_products if p.id_categoria == filters['categoria_id']]
        
        if filters.get('price_range') and filters['price_range'] != 'all':
            price_range = filters['price_range']
            if price_range == 'low':
                filtered_products = [p for p in filtered_products if p.precio_minorista < 50]
            elif price_range == 'medium':
                filtered_products = [p for p in filtered_products if 50 <= p.precio_minorista < 200]
            elif price_range == 'high':
                filtered_products = [p for p in filtered_products if p.precio_minorista >= 200]
        
        return filtered_products

# Instancia global del generador promocional
modern_pdf_generator = ModernCatalogoPDF()

def generate_catalog_pdf(db: Session, filters: dict = None):
    """Función principal para generar PDF promocional del catálogo"""
    return modern_pdf_generator.generate_catalog_pdf(db, filters)