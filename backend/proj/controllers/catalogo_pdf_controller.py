from pydoc import doc
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, 
    Image as ReportLabImage, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
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

class ProfessionalCatalogoPDF:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_colors()
        self.setup_custom_styles()
        # Store page dimensions for use in methods
        self.page_width = A4[0]
        self.page_height = A4[1]
        self.left_margin = 0.5*inch
        self.right_margin = 0.5*inch
        self.top_margin = 0.8*inch
        self.bottom_margin = 0.6*inch
        self.content_width = self.page_width - self.left_margin - self.right_margin

    def setup_colors(self):
        """Definir paleta de colores del sistema (verde lime y compatibles)"""
        self.colors = {
            'primary_green': colors.HexColor('#84CC16'),      # Verde lime principal
            'light_green': colors.HexColor('#F0FDF4'),        # Fondo verde claro
            'header_green': colors.HexColor('#65A30D'),       # Verde para headers
            'dark_green': colors.HexColor('#365314'),         # Verde oscuro
            'white': colors.white,
            'black': colors.black,
            'dark_gray': colors.HexColor('#1F2937'),          # Texto principal
            'medium_gray': colors.HexColor('#6B7280'),        # Texto secundario
            'light_gray': colors.HexColor('#F9FAFB'),         # Fondo alternativo
            'border_gray': colors.HexColor('#E5E7EB'),        # Bordes
            'accent_orange': colors.HexColor('#F97316')       # Acentos naranjas
        }
        
    def setup_custom_styles(self):
        """Configurar estilos profesionales"""
        # Título principal del catálogo
        self.main_title_style = ParagraphStyle(
            'MainTitle',
            parent=self.styles['Heading1'],
            fontSize=36,
            spaceAfter=20,
            spaceBefore=20,
            alignment=TA_CENTER,
            textColor=self.colors['white'],
            fontName='Helvetica-Bold'
        )
        
        # Subtítulo del catálogo
        self.subtitle_style = ParagraphStyle(
            'Subtitle',
            parent=self.styles['Normal'],
            fontSize=18,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=self.colors['white'],
            fontName='Helvetica'
        )
        
        # Título de categoría grande para página completa
        self.category_page_title_style = ParagraphStyle(
            'CategoryPageTitle',
            parent=self.styles['Heading1'],
            fontSize=48,
            spaceAfter=0,
            spaceBefore=0,
            alignment=TA_CENTER,
            textColor=self.colors['white'],
            fontName='Helvetica-Bold',
            leading=56
        )
        
        # Nombre del producto mejorado
        self.product_name_style = ParagraphStyle(
            'ProductName',
            parent=self.styles['Normal'],
            fontSize=8,
            alignment=TA_CENTER,
            textColor=self.colors['dark_gray'],
            fontName='Helvetica-Bold',
            leading=10,
            spaceAfter=3,
            spaceBefore=3
        )
        
        # Descripción del producto mejorada
        self.product_desc_style = ParagraphStyle(
            'ProductDesc',
            parent=self.styles['Normal'],
            fontSize=7,
            alignment=TA_CENTER,
            textColor=self.colors['medium_gray'],
            leading=8,
            spaceAfter=2,
            spaceBefore=2
        )

    def generate_catalog_pdf(self, db: Session, filters: dict = None):
        """Generar PDF del catálogo profesional"""
        try:
            elements = self.create_professional_catalog(db, filters)
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
            
            # Configuración de documento con márgenes ajustados
            doc = SimpleDocTemplate(
                temp_file.name, 
                pagesize=A4,
                topMargin=self.top_margin,
                bottomMargin=self.bottom_margin,
                leftMargin=self.left_margin,
                rightMargin=self.right_margin
            )
            
            # Variable para controlar el tipo de página
            self.page_type = 'cover'
            self.category_names = list(self.group_products_by_category(get_productos(db)).keys())
            self.current_category_index = 0
            
            doc.build(
                elements,
                onFirstPage=self.create_cover_page,
                onLaterPages=self.handle_page_types
            )
            
            self.cleanup_temp_files()
            return temp_file.name
            
        except Exception as e:
            logger.error(f"Error al generar PDF: {e}")
            raise Exception(f"Error al generar PDF: {str(e)}")

    def handle_page_types(self, canvas, doc):
        """Manejar diferentes tipos de páginas"""
        # Determinar si es página de categoría basándose en el número de página
        # Página 1: Portada
        # Página 2, 4, 6, etc.: Páginas de categoría 
        # Página 3, 5, 7, etc.: Páginas de productos
        
        if doc.page == 1:
            # Esta es la portada, ya manejada
            return
        elif (doc.page - 2) % 2 == 0:  # Páginas pares después de portada = categorías
            category_index = (doc.page - 2) // 2
            if category_index < len(self.category_names):
                self.create_category_page(canvas, doc, self.category_names[category_index])
        else:  # Páginas impares después de portada = productos
            self.create_standard_header(canvas, doc)

    def create_cover_page(self, canvas, doc):
        """Crear página de portada completa - SIN cuadrados blancos"""
        canvas.saveState()
        
        # Fondo completo verde
        canvas.setFillColor(self.colors['primary_green'])
        canvas.rect(0, 0, doc.pagesize[0], doc.pagesize[1], fill=1)
        
        # Título principal mejorado con mejor contraste
        canvas.setFont('Helvetica-Bold', 48)
        canvas.setFillColor(self.colors['white'])
        # Agregar sombra para mejor contraste
        shadow_offset = 2
        # Sombra
        canvas.setFillColor(colors.HexColor('#000000'))
        canvas.drawCentredString(
            doc.pagesize[0]/2 + shadow_offset, 
            doc.pagesize[1]/2 + 20 - shadow_offset, 
            "CATÁLOGO"
        )
        # Texto principal
        canvas.setFillColor(self.colors['white'])
        canvas.drawCentredString(
            doc.pagesize[0]/2, 
            doc.pagesize[1]/2 + 20, 
            "CATÁLOGO"
        )
        
        # Nombre de la empresa con estilo
        canvas.setFont('Helvetica-Bold', 28)
        canvas.setFillColor(self.colors['white'])
        canvas.drawCentredString(
            doc.pagesize[0]/2, 
            doc.pagesize[1]/2 - 40, 
            "VendDly Solutions"
        )
        
        # Fecha con estilo
        canvas.setFont('Helvetica', 18)
        fecha_actual = datetime.now().strftime("%B %Y")
        canvas.drawCentredString(
            doc.pagesize[0]/2, 
            doc.pagesize[1]/2 - 80, 
            fecha_actual.upper()
        )
        
        # Líneas decorativas
        canvas.setStrokeColor(self.colors['white'])
        canvas.setLineWidth(4)
        # Línea superior
        canvas.line(100, doc.pagesize[1]/2 + 80, doc.pagesize[0] - 100, doc.pagesize[1]/2 + 80)
        # Línea inferior
        canvas.line(100, doc.pagesize[1]/2 - 120, doc.pagesize[0] - 100, doc.pagesize[1]/2 - 120)
        
        # Texto descriptivo en la parte inferior
        canvas.setFont('Helvetica', 14)
        canvas.setFillColor(self.colors['white'])
        canvas.drawCentredString(
            doc.pagesize[0]/2, 
            150, 
            "PRODUCTOS DE CALIDAD PARA SU NEGOCIO"
        )
        
        canvas.restoreState()

    def create_category_page(self, canvas, doc, categoria_nombre):
        """Crear página completa para categoría - SIN cuadrados blancos"""
        canvas.saveState()
        
        # Fondo completo verde oscuro
        canvas.setFillColor(self.colors['dark_green'])
        canvas.rect(0, 0, doc.pagesize[0], doc.pagesize[1], fill=1)
        
        # Título de categoría centrado verticalmente
        canvas.setFont('Helvetica-Bold', 48)
        canvas.setFillColor(self.colors['white'])
        canvas.drawCentredString(
            doc.pagesize[0]/2, 
            doc.pagesize[1]/2 + 20, 
            categoria_nombre.upper()
        )
        
        # Nombre de la empresa debajo del título
        canvas.setFont('Helvetica', 20)
        canvas.setFillColor(colors.HexColor('#A3A3A3'))  # Gris claro
        canvas.drawCentredString(
            doc.pagesize[0]/2, 
            doc.pagesize[1]/2 - 30, 
            "VendDly Solutions"
        )
        
        # Fecha debajo de la empresa
        canvas.setFont('Helvetica', 16)
        fecha_actual = datetime.now().strftime("%B %Y")
        canvas.drawCentredString(
            doc.pagesize[0]/2, 
            doc.pagesize[1]/2 - 60, 
            fecha_actual.upper()
        )
        
        # Líneas decorativas
        canvas.setStrokeColor(self.colors['primary_green'])
        canvas.setLineWidth(4)
        # Línea superior
        line_y_top = doc.pagesize[1]/2 + 80
        canvas.line(150, line_y_top, doc.pagesize[0] - 150, line_y_top)
        # Línea inferior
        line_y_bottom = doc.pagesize[1]/2 - 100
        canvas.line(150, line_y_bottom, doc.pagesize[0] - 150, line_y_bottom)
        
        canvas.restoreState()

    def create_standard_header(self, canvas, doc):
        """Crear encabezado estándar para páginas de productos"""
        canvas.saveState()
        
        # Línea superior verde
        canvas.setStrokeColor(self.colors['primary_green'])
        canvas.setLineWidth(3)
        canvas.line(
            doc.leftMargin, 
            doc.height + doc.topMargin - 15, 
            doc.width + doc.leftMargin, 
            doc.height + doc.topMargin - 15
        )
        
        # Título pequeño
        canvas.setFont('Helvetica-Bold', 10)
        canvas.setFillColor(self.colors['primary_green'])
        canvas.drawString(
            doc.leftMargin, 
            doc.height + doc.topMargin - 30, 
            "CATÁLOGO DE PRODUCTOS"
        )
        
        # Número de página
        canvas.setFont('Helvetica', 9)
        canvas.setFillColor(self.colors['medium_gray'])
        canvas.drawRightString(
            doc.width + doc.leftMargin, 
            doc.height + doc.topMargin - 30, 
            f"Página {doc.page}"
        )
        
        canvas.restoreState()

    def download_and_process_image(self, image_url, max_size=(80, 80)):
        """Procesar imagen de producto"""
        try:
            if not image_url or image_url == 'https://via.placeholder.com/300x200?text=Sin+Imagen':
                return None

            # Obtener ruta del proyecto
            current_file_dir = os.path.dirname(__file__)
            project_root = os.path.abspath(os.path.join(current_file_dir, '..', '..', '..'))
            
            # Procesar URL local del servidor
            if any(host in image_url for host in ['127.0.0.1:8000', 'localhost:8000']):
                if '/uploads/' in image_url:
                    relative_path = image_url.split('/uploads/')[-1]
                    image_path = os.path.join(project_root, 'uploads', relative_path)
                else:
                    return None
                    
            elif image_url.startswith('/uploads/'):
                relative_path = image_url[9:]
                image_path = os.path.join(project_root, 'uploads', relative_path)
                
            elif image_url.startswith('http') and not any(host in image_url for host in ['127.0.0.1', 'localhost']):
                response = requests.get(image_url, timeout=10)
                if response.status_code == 200:
                    img = PILImage.open(BytesIO(response.content))
                else:
                    return None
            else:
                image_path = os.path.join(project_root, image_url.lstrip('/'))

            # Abrir imagen local
            if 'image_path' in locals():
                if os.path.exists(image_path):
                    img = PILImage.open(image_path)
                else:
                    return None

            # Procesar imagen
            img = img.convert('RGB')
            img.thumbnail(max_size, PILImage.Resampling.LANCZOS)

            # Crear archivo temporal
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
            img.save(temp_file.name, 'JPEG', quality=90)
            temp_file.close()

            return temp_file.name

        except Exception as e:
            logger.error(f"Error al procesar imagen {image_url}: {str(e)}")
            return None

    def create_professional_catalog(self, db: Session, filters: dict = None):
        """Crear catálogo profesional organizado por categorías - CON páginas de productos"""
        productos = get_productos(db)
        
        if filters:
            productos = self.apply_filters(productos, filters)
            
        elements = []
        
        # Página de portada
        elements.append(Spacer(1, 10))
        elements.append(PageBreak())
        
        # Agrupar productos por categoría
        productos_por_categoria = self.group_products_by_category(productos)
        
        # Crear secciones por categoría
        for i, (categoria_nombre, productos_categoria) in enumerate(productos_por_categoria.items()):
            # 1. Página de categoría (portada de la categoría)
            elements.append(Spacer(1, 10))
            elements.append(PageBreak())
            
            # 2. Página de productos de la categoría
            elements.append(Spacer(1, 50))  # Espacio para header
            
            # Grid de productos - 4 columnas
            products_per_row = 4
            current_row = []
            
            for j, producto in enumerate(productos_categoria):
                product_cell = self.create_professional_product_cell(producto)
                current_row.append(product_cell)
                
                # Completar fila o último producto de la categoría
                if len(current_row) == products_per_row or j == len(productos_categoria) - 1:
                    actual_cols = len(current_row)
                    col_width = (self.content_width - 0.5*inch) / products_per_row
                    
                    # Crear tabla para la fila
                    row_table = Table(
                        [current_row], 
                        colWidths=[col_width] * actual_cols,
                        rowHeights=[2.5*inch]
                    )
                    
                    row_table.setStyle(TableStyle([
                        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                        ('LEFTPADDING', (0, 0), (-1, -1), 4),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                        ('TOPPADDING', (0, 0), (-1, -1), 8),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                    ]))
                    
                    elements.append(KeepTogether(row_table))
                    elements.append(Spacer(1, 10))
                    current_row = []
            
            # Agregar página break después de los productos (excepto la última categoría)
            if i < len(productos_por_categoria) - 1:
                elements.append(PageBreak())
                
        return elements

    def create_professional_product_cell(self, producto):
        """Crear celda de producto estilo profesional sin stock"""
        cell_data = []
        
        # Imagen del producto centrada
        image_cell = self.create_product_image(producto)
        cell_data.append([image_cell])
        
        # Nombre del producto - permitir más líneas si es necesario
        nombre_completo = producto.nombre.upper()
        # Dividir nombre en líneas si es muy largo
        if len(nombre_completo) > 20:
            palabras = nombre_completo.split()
            lineas = []
            linea_actual = ""
            
            for palabra in palabras:
                if len(linea_actual + " " + palabra) <= 20:
                    if linea_actual:
                        linea_actual += " " + palabra
                    else:
                        linea_actual = palabra
                else:
                    if linea_actual:
                        lineas.append(linea_actual)
                    linea_actual = palabra
            
            if linea_actual:
                lineas.append(linea_actual)
            
            # Limitar a máximo 3 líneas
            if len(lineas) > 3:
                lineas = lineas[:2]
                lineas.append(lineas[-1][:15] + "...")
            
            nombre_texto = "<br/>".join(lineas)
        else:
            nombre_texto = nombre_completo
        
        nombre = Paragraph(f"<b>{nombre_texto}</b>", self.product_name_style)
        cell_data.append([nombre])
        
        # Información adicional compacta (SIN precio) - solo marca
        info_parts = []
        if producto.marca:
            marca_text = producto.marca.descripcion
            if len(marca_text) > 18:
                marca_text = marca_text[:15] + "..."
            info_parts.append(marca_text)
        
        # NO agregar precio - comentado
        # if hasattr(producto, 'precio_minorista') and producto.precio_minorista:
        #     try:
        #         precio = float(producto.precio_minorista)
        #         info_parts.append(f"${precio:.2f}")
        #     except:
        #         pass
        
        if info_parts:
            info_text = "<br/>".join(info_parts)
            info = Paragraph(info_text, self.product_desc_style)
            cell_data.append([info])
        
        # Crear tabla interna para la celda con altura dinámica
        cell_width = (self.content_width - 0.5*inch) / 4  # 4 columns
        
        # Calcular altura basada en contenido
        base_height = 1.8*inch  # Altura base
        if len(cell_data) > 2:  # Si hay más contenido
            cell_height = base_height + 0.3*inch  # Aumentar altura
        else:
            cell_height = base_height
        
        cell_table = Table(cell_data, colWidths=[cell_width], rowHeights=None)
        
        # Fondo blanco con bordes verdes suaves
        cell_table.setStyle(TableStyle([
            # Fondo y bordes
            ('BACKGROUND', (0, 0), (-1, -1), self.colors['white']),
            ('BOX', (0, 0), (-1, -1), 1, self.colors['primary_green']),
            ('ROUNDEDCORNERS', [5, 5, 5, 5]),  # Esquinas redondeadas
            
            # Alineación
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            
            # Padding ajustado para contenido dinámico
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            
            # Espaciado especial para imagen
            ('TOPPADDING', (0, 0), (0, 0), 12),
            ('BOTTOMPADDING', (0, 0), (0, 0), 10),
        ]))
        
        return cell_table

    def create_product_image(self, producto):
        """Crear imagen del producto con estilo profesional"""
        if producto.imagen:
            image_path = self.download_and_process_image(producto.imagen, (70, 70))
            if image_path:
                try:
                    return ReportLabImage(image_path, width=70, height=70)
                except Exception as e:
                    logger.warning(f"Error al crear imagen: {e}")
        
        # Placeholder profesional si no hay imagen con estilo verde
        placeholder = Paragraph(
            "<para align='center'>"
            "<font size='24' color='#84CC16'>📦</font><br/>"
            "<font size='6' color='#6B7280'>SIN IMAGEN</font>"
            "</para>", 
            self.product_desc_style
        )
        return placeholder

    def group_products_by_category(self, productos):
        """Agrupar productos por categoría"""
        productos_por_categoria = {}
        
        for producto in productos:
            # Obtener nombre de la categoría
            categoria_nombre = "PRODUCTOS GENERALES"
            if producto.categoria and hasattr(producto.categoria, 'descripcion'):
                categoria_nombre = producto.categoria.descripcion
            elif producto.categoria and hasattr(producto.categoria, 'nombre'):
                categoria_nombre = producto.categoria.nombre
            
            # Agregar producto a la categoría correspondiente
            if categoria_nombre not in productos_por_categoria:
                productos_por_categoria[categoria_nombre] = []
            
            productos_por_categoria[categoria_nombre].append(producto)
        
        # Ordenar categorías alfabéticamente
        sorted_categories = {}
        category_names = sorted(productos_por_categoria.keys())
        
        for cat_name in category_names:
            sorted_categories[cat_name] = productos_por_categoria[cat_name]
        
        return sorted_categories

    def apply_filters(self, productos, filters):
        """Aplicar filtros a los productos"""
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

    def cleanup_temp_files(self):
        """Limpiar archivos temporales"""
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

# Instancia global
professional_pdf_generator = ProfessionalCatalogoPDF()

def generate_catalog_pdf(db: Session, filters: dict = None):
    """Función principal para generar PDF profesional del catálogo"""
    return professional_pdf_generator.generate_catalog_pdf(db, filters)