from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from controllers import auth_controller
from models.models import LoginRequest

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/login")
def login(
    datos: LoginRequest,
    db: Session = Depends(get_db)
):
    return auth_controller.login(db, datos.rucempresarial, datos.correo, datos.contrasena)