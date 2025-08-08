// Interfaz para el formulario de autenticación
export interface AuthFormProps {
  isLogin?: boolean;
  onSubmit: (values: LoginFormValues) => Promise<void>;
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
  correo?: string;
  contrasena?: string;
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
  rol?: Rol | string;
}

export interface Props {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (user: Usuario) => void;
  userToEdit?: Usuario | null;
  roles: Rol[];
}

// INTERFAZ CLIENTE ACTUALIZADA con nuevo campo
export interface Cliente {
  cod_cliente: string;
  identificacion: string;
  nombre: string;
  direccion: string;
  celular: string;
  correo: string;
  tipo_cliente: string;
  razon_social: string;
  sector: string;
  fecha_registro?: string;
  fecha_actualizacion?: string;
  id_ubicacion_principal?: number | null; // CAMPO CLAVE para ubicación principal
}

export interface FormClientesProps {
  cliente: Cliente | null;
  visible: boolean;
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

// INTERFAZ UBICACION CLIENTE ACTUALIZADA
export interface UbicacionCliente {
  id_ubicacion?: number;
  cod_cliente: string;
  latitud: number;
  longitud: number;
  direccion: string;
  sector: string;
  referencia?: string;
  fecha_registro?: string;
  cliente?: Cliente; // Relación con cliente
  es_principal?: boolean; // NUEVO: Indica si es la ubicación principal del cliente
}

export interface FormUbicacionClienteProps {
  ubicacion: UbicacionCliente | null;
  visible: boolean;
  onCancel: () => void;
  onSubmit: (ubicacion: UbicacionCliente) => Promise<void>;
  clientes: Cliente[];
}

export interface MapaUbicacionProps {
  ubicaciones?: UbicacionCliente[];
  onLocationSelect?: (lat: number, lng: number, address?: string) => void;
  selectedLocation?: { lat: number; lng: number };
  readonly?: boolean;
}

export interface AsignacionRuta {
  id_asignacion?: number;
  identificacion_usuario?: string;
  tipo_usuario?: 'vendedor' | 'transportista';
  cod_cliente?: string;
  id_ubicacion?: number;
  orden_visita?: number;
  // Información adicional de la ubicación
  ubicacion_info?: {
    direccion: string;
    sector: string;
    latitud: number;
    longitud: number;
    referencia?: string;
  };
  // Información del usuario asignado
  usuario?: {
    nombre: string;
    correo?: string;
  };
  // Pedidos asociados (solo para rutas de entrega)
  pedidos?: PedidoRuta[];
}

// Props para selector de ubicaciones
export interface SelectorUbicacionesProps {
  ubicaciones: UbicacionClienteRuta[];
  ubicacionesSeleccionadas: number[];
  onChange: (ubicaciones: number[]) => void;
  tipoRuta: 'venta' | 'entrega';
}

// Interface para mapa de rutas
export interface MapaRutasProps {
  ruta?: Ruta;
  ubicaciones: UbicacionClienteRuta[];
  onUbicacionSelect?: (ubicacion: UbicacionClienteRuta) => void;
  mostrarRuta?: boolean;
}

// Interface para ubicación de cliente en rutas
export interface UbicacionClienteRuta {
  id_ubicacion: number;
  cod_cliente: string;
  direccion: string;
  sector: string;
  latitud: number;
  longitud: number;
  referencia?: string;
  selected?: boolean; // Para marcar si está seleccionada en la ruta
  orden_visita?: number; // Orden de visita en la ruta
}

// Interface para crear/editar ruta
export interface CrearRutaRequest {
  nombre: string;
  tipo_ruta: 'venta' | 'entrega';
  sector: string;
  direccion: string;
  fecha_ejecucion?: string;
  asignaciones?: Omit<AsignacionRuta, 'id_asignacion' | 'ubicacion_info'>[];
}

// Alternativa: Interface específica para creación (sin estado)
export interface CrearRutaData {
  nombre: string;
  tipo_ruta: 'venta' | 'entrega';
  sector: string;
  direccion: string;
  fecha_ejecucion?: string;
  asignaciones?: Omit<AsignacionRuta, 'id_asignacion' | 'ubicacion_info'>[];
}

// Interface para actualizar ruta (todos los campos opcionales)
export interface ActualizarRutaData {
  nombre?: string;
  tipo_ruta?: 'venta' | 'entrega';
  sector?: string;
  direccion?: string;
  estado?: string;
  fecha_ejecucion?: string;
  asignaciones?: Omit<AsignacionRuta, 'id_asignacion' | 'ubicacion_info'>[];
}

// Y agregar en types.tsx:
export interface UsuarioConRol extends Usuario {
  rol: {
    id_rol: number;
    descripcion: string;
  };
}

export interface Ruta {
  id_ruta: number;
  nombre: string;
  sector: string;
  direccion: string;
  tipo_ruta: 'venta' | 'entrega';
  estado: string;
  fecha_creacion: string;
  fecha_ejecucion?: string;
  asignaciones?: AsignacionRuta[];
}

// Interfaces para pedidos en rutas
export interface PedidoRuta {
  id_pedido: number;
  numero_pedido: string;
  fecha_pedido: string;
  cod_cliente: string;
  total: number;
  estado: string;
  cliente_info?: {
    nombre: string;
  };
}

export interface AsignacionConPedidos extends AsignacionRuta {
  pedidos?: PedidoRuta[];
}


// Interface para estadísticas de entregas
export interface EstadisticasEntregas {
  totalRutasEntrega: number;
  rutasEnEjecucion: number;
  rutasCompletadas: number;
  rutasPlanificadas: number;
  rutasCanceladas: number;
  totalParadas: number;
  transportistasAsignados: number;
  sectoresConEntregas: number;
  promedioParadasPorRuta: number;
}

// Interface para resumen de entrega por transportista
export interface ResumenEntregaTransportista {
  identificacion_usuario: string;
  nombre_usuario: string;
  rutasAsignadas: number;
  rutasCompletadas: number;
  rutasEnEjecucion: number;
  totalParadas: number;
  sectoresAtendidos: string[];
}

// Interface para estadísticas de ventas
export interface EstadisticasVentas {
  totalRutasVenta: number;
  rutasEnEjecucion: number;
  rutasCompletadas: number;
  rutasPlanificadas: number;
  rutasCanceladas: number;
  totalVisitasProgramadas: number;
  vendedoresAsignados: number;
  sectoresConVentas: number;
  promedioVisitasPorRuta: number;
}

// Interface para resumen de ventas por vendedor
export interface ResumenVentaVendedor {
  identificacion_usuario: string;
  nombre_usuario: string;
  rutasAsignadas: number;
  rutasCompletadas: number;
  rutasEnEjecucion: number;
  totalVisitasProgramadas: number;
  sectoresAtendidos: string[];
  clientesAsignados: string[];
}

// NUEVAS INTERFACES para el manejo de ubicaciones principales

// Interface para estadísticas de ubicaciones
export interface EstadisticasUbicaciones {
  totalUbicaciones: number;
  totalClientes: number;
  clientesConUbicacionPrincipal: number;
  clientesSinUbicacionPrincipal: number;
  clientesSinUbicaciones: number;
  clientesConMultiplesUbicaciones: number;
  ubicacionesSinReferencia: number;
  ubicacionesPrincipales: number;
  porSector: Record<string, number>;
  promedioUbicacionesPorCliente?: number;
}

// Interface para estadísticas de clientes
export interface EstadisticasClientes {
  totalClientes: number;
  clientesConUbicacionPrincipal: number;
  clientesSinUbicacionPrincipal: number;
  clientesSinUbicaciones: number;
  clientesConMultiplesUbicaciones: number;
  totalUbicaciones: number;
  promedioUbicacionesPorCliente: number;
  porSector: Record<string, number>;
  porTipoCliente: Record<string, number>;
  sectoresConMasClientes: { sector: string; cantidad: number }[];
}

// Interface para verificación de integridad
export interface VerificacionIntegridad {
  clientesSinUbicacionPrincipal: string[];
  clientesConUbicacionPrincipalInvalida: string[];
  clientesSinUbicaciones: string[];
  ubicacionesHuerfanas: number[];
  resumen: string;
}

// Interface para resultado de reparación
export interface ResultadoReparacion {
  reparados: number;
  errores: string[];
  detalles: { codCliente: string; accion: string }[];
}

// Interface para cliente con ubicaciones detalladas
export interface ClienteConUbicaciones extends Cliente {
  ubicaciones: (UbicacionCliente & { es_principal?: boolean })[];
  ubicacion_principal_info?: {
    id_ubicacion: number;
    direccion: string;
    sector: string;
    latitud: number;
    longitud: number;
  };
}

// Interface para resumen de ubicaciones por cliente
export interface ResumenUbicacionesCliente {
  cod_cliente: string;
  nombre_cliente: string;
  total_ubicaciones: number;
  tiene_ubicacion_principal: boolean;
  ubicacion_principal?: {
    id: number;
    direccion: string;
    sector: string;
  };
  ubicaciones: {
    id: number;
    direccion: string;
    sector: string;
    es_principal: boolean;
  }[];
}

// Interface para selector de ubicación principal
export interface SelectorUbicacionPrincipalProps {
  codCliente: string;
  valorSeleccionado?: number;
  onChange: (idUbicacion?: number) => void;
  disabled?: boolean;
}

// Interface para props del dashboard de ubicaciones
export interface DashboardUbicacionesProps {
  onNavegateToUbicaciones?: () => void;
  onNavegateToClientes?: () => void;
}

// Interface para problemas de integridad detectados
export interface ProblemaIntegridad {
  tipo: 'sin_ubicacion' | 'sin_principal' | 'principal_invalida' | 'ubicacion_huerfana';
  codCliente?: string;
  idUbicacion?: number;
  descripcion: string;
  accionSugerida: string;
  gravedad: 'alta' | 'media' | 'baja';
}

// Interface para respuesta del backend al crear ubicación
export interface RespuestaCreacionUbicacion {
  ubicacion: UbicacionCliente;
  ubicacion_principal_establecida: boolean;
  mensaje?: string;
}

// Interface para respuesta del backend al eliminar ubicación
export interface RespuestaEliminacionUbicacion {
  mensaje: string;
  nueva_ubicacion_principal?: number;
  cliente_sin_ubicacion_principal?: boolean;
}

// Interface para configuración de mapa
export interface ConfiguracionMapa {
  centroInicial: [number, number];
  zoomInicial: number;
  mostrarControles: boolean;
  permitirCrearUbicacion: boolean;
  mostrarTodasLasUbicaciones: boolean;
}

// Interface para filtros de ubicaciones
export interface FiltrosUbicaciones {
  sector?: string;
  cliente?: string;
  soloSinUbicacionPrincipal?: boolean;
  soloConMultiplesUbicaciones?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
}

// Tipos de exportación
export type TipoExportacion = 'excel' | 'pdf' | 'csv' | 'json';

// Interface para opciones de exportación
export interface OpcionesExportacion {
  tipo: TipoExportacion;
  incluirUbicaciones: boolean;
  incluirEstadisticas: boolean;
  filtros?: FiltrosUbicaciones;
}

// Actualizar la interface AsignacionRuta existente para incluir información del usuario
export interface AsignacionRuta {
  id_asignacion?: number;
  identificacion_usuario?: string;
  tipo_usuario?: 'vendedor' | 'transportista';
  cod_cliente?: string;
  id_ubicacion?: number;
  orden_visita?: number;
  // Información adicional de la ubicación
  ubicacion_info?: {
    direccion: string;
    sector: string;
    latitud: number;
    longitud: number;
    referencia?: string;
  };
  // AGREGAR: Información del usuario asignado
  usuario?: {
    nombre: string;
    correo?: string;
  };
}

