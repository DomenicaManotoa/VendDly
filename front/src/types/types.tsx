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

export interface Usuario {
  identificacion: string;
  rucempresarial?: string;
  nombre: string;
  correo: string;
  celular: string;
  contrasena: string;
  estado: string;
  fecha_actualizacion?: string;
  id_rol: number;
  rol?: string;
}

export interface Props {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (user: Usuario) => void;
  userToEdit?: Usuario | null;
  roles: { id_rol: number; descripcion: string }[];
}
