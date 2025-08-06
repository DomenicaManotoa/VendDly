import axios from '../../../utils/axiosConfig';
import { Ruta } from '../../../types/types';

export const rutaService = {
  // Obtener todas las rutas
  getRutas: async (): Promise<Ruta[]> => {
    try {
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
  createRuta: async (ruta: Omit<Ruta, 'id_ruta' | 'fecha_creacion'>): Promise<Ruta> => {
    try {
      const response = await axios.post('/rutas', ruta);
      return response.data;
    } catch (error) {
      console.error('Error al crear ruta:', error);
      throw error;
    }
  },

  // Actualizar ruta
  updateRuta: async (id: number, ruta: Partial<Ruta>): Promise<Ruta> => {
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
  }
};