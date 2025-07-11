"""
Script para migrar contraseñas existentes a formato hasheado con salt
IMPORTANTE: Ejecutar este script UNA SOLA VEZ después de implementar el salting
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from database import SessionLocal
from models.models import Usuario
from utils.security import hash_password_with_salt, generate_salt

def migrate_passwords_with_salt():
    """
    Migra todas las contraseñas existentes a formato hasheado con salt
    """
    db = SessionLocal()
    try:
        # Obtener todos los usuarios que no tienen salt o tienen contraseñas sin hashear
        usuarios = db.query(Usuario).filter(
            (Usuario.salt == None) | (Usuario.salt == '')
        ).all()
        
        print(f"Encontrados {len(usuarios)} usuarios para migrar con salt")
        
        for usuario in usuarios:
            print(f"Migrando usuario: {usuario.identificacion}")
            
            # Si la contraseña no está hasheada (no empieza con $2b$)
            if not usuario.contrasena.startswith('$2b$'):
                print(f"  - Contraseña en texto plano detectada")
                # Generar salt y hashear la contraseña original
                salt = generate_salt()
                usuario.salt = salt
                usuario.contrasena = hash_password_with_salt(usuario.contrasena, salt)
                
                # Guardar cambios
                db.commit()
                print(f"  ✓ Contraseña migrada con salt para {usuario.identificacion}")
            else:
                print(f"  - Contraseña ya hasheada, solo añadiendo salt")
                # La contraseña ya está hasheada, pero necesita salt para futuras verificaciones
                # NOTA: Esto requiere que el usuario cambie su contraseña la próxima vez
                usuario.salt = generate_salt()
                db.commit()
                print(f"  ✓ Salt añadido para {usuario.identificacion} (requiere cambio de contraseña)")
        
        print("¡Migración con salt completada exitosamente!")
        
    except Exception as e:
        print(f"Error durante la migración: {str(e)}")
        db.rollback()
    finally:
        db.close()

def migrate_only_plaintext_passwords():
    """
    Migra solo las contraseñas que están en texto plano (más seguro)
    """
    db = SessionLocal()
    try:
        # Obtener todos los usuarios
        usuarios = db.query(Usuario).all()
        
        print(f"Revisando {len(usuarios)} usuarios para migración selectiva")
        
        for usuario in usuarios:
            # Solo migrar si la contraseña NO está hasheada
            if not usuario.contrasena.startswith('$2b$'):
                print(f"Migrando contraseña en texto plano para: {usuario.identificacion}")
                
                # Generar salt y hashear la contraseña
                salt = generate_salt()
                usuario.salt = salt
                usuario.contrasena = hash_password_with_salt(usuario.contrasena, salt)
                
                db.commit()
                print(f"✓ Contraseña migrada con salt para {usuario.identificacion}")
            else:
                print(f"⚠ Contraseña ya hasheada para {usuario.identificacion}, no se modifica")
        
        print("¡Migración selectiva completada exitosamente!")
        
    except Exception as e:
        print(f"Error durante la migración: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Seleccione el tipo de migración:")
    print("1. Migrar todas las contraseñas (añade salt a todas)")
    print("2. Migrar solo contraseñas en texto plano (recomendado)")
    
    choice = input("Ingrese su opción (1 o 2): ")
    
    if choice == "1":
        migrate_passwords_with_salt()
    elif choice == "2":
        migrate_only_plaintext_passwords()
    else:
        print("Opción no válida")