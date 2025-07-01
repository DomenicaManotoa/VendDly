from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import Categoria

def get_categorias(db: Session):
    return db.query(Categoria).all()

def get_categoria(db: Session, id_categoria: int):
    categoria = db.query(Categoria).filter(Categoria.id_categoria == id_categoria).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return categoria

def create_categoria(db: Session, descripcion: str):
    nueva_categoria = Categoria(descripcion=descripcion)
    db.add(nueva_categoria)
    db.commit()
    db.refresh(nueva_categoria)
    return nueva_categoria

def update_categoria(db: Session, id_categoria: int, descripcion: str):
    categoria = db.query(Categoria).filter(Categoria.id_categoria == id_categoria).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    categoria.descripcion = descripcion
    db.commit()
    db.refresh(categoria)
    return categoria

def delete_categoria(db: Session, id_categoria: int):
    categoria = db.query(Categoria).filter(Categoria.id_categoria == id_categoria).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    db.delete(categoria)
    db.commit()
    return {"mensaje": "Categoría eliminada"}