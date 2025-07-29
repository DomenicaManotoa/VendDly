// Interfaz para el formulario de autenticación
export interface AuthFormProps {
  isLogin?: boolean;
  onSubmit: (values: LoginFormValues) => Promise<void>; // Cambiado de any a Promise<void>
  loading: boolean;
}

// Valores del formulario de login
export interface LoginFormValues {
  rucempresarial: string;
  email: string;
  password: string;
}

// Interfaz para usuarios
export interface User {
  id?: string;
  identificacion?: string;
  nombre: string;
  email: string;
  rucempresarial?: string;
  password?: string;
  estado?: 'activo' | 'inactivo';
  rol?: string | number;
  id_rol?: number;
  correo?: string; // Alias para email
  contrasena?: string; // Alias para password
}

// Respuesta del servicio de login
export interface LoginResponse {
  success: boolean;
  error?: string;
  usuario?: string;
  access_token?: string;
  token_type?: string;
  user?: User;
}

// Respuesta del endpoint de login del backend
export interface BackendLoginResponse {
  access_token: string;
  token_type: string;
  user: {
    identificacion: string;
    nombre: string;
    correo: string;
    rucempresarial: string;
    estado: string;
    rol: number;
  };
}

// Interfaz para el contexto de autenticación
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (rucempresarial: string, email: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  isAuthenticated: () => boolean;
  isLoading: boolean;
}

// Props para rutas protegidas
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

// Props para el hook de logout
export interface LogoutHookReturn {
  showLogoutModal: boolean;
  isLoggingOut: boolean;
  handleLogout: () => Promise<void>;
  showLogoutConfirmation: () => void;
  hideLogoutModal: () => void;
}

// Interfaz para errores de API
export interface ApiError {
  detail: string;
  status?: number;
  code?: string;
}

// Interfaz para la respuesta de validación del backend
export interface ValidationError {
  loc: string[];
  msg: string;
  type: string;
}

// Configuración de notificaciones
export interface NotificationConfig {
  message: string;
  description: string;
  duration?: number;
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  style?: React.CSSProperties;
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
  cod_cliente: string;  // Cambiado de number a string
  identificacion: string;
  nombre: string;
  direccion: string;
  celular: string;
  correo: string;  // Añadido
  tipo_cliente: string;
  razon_social: string;
  sector: string;
  fecha_registro?: string;
  fecha_actualizacion?: string;
}

export interface FormClientesProps {
  cliente: Cliente | null;
  visible: boolean; // Añade esta línea
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

// types.tsx (actualización)
export interface Producto {
  id_producto: number;
  nombre: string;
  id_marca: number;
  stock: string;
  precio_mayorista: number;
  precio_minorista: number;
  id_categoria: number;
  iva: number;
  estado: string;
  imagen: string | null;
  marca?: Marca;
  categoria?: Categoria;
}

export interface Marca {
  id_marca: number;
  descripcion: string;
}

export interface Categoria {
  id_categoria: number;
  descripcion: string;
}