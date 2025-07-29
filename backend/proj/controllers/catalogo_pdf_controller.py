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
        self.setup_custom_styles()
        self.setup_colors()
        
    def setup_colors(self):
        """Definir paleta de colores profesional"""
        self.colors = {
            'primary': colors.HexColor('#2C3E50'),      # Azul oscuro profesional
            'secondary': colors.HexColor('#ABD904'),     # Verde corporativo
            'accent': colors.HexColor('#3498DB'),        # Azul claro
            'text': colors.HexColor('#2C3E50'),          # Texto principal
            'text_light': colors.HexColor('#7F8C8D'),    # Texto secundario
            'background': colors.HexColor('#F8F9FA'),    # Fondo suave
            'white': colors.white,
            'light_gray': colors.HexColor('#ECF0F1'),
            'success': colors.HexColor('#27AE60'),
            'warning': colors.HexColor('#F39C12'),
            'danger': colors.HexColor('#E74C3C')
        }
        
    def setup_custom_styles(self):
        """Configurar estilos personalizados modernos"""
        # Título principal - más moderno
        self.title_style = ParagraphStyle(
            'ModernTitle',
            parent=self.styles['Heading1'],
            fontSize=28,
            spaceAfter=30,
            spaceBefore=20,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#2C3E50'),
            fontName='Helvetica-Bold',
            leading=34
        )
        
        # Subtítulo elegante
        self.subtitle_style = ParagraphStyle(
            'ModernSubtitle',
            parent=self.styles['Heading2'],
            fontSize=18,
            spaceAfter=25,
            spaceBefore=15,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#ABD904'),
            fontName='Helvetica-Bold',
            leading=22
        )
        
        # Información de empresa - más limpia
        self.company_style = ParagraphStyle(
            'CompanyInfo',
            parent=self.styles['Normal'],
            fontSize=11,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#7F8C8D'),
            spaceAfter=25,
            leading=14
        )
        
        # Headers de tabla - más elegantes
        self.header_style = ParagraphStyle(
            'TableHeader',
            parent=self.styles['Normal'],
            fontSize=10,
            alignment=TA_CENTER,
            textColor=colors.white,
            fontName='Helvetica-Bold',
            leading=12
        )
        
        # Contenido de tabla - mejor legibilidad
        self.cell_style = ParagraphStyle(
            'TableCell',
            parent=self.styles['Normal'],
            fontSize=9,
            alignment=TA_LEFT,
            textColor=colors.HexColor('#2C3E50'),
            leading=11
        )
        
        # Estilo para números/precios
        self.price_style = ParagraphStyle(
            'PriceStyle',
            parent=self.styles['Normal'],
            fontSize=9,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#27AE60'),
            fontName='Helvetica-Bold',
            leading=11
        )

    def create_modern_header(self, canvas, doc):
        """Crear encabezado moderno con diseño profesional"""
        canvas.saveState()
        
        # Fondo del header con gradiente visual
        canvas.setFillColor(self.colors['primary'])
        canvas.rect(0, doc.height + doc.topMargin - 60, doc.width + doc.leftMargin + doc.rightMargin, 60, fill=1)
        
        # Logo/Nombre de la empresa - más prominente
        canvas.setFont('Helvetica-Bold', 20)
        canvas.setFillColor(self.colors['white'])
        canvas.drawString(doc.leftMargin, doc.height + doc.topMargin - 35, "CATÁLOGO DE PRODUCTOS")
        
        # Línea decorativa moderna
        canvas.setStrokeColor(self.colors['secondary'])
        canvas.setLineWidth(3)
        canvas.line(
            doc.leftMargin, 
            doc.height + doc.topMargin - 45, 
            doc.width + doc.leftMargin - 50, 
            doc.height + doc.topMargin - 45
        )
        
        # Fecha y hora - más elegante
        canvas.setFont('Helvetica', 9)
        canvas.setFillColor(self.colors['light_gray'])
        fecha_actual = datetime.now().strftime("%d de %B de %Y • %H:%M")
        canvas.drawRightString(
            doc.width + doc.leftMargin - 20, 
            doc.height + doc.topMargin - 25, 
            f"Generado: {fecha_actual}"
        )
        
        canvas.restoreState()

    def create_modern_footer(self, canvas, doc):
        """Crear pie de página moderno"""
        canvas.saveState()
        
        # Línea decorativa superior
        canvas.setStrokeColor(self.colors['light_gray'])
        canvas.setLineWidth(1)
        canvas.line(doc.leftMargin, 60, doc.width + doc.leftMargin, 60)
        
        # Información de la empresa - layout moderno
        canvas.setFont('Helvetica', 9)
        canvas.setFillColor(self.colors['text_light'])
        canvas.drawString(doc.leftMargin, 45, "VendDly Solutions S.A.")
        canvas.drawString(doc.leftMargin, 35, "📞 +593 XX XXX XXXX  •  ✉ info@venddly.com  •  🌐 www.venddly.com")
        
        # Número de página - diseño moderno
        canvas.setFont('Helvetica-Bold', 9)
        canvas.setFillColor(self.colors['primary'])
        page_text = f"Página {doc.page}"
        canvas.drawRightString(doc.width + doc.leftMargin, 40, page_text)
        
        canvas.restoreState()

    def download_and_process_image(self, image_url, max_size=(80, 80)):
        """Descargar y procesar imagen de producto"""
        try:
            if not image_url or image_url == 'https://via.placeholder.com/300x200?text=Sin+Imagen':
                return None
                
            # Si es una URL local, convertirla a ruta absoluta
            if image_url.startswith('/uploads/'):
                image_path = image_url[1:]  # Remover el primer '/'
                if os.path.exists(image_path):
                    img = PILImage.open(image_path)
                else:
                    return None
            elif image_url.startswith('http'):
                # Descargar imagen desde URL
                response = requests.get(image_url, timeout=5)
                if response.status_code == 200:
                    img = PILImage.open(BytesIO(response.content))
                else:
                    return None
            else:
                # Ruta local relativa
                if os.path.exists(image_url):
                    img = PILImage.open(image_url)
                else:
                    return None
                    
            # Procesar imagen
            img = img.convert('RGB')
            img.thumbnail(max_size, PILImage.Resampling.LANCZOS)
            
            # Crear archivo temporal
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
            img.save(temp_file.name, 'JPEG', quality=85)
            temp_file.close()
            
            return temp_file.name
            
        except Exception as e:
            logger.warning(f"Error al procesar imagen {image_url}: {e}")
            return None

    def create_product_grid_layout(self, db: Session, filters: dict = None):
        """Crear layout de productos en formato de cuadrícula moderna"""
        productos = get_productos(db)
        
        if filters:
            productos = self.apply_filters(productos, filters)
            
        elements = []
        
        # Título y información inicial
        elements.extend(self.create_header_section(productos))
        
        # Crear productos en formato de tarjetas
        products_per_row = 2
        current_row = []
        
        for i, producto in enumerate(productos):
            # Crear tarjeta de producto
            product_card = self.create_product_card(producto)
            current_row.append(product_card)
            
            # Si completamos una fila o es el último producto
            if len(current_row) == products_per_row or i == len(productos) - 1:
                # Crear tabla para la fila
                while len(current_row) < products_per_row:
                    current_row.append("")  # Llenar espacios vacíos
                    
                row_table = Table([current_row], colWidths=[3.8*inch, 3.8*inch])
                row_table.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 10),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                    ('TOPPADDING', (0, 0), (-1, -1), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ]))
                
                elements.append(KeepTogether(row_table))
                elements.append(Spacer(1, 15))
                current_row = []
                
        return elements

    def create_product_card(self, producto):
        """Crear tarjeta individual de producto con diseño moderno"""
        card_elements = []
        
        # Contenedor principal de la tarjeta
        card_data = []
        
        # Fila 1: Imagen y información básica
        image_cell = ""
        if producto.imagen:
            image_path = self.download_and_process_image(producto.imagen)
            if image_path:
                try:
                    img = ReportLabImage(image_path, width=60, height=60)
                    image_cell = img
                except:
                    image_cell = Paragraph("📷", self.cell_style)
            else:
                image_cell = Paragraph("📷", self.cell_style)
        else:
            image_cell = Paragraph("📷", self.cell_style)
            
        # Información del producto
        product_info = []
        
        # Nombre del producto (destacado)
        nombre_truncado = producto.nombre[:35] + "..." if len(producto.nombre) > 35 else producto.nombre
        product_info.append(Paragraph(f"<b>{nombre_truncado}</b>", 
                          ParagraphStyle('ProductName', parent=self.cell_style, fontSize=10, fontName='Helvetica-Bold')))
        
        # Marca y categoría
        marca = producto.marca.descripcion if producto.marca else "N/A"
        categoria = producto.categoria.descripcion if producto.categoria else "N/A"
        product_info.append(Paragraph(f"<i>{marca} • {categoria}</i>", 
                          ParagraphStyle('ProductMeta', parent=self.cell_style, fontSize=8, textColor=self.colors['text_light'])))
        
        # Precios
        precio_minorista = f"${producto.precio_minorista:.2f}"
        precio_mayorista = f"${producto.precio_mayorista:.2f}"
        product_info.append(Paragraph(f"<b>Minorista:</b> {precio_minorista}", self.price_style))
        product_info.append(Paragraph(f"<b>Mayorista:</b> {precio_mayorista}", 
                          ParagraphStyle('WholesalePrice', parent=self.price_style, textColor=self.colors['accent'])))
        
        # Stock con color
        stock_color = self.get_stock_color(producto.stock)
        stock_text = f"<b>Stock:</b> {producto.stock}"
        product_info.append(Paragraph(stock_text, 
                          ParagraphStyle('StockInfo', parent=self.cell_style, textColor=stock_color)))
        
        # Crear tabla para la tarjeta
        card_table = Table([
            [image_cell, product_info]
        ], colWidths=[70, 2.5*inch])
        
        card_table.setStyle(TableStyle([
            # Bordes y fondo
            ('BACKGROUND', (0, 0), (-1, -1), self.colors['white']),
            ('BOX', (0, 0), (-1, -1), 1, self.colors['light_gray']),
            ('ROUNDEDCORNERS', [3, 3, 3, 3]),
            
            # Alineación
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            
            # Padding
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        return card_table

    def create_header_section(self, productos):
        """Crear sección de encabezado con estadísticas"""
        elements = []
        
        # Título principal
        title = Paragraph("CATÁLOGO DE PRODUCTOS", self.title_style)
        elements.append(title)
        
        # Información de la empresa
        company_info = Paragraph(
            "<b>VendDly Solutions S.A.</b><br/>"
            "Soluciones Comerciales Integrales<br/>"
            "📞 +593 XX XXX XXXX  •  ✉ info@venddly.com<br/>"
            f"<i>Generado el {datetime.now().strftime('%d de %B de %Y')}</i>",
            self.company_style
        )
        elements.append(company_info)
        
        # Estadísticas en formato moderno
        total_products = len(productos)
        productos_activos = len([p for p in productos if p.estado == 'activo'])
        
        stats_data = [[
            Paragraph(f"<b>{total_products}</b><br/>Total Productos", 
                     ParagraphStyle('Stat', parent=self.cell_style, alignment=TA_CENTER, fontSize=10)),
            Paragraph(f"<b>{productos_activos}</b><br/>Productos Activos", 
                     ParagraphStyle('Stat', parent=self.cell_style, alignment=TA_CENTER, fontSize=10)),
            Paragraph(f"<b>{total_products - productos_activos}</b><br/>Productos Inactivos", 
                     ParagraphStyle('Stat', parent=self.cell_style, alignment=TA_CENTER, fontSize=10))
        ]]
        
        stats_table = Table(stats_data, colWidths=[2.5*inch, 2.5*inch, 2.5*inch])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), self.colors['background']),
            ('BOX', (0, 0), (-1, -1), 1, self.colors['light_gray']),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        
        elements.append(stats_table)
        elements.append(Spacer(1, 30))
        
        return elements

    def get_stock_color(self, stock):
        """Obtener color según el nivel de stock"""
        try:
            stock_num = int(stock) if str(stock).isdigit() else 0
            if stock_num > 10:
                return self.colors['success']
            elif stock_num > 0:
                return self.colors['warning']
            else:
                return self.colors['danger']
        except:
            return self.colors['text']

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

    def generate_catalog_pdf(self, db: Session, filters: dict = None):
        """Generar PDF del catálogo con diseño moderno"""
        try:
            # Crear archivo temporal
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
            temp_filename = temp_file.name
            temp_file.close()

            # Crear documento con márgenes optimizados
            doc = SimpleDocTemplate(
                temp_filename,
                pagesize=A4,
                rightMargin=40,
                leftMargin=40,
                topMargin=80,
                bottomMargin=80
            )

            # Generar elementos del documento
            elements = self.create_product_grid_layout(db, filters)

            # Función para decoraciones de página
            def add_page_decorations(canvas, doc):
                self.create_modern_header(canvas, doc)
                self.create_modern_footer(canvas, doc)

            # Generar PDF
            doc.build(elements, onFirstPage=add_page_decorations, onLaterPages=add_page_decorations)
            
            logger.info(f"PDF moderno generado exitosamente: {temp_filename}")
            return temp_filename

        except Exception as e:
            logger.error(f"Error al generar PDF moderno: {str(e)}")
            raise Exception(f"Error al generar PDF: {str(e)}")

# Instancia global del generador moderno
modern_pdf_generator = ModernCatalogoPDF()

def generate_catalog_pdf(db: Session, filters: dict = None):
    """Función principal para generar PDF moderno del catálogo"""
    return modern_pdf_generator.generate_catalog_pdf(db, filters)