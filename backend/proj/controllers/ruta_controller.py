import json
from fastapi import HTTPException
from sqlalchemy.orm import Session
from shapely.geometry import shape
from models.models import Ruta

def get_rutas(db: Session):
    rutas = db.query(Ruta).all()
    rutas_response = []

    for ruta in rutas:
        latitud = None
        longitud = None

        if ruta.poligono_geojson:
            try:
                geojson = json.loads(ruta.poligono_geojson)
                geometry = shape(geojson)
                centroide = geometry.centroid
                latitud = centroide.y
                longitud = centroide.x
            except Exception as e:
                print(f"Error procesando el polígono de la ruta {ruta.id_ruta}: {e}")

        rutas_response.append({
            "id_ruta": ruta.id_ruta,
            "nombre": ruta.nombre,
            "tipo_ruta": ruta.tipo_ruta,
            "sector": ruta.sector,
            "direccion": ruta.direccion,
            "estado": ruta.estado,
            "latitud": latitud,
            "longitud": longitud
        })

    return rutas_response

def get_ruta(db: Session, id_ruta: int):
    ruta = db.query(Ruta).filter(Ruta.id_ruta == id_ruta).first()
    if not ruta:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    return ruta


def get_rutas_usuario(db: Session, user_id: str):
    """Obtener rutas asignadas a un usuario específico"""
    try:
        rutas = db.query(Ruta).join(AsignacionRuta).filter(
            AsignacionRuta.identificacion_usuario == user_id
        ).all()
        
        resultado = []
        for ruta in rutas:
            ruta_dict = {
                "id_ruta": ruta.id_ruta,
                "nombre": ruta.nombre,
                "tipo_ruta": ruta.tipo_ruta,
                "sector": ruta.sector,
                "direccion": ruta.direccion,
                "estado": ruta.estado,
                "fecha_creacion": ruta.fecha_creacion,
                "fecha_ejecucion": ruta.fecha_ejecucion
            }
            resultado.append(ruta_dict)
        
        return resultado
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener rutas del usuario: {str(e)}")

# Modificar la función create_ruta para usar la nueva validación
def create_ruta(db: Session, ruta_data: dict):
    try:
        asignaciones_data = ruta_data.pop('asignaciones', [])
        
        # Validar asignaciones antes de crear la ruta
        if asignaciones_data:
            validate_assignment_constraints(db, ruta_data, asignaciones_data)
        
        nueva_ruta = Ruta(**ruta_data)
        db.add(nueva_ruta)
        db.flush()
        
        for asignacion_data in asignaciones_data:
            nueva_asignacion = AsignacionRuta(
                id_ruta=nueva_ruta.id_ruta,
                **asignacion_data
            )
            db.add(nueva_asignacion)
        
        db.commit()
        db.refresh(nueva_ruta)
        return nueva_ruta
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al crear ruta: {str(e)}")

def update_ruta(db: Session, id_ruta: int, ruta_data: dict):
    try:
        ruta = db.query(Ruta).filter(Ruta.id_ruta == id_ruta).first()
        if not ruta:
            raise HTTPException(status_code=404, detail="Ruta no encontrada")
        
        asignaciones_data = ruta_data.pop('asignaciones', None)
        
        for key, value in ruta_data.items():
            setattr(ruta, key, value)
        
        if asignaciones_data is not None:
            # Validar nuevas asignaciones
            for asignacion_data in asignaciones_data:
                if asignacion_data.get('identificacion_usuario'):
                    required_role = 'vendedor' if ruta.tipo_ruta == 'venta' else 'transportista'
                    validate_user_role(db, asignacion_data['identificacion_usuario'], required_role)
            
            db.query(AsignacionRuta).filter(AsignacionRuta.id_ruta == id_ruta).delete()
            
            for asignacion_data in asignaciones_data:
                nueva_asignacion = AsignacionRuta(
                    id_ruta=id_ruta,
                    **asignacion_data
                )
                db.add(nueva_asignacion)
        
        db.commit()
        db.refresh(ruta)
        return ruta
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al actualizar ruta: {str(e)}")

def delete_ruta(db: Session, id_ruta: int):
    ruta = db.query(Ruta).filter(Ruta.id_ruta == id_ruta).first()
    if not ruta:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    db.delete(ruta)
    db.commit()
    return {"mensaje": "Ruta eliminada"}
