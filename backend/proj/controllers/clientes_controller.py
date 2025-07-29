from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import Cliente
import pandas as pd
import io
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils.dataframe import dataframe_to_rows
from datetime import datetime


def get_clientes(db: Session):
    return db.query(Cliente).all()

def get_cliente(db: Session, cod_cliente: str):
    cliente = db.query(Cliente).filter(Cliente.cod_cliente == cod_cliente).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente

def create_cliente(db: Session, cliente_data: dict):
    nuevo_cliente = Cliente(**cliente_data)
    db.add(nuevo_cliente)
    db.commit()
    db.refresh(nuevo_cliente)
    return nuevo_cliente

def update_cliente(db: Session, cod_cliente: str, cliente_data: dict):
    cliente = db.query(Cliente).filter(Cliente.cod_cliente == cod_cliente).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    for key, value in cliente_data.items():
        setattr(cliente, key, value)
    db.commit()
    db.refresh(cliente)
    return cliente

def delete_cliente(db: Session, cod_cliente: str):
    cliente = db.query(Cliente).filter(Cliente.cod_cliente == cod_cliente).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    db.delete(cliente)
    db.commit()
    return {"mensaje": "Cliente eliminado"}


def export_clientes_to_excel(db: Session):
    """
    Exporta los clientes a un archivo Excel con diseño de tabla
    """
    try:
        clientes = db.query(Cliente).all()
        
        if not clientes:
            raise HTTPException(status_code=404, detail="No hay clientes para exportar")
        
        # Preparar datos para el DataFrame
        data = []
        for cliente in clientes:
            # Formatear fechas - manejar valores None
            fecha_registro_str = ""
            if cliente.fecha_registro:
                try:
                    fecha_registro_str = cliente.fecha_registro.strftime("%d/%m/%Y")
                except Exception as e:
                    print(f"Error formateando fecha para cliente {cliente.cod_cliente}: {e}")
                    fecha_registro_str = str(cliente.fecha_registro)
            
            data.append({
                'Código Cliente': cliente.cod_cliente or '',
                'Identificación': cliente.identificacion or '',
                'Nombre': cliente.nombre or '',
                'Dirección': cliente.direccion or '',
                'Celular': cliente.celular or '',
                'Correo': cliente.correo or '',
                'Tipo Cliente': cliente.tipo_cliente or '',
                'Razón Social': cliente.razon_social or '',
                'Sector': cliente.sector or '',
                'Fecha Registro': fecha_registro_str
            })
        
        # Crear DataFrame
        df = pd.DataFrame(data)
        
        # Crear archivo Excel con diseño profesional
        wb = Workbook()
        ws = wb.active
        ws.title = "Lista de Clientes"
        
        # Configurar estilos
        header_font = Font(bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
        header_alignment = Alignment(horizontal="center", vertical="center")
        
        # Estilo para las celdas de datos
        data_alignment = Alignment(horizontal="left", vertical="center")
        thin_border = Border(
            left=Side(style='thin'),
            right=Side(style='thin'),
            top=Side(style='thin'),
            bottom=Side(style='thin')
        )
        
        # Agregar título principal - corregir el merge de celdas
        ws.merge_cells('A1:J1')  # Cambiar a J1 porque tenemos 10 columnas
        title_cell = ws['A1']
        title_cell.value = f"LISTA DE CLIENTES - {datetime.now().strftime('%d/%m/%Y %H:%M')}"
        title_cell.font = Font(bold=True, size=14)
        title_cell.alignment = Alignment(horizontal="center", vertical="center")
        title_cell.fill = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")
        
        # Agregar una fila vacía
        ws.append([])
        
        # Agregar encabezados
        headers = list(df.columns)
        ws.append(headers)
        
        # Aplicar estilo a los encabezados
        for col_num, header in enumerate(headers, 1):
            cell = ws.cell(row=3, column=col_num)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = header_alignment
            cell.border = thin_border
        
        # Agregar datos
        for row_num, row_data in enumerate(df.values, 4):
            for col_num, value in enumerate(row_data, 1):
                cell = ws.cell(row=row_num, column=col_num)
                cell.value = value
                cell.alignment = data_alignment
                cell.border = thin_border
                
                # Aplicar color alternado a las filas
                if row_num % 2 == 0:
                    cell.fill = PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid")
        
        # Ajustar ancho de columnas
        column_widths = {
            'A': 15,  # Código Cliente
            'B': 15,  # Identificación
            'C': 25,  # Nombre
            'D': 30,  # Dirección
            'E': 15,  # Celular
            'F': 25,  # Correo
            'G': 15,  # Tipo Cliente
            'H': 25,  # Razón Social
            'I': 20,  # Sector
            'J': 15   # Fecha Registro
        }
        
        for col_letter, width in column_widths.items():
            ws.column_dimensions[col_letter].width = width
        
        # Agregar información de resumen al final
        last_row = len(df) + 5
        ws.cell(row=last_row, column=1, value="Total de clientes:").font = Font(bold=True)
        ws.cell(row=last_row, column=2, value=len(df)).font = Font(bold=True)
        
        # Crear el archivo en memoria
        excel_buffer = io.BytesIO()
        wb.save(excel_buffer)
        excel_buffer.seek(0)
        
        # Retornar los bytes del archivo
        return excel_buffer.getvalue()
        
    except Exception as e:
        print(f"Error detallado al exportar clientes a Excel: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al generar archivo Excel: {str(e)}")