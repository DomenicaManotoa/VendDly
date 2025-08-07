import axios from '../../../utils/axiosConfig';
import { UsuarioConRol } from '../../../types/types';

export const usuarioService = {
  // Obtener usuarios por rol
  getUsuariosPorRol: async (rol: string): Promise<UsuarioConRol[]> => {
    try {
      const response = await axios.get(`/usuarios/rol/${rol}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios por rol:', error);
      throw error;
    }
  },

  // Obtener todos los usuarios
  getUsuarios: async (): Promise<UsuarioConRol[]> => {
    try {
      const response = await axios.get('/usuarios');
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  }
};