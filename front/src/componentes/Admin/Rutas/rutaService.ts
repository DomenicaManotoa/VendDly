// Cambiar el archivo completo a:
import axios from '../../../utils/axiosConfig';
import { Ruta, CrearRutaData, ActualizarRutaData, UsuarioConRol } from '../../../types/types';

export const rutaService = {
  // Obtener todas las rutas
  getRutas: async (): Promise<Ruta[]> => {
    try {
      // Cambiar la ruta para obtener rutas con asignaciones detalladas
      const response = await axios.get('/rutas');
      return response.data;
    } catch (error) {
      console.error('Error al obtener rutas:', error);
      throw error;
    }
  },

  // Obtener una ruta por ID
  getRuta: async (id: number): Promise<Ruta> => {
    try {
      const response = await axios.get(`/rutas/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener ruta:', error);
      throw error;
    }
  },

  // Crear nueva ruta
  createRuta: async (ruta: CrearRutaData): Promise<Ruta> => {
    try {
      const response = await axios.post('/rutas', ruta);
      return response.data;
    } catch (error) {
      console.error('Error al crear ruta:', error);
      throw error;
    }
  },

  // Actualizar ruta
  updateRuta: async (id: number, ruta: ActualizarRutaData): Promise<Ruta> => {
    try {
      const response = await axios.put(`/rutas/${id}`, ruta);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar ruta:', error);
      throw error;
    }
  },

  // Eliminar ruta
  deleteRuta: async (id: number): Promise<void> => {
    try {
      await axios.delete(`/rutas/${id}`);
    } catch (error) {
      console.error('Error al eliminar ruta:', error);
      throw error;
    }
  },

  getUsuariosPorRol: async (rol: string): Promise<UsuarioConRol[]> => {
    try {
      const response = await axios.get(`/usuarios/rol/${rol}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios por rol:', error);
      throw error;
    }
  },

  // Obtener rutas por sector
  getRutasPorSector: async (sector: string): Promise<Ruta[]> => {
    try {
      const rutas = await rutaService.getRutas();
      return rutas.filter(r => r.sector.toLowerCase() === sector.toLowerCase());
    } catch (error) {
      console.error('Error al obtener rutas por sector:', error);
      throw error;
    }
  },

  // Obtener rutas por tipo
  getRutasPorTipo: async (tipo: string): Promise<Ruta[]> => {
    try {
      const rutas = await rutaService.getRutas();
      return rutas.filter(r => r.tipo_ruta.toLowerCase() === tipo.toLowerCase());
    } catch (error) {
      console.error('Error al obtener rutas por tipo:', error);
      throw error;
    }
  },


  // Obtener rutas asignadas a un usuario específico
  getRutasUsuario: async (userId: string): Promise<Ruta[]> => {
    try {
      const response = await axios.get(`/rutas/usuario/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener rutas del usuario:', error);
      throw error;
    }
  },

  // Validar asignación de usuario a ruta
  validarAsignacionUsuario: async (userId: string, tipoRuta: string): Promise<boolean> => {
    try {
      // Verificar rol del usuario
      const userResponse = await axios.get(`/usuarios/${userId}`);
      const usuario = userResponse.data;
      
      const rolRequerido = tipoRuta === 'venta' ? 'Vendedor' : 'Transportista';
      const rolUsuario = typeof usuario.rol === 'object' ? usuario.rol.descripcion : usuario.rol;
      
      return rolUsuario === rolRequerido;
    } catch (error) {
      console.error('Error al validar asignación:', error);
      return false;
    }
  },

};