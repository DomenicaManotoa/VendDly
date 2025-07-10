from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import Usuario, Rol
from utils.security import hash_password_with_salt, generate_salt

def get_usuarios(db: Session):
    """
    Obtiene todos los usuarios con sus roles incluidos
    """
    try:
        # Usar joinedload para cargar la relación rol
        from sqlalchemy.orm import joinedload
        usuarios = db.query(Usuario).options(joinedload(Usuario.rol)).all()
        return usuarios
    except Exception as e:
        print(f"Error al obtener usuarios: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

def get_usuario(db: Session, identificacion: str):
    """
    Obtiene un usuario específico con su rol incluido
    """
    try:
        from sqlalchemy.orm import joinedload
        usuario = db.query(Usuario).options(joinedload(Usuario.rol)).filter(Usuario.identificacion == identificacion).first()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return usuario
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error al obtener usuario: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

def create_usuario(db: Session, usuario_data: dict):
    """
    Crea un nuevo usuario con salt
    """
    try:
        # Generar salt y hashear la contraseña antes de guardar
        if 'contrasena' in usuario_data:
            salt = generate_salt()
            usuario_data['salt'] = salt
            usuario_data['contrasena'] = hash_password_with_salt(usuario_data['contrasena'], salt)
        
        nuevo_usuario = Usuario(**usuario_data)
        db.add(nuevo_usuario)
        db.commit()
        db.refresh(nuevo_usuario)
        
        # Cargar el rol después de crear
        from sqlalchemy.orm import joinedload
        usuario_con_rol = db.query(Usuario).options(joinedload(Usuario.rol)).filter(Usuario.identificacion == nuevo_usuario.identificacion).first()
        return usuario_con_rol
    except Exception as e:
        db.rollback()
        print(f"Error al crear usuario: {e}")
        raise HTTPException(status_code=500, detail="Error al crear usuario")

def update_usuario(db: Session, identificacion: str, usuario_data: dict):
    """
    Actualiza un usuario existente con salt
    """
    try:
        usuario = db.query(Usuario).filter(Usuario.identificacion == identificacion).first()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Si se está actualizando la contraseña, generar nuevo salt y hashearla
        if 'contrasena' in usuario_data and usuario_data['contrasena']:
            salt = generate_salt()
            usuario_data['salt'] = salt
            usuario_data['contrasena'] = hash_password_with_salt(usuario_data['contrasena'], salt)
        elif 'contrasena' in usuario_data and not usuario_data['contrasena']:
            # Si la contraseña está vacía, no actualizarla
            del usuario_data['contrasena']
        
        for key, value in usuario_data.items():
            setattr(usuario, key, value)
        
        db.commit()
        db.refresh(usuario)
        
        # Cargar el rol después de actualizar
        from sqlalchemy.orm import joinedload
        usuario_con_rol = db.query(Usuario).options(joinedload(Usuario.rol)).filter(Usuario.identificacion == identificacion).first()
        return usuario_con_rol
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error al actualizar usuario: {e}")
        raise HTTPException(status_code=500, detail="Error al actualizar usuario")

def delete_usuario(db: Session, identificacion: str):
    """
    Elimina un usuario
    """
    try:
        usuario = db.query(Usuario).filter(Usuario.identificacion == identificacion).first()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        db.delete(usuario)
        db.commit()
        return {"mensaje": "Usuario eliminado correctamente"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error al eliminar usuario: {e}")
        raise HTTPException(status_code=500, detail="Error al eliminar usuario")