from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import Factura, DetalleFactura, Cliente, Producto
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import tempfile

def get_facturas(db: Session):
    return db.query(Factura).all()

def get_factura(db: Session, id_factura: int):
    factura = db.query(Factura).filter(Factura.id_factura == id_factura).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return factura

def create_factura(db: Session, factura_data: dict):
    nueva_factura = Factura(**factura_data)
    db.add(nueva_factura)
    db.commit()
    db.refresh(nueva_factura)
    return nueva_factura

def update_factura(db: Session, id_factura: int, factura_data: dict):
    factura = db.query(Factura).filter(Factura.id_factura == id_factura).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    for key, value in factura_data.items():
        setattr(factura, key, value)
    db.commit()
    db.refresh(factura)
    return factura

def delete_factura(db: Session, id_factura: int):
    factura = db.query(Factura).filter(Factura.id_factura == id_factura).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    db.delete(factura)
    db.commit()
    return {"mensaje": "Factura eliminada"}

def generate_factura_pdf(db: Session, id_factura: int):
    factura = db.query(Factura).filter(Factura.id_factura == id_factura).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    cliente = factura.cliente if hasattr(factura, 'cliente') else None
    detalles = factura.detalles if hasattr(factura, 'detalles') else []

    styles = getSampleStyleSheet()
    style_title = ParagraphStyle(
        'VENDLY',
        parent=styles['Heading1'],
        fontSize=22,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#365314'),
        spaceAfter=10
    )
    style_header = ParagraphStyle(
        'FACTURA',
        parent=styles['Normal'],
        fontSize=12,
        alignment=TA_LEFT,
        textColor=colors.HexColor('#365314'),
        spaceAfter=6
    )
    style_table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_CENTER,
        textColor=colors.white
    )
    style_table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1F2937')
    )

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    doc = SimpleDocTemplate(temp_file.name, pagesize=A4, rightMargin=20, leftMargin=20, topMargin=20, bottomMargin=20)
    elements = []

    elements.append(Paragraph("FACTURA", style_title))
    elements.append(Spacer(1, 12))

    empresa_info = [
        Paragraph("<b>VendDly Solutions</b>", style_header),
        Paragraph("RUC: 1234567890001", style_header),
        Paragraph("Dirección: Av. Principal y Secundaria", style_header),
        Paragraph("Teléfono: 0999999999", style_header),
        Spacer(1, 8)
    ]
    elements.extend(empresa_info)

    datos_factura = [
        [Paragraph("<b>Número de Factura:</b>", style_header), str(getattr(factura, "numero_factura", factura.id_factura))],
        [Paragraph("<b>Fecha de Emisión:</b>", style_header), factura.fecha_emision.strftime("%d/%m/%Y") if getattr(factura, "fecha_emision", None) else ""],
        [Paragraph("<b>Cliente:</b>", style_header), cliente.nombre if cliente else ""],
        [Paragraph("<b>CI/RUC:</b>", style_header), cliente.cod_cliente if cliente else ""],
        [Paragraph("<b>Dirección:</b>", style_header), cliente.direccion if cliente else ""],
    ]
    datos_table = Table(datos_factura, colWidths=[110, 300])
    datos_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 2),
    ]))
    elements.append(datos_table)
    elements.append(Spacer(1, 16))

    table_data = [
        [
            Paragraph("<b>Cant.</b>", style_table_header),
            Paragraph("<b>Producto</b>", style_table_header),
            Paragraph("<b>P. Unitario</b>", style_table_header),
            Paragraph("<b>Subtotal</b>", style_table_header)
        ]
    ]
    for det in detalles:
        producto = det.producto if hasattr(det, 'producto') else None
        table_data.append([
            Paragraph(str(getattr(det, "cantidad", "")), style_table_cell),
            Paragraph(producto.nombre if producto else "", style_table_cell),
            Paragraph(f"${getattr(det, 'precio_unitario', 0):.2f}", style_table_cell),
            Paragraph(f"${getattr(det, 'subtotal_lineal', 0):.2f}", style_table_cell)
        ])

    detalles_table = Table(table_data, colWidths=[40, 220, 80, 80])
    detalles_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#84CC16')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('TOPPADDING', (0,0), (-1,0), 8),
    ]))
    elements.append(detalles_table)
    elements.append(Spacer(1, 16))

    totales_data = [
        ["", "Subtotal:", f"${getattr(factura, 'subtotal', 0):.2f}"],
        ["", "IVA:", f"${getattr(factura, 'iva', 0):.2f}"],
        ["", "Total:", f"${getattr(factura, 'total', 0):.2f}"],
    ]
    totales_table = Table(totales_data, colWidths=[220, 80, 80])
    totales_table.setStyle(TableStyle([
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ('FONTNAME', (1,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 11),
        ('TEXTCOLOR', (1,2), (2,2), colors.HexColor('#365314')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(totales_table)

    elements.append(Spacer(1, 24))
    elements.append(Paragraph("Gracias por su compra.", styles['Normal']))

    doc.build(elements)
    return temp_file.name