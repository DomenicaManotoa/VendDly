"""
Script para migrar contraseñas existentes a formato hasheado
IMPORTANTE: Ejecutar este script UNA SOLA VEZ después de implementar el hashing
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from database import SessionLocal
from models.models import Usuario
from utils.security import hash_password

def migrate_passwords():
    """
    Migra todas las contraseñas existentes a formato hasheado
    """
    db = SessionLocal()
    try:
        # Obtener todos los usuarios
        usuarios = db.query(Usuario).all()
        
        print(f"Encontrados {len(usuarios)} usuarios para migrar")
        
        for usuario in usuarios:
            # Verificar si la contraseña ya está hasheada
            # Las contraseñas hasheadas con bcrypt empiezan con '$2b$'
            if not usuario.contrasena.startswith('$2b$'):
                print(f"Migrando contraseña para usuario: {usuario.identificacion}")
                
                # Hashear la contraseña actual
                usuario.contrasena = hash_password(usuario.contrasena)
                
                # Guardar cambios
                db.commit()
                print(f"✓ Contraseña migrada para {usuario.identificacion}")
            else:
                print(f"⚠ Contraseña ya hasheada para {usuario.identificacion}")
        
        print("¡Migración completada exitosamente!")
        
    except Exception as e:
        print(f"Error durante la migración: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_passwords()