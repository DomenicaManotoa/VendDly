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

export interface Cliente {
  cod_cliente: number;
  identificacion: string;
  nombre: string;
  direccion: string;
  celular: string;
  tipo_cliente: string;
  razon_social: string;
  sector: string;
  fecha_registro?: string;
  fecha_actualizacion?: string;
}

export interface FormClientesProps {
  cliente: Cliente | null;
  onCancel: () => void;
  onSubmit: (cliente: Usuario) => Promise<void>;
}

export interface Pedidos{
  id_pedido: number;
  estado: string;
  numero_pedido: string;
  fecha_pedido: Date;
  subtotal: number;
  iva: number;
  total: number;
  cod_cliente: number;
}

export interface DetallePedido {
  id_detalle_pedido: number;
  id_pedido: number;
  id_producto: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal_lineal: number;
  subtotal: number;
}