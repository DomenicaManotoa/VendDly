export interface AuthFormProps {
  isLogin: boolean;
  onSubmit: (values: any) => void;
  loading?: boolean;
}

export interface User {
  email: string;
  password: string;
  name?: string;
}

// Definición de la interfaz Rol
export interface Rol {
  id_rol: number;
  descripcion: string;
}

export interface Usuario {
  identificacion: string;
  rucempresarial?: string;
  nombre: string;
  correo: string;
  celular: string;
  contrasena?: string;
  estado: string;
  fecha_actualizacion?: string;
  id_rol: number;
  rol?: Rol | string; // Puede ser un objeto Rol o string (descripción)
}

export interface Props {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (user: Usuario) => void;
  userToEdit?: Usuario | null;
  roles: Rol[]; // Simplificado usando la interfaz Rol
}