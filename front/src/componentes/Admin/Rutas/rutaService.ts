// Cambiar el archivo completo a:
import axios from '../../../utils/axiosConfig';
import { Ruta, CrearRutaData, ActualizarRutaData, UsuarioConRol, PedidoRuta } from '../../../types/types';
import { authService } from '../../../auth/auth';

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
  // Obtener solo rutas de entrega
  getRutasEntrega: async (): Promise<Ruta[]> => {
    try {
      const todasLasRutas = await rutaService.getRutas();
      return todasLasRutas.filter(ruta => ruta.tipo_ruta === 'entrega');
    } catch (error) {
      console.error('Error al obtener rutas de entrega:', error);
      throw error;
    }
  },

  // Obtener solo rutas de venta
  getRutasVenta: async (): Promise<Ruta[]> => {
    try {
      const todasLasRutas = await rutaService.getRutas();
      return todasLasRutas.filter(ruta => ruta.tipo_ruta === 'venta');
    } catch (error) {
      console.error('Error al obtener rutas de venta:', error);
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

  // Actualizar este método para que use el endpoint correcto:
  getRutasEntregaUsuario: async (): Promise<Ruta[]> => {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error("Usuario no autenticado");

      if (authService.isAdmin()) {
        return await rutaService.getRutasEntregaAdmin();
      }

      // Solo para Transportistas
      const response = await axios.get(`/rutas/entregas/transportista/${user.identificacion}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener rutas de entrega:', error);
      throw error;
    }
  },

  // Método adicional para obtener todas las rutas (solo para administradores)
  getRutasEntregaAdmin: async (): Promise<Ruta[]> => {
    try {
      const response = await axios.get('/rutas/entregas');
      return response.data;
    } catch (error) {
      console.error('Error al obtener todas las rutas de entrega:', error);
      throw error;
    }
  },

  // En rutaService.ts
// Agregar este nuevo método
getRutasVentaUsuario: async (userId: string): Promise<Ruta[]> => {
  try {
    const response = await axios.get(`/rutas/ventas/vendedor/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener rutas de venta del usuario:', error);
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

  // Método para obtener estadísticas de ruta
  getEstadisticasRuta: async (idRuta: number): Promise<any> => {
    try {
      const response = await axios.get(`/rutas/${idRuta}/estadisticas`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas de ruta:', error);
      throw error;
    }
  },

  // Obtener pedido de una ruta de entrega
  getPedidoRuta: async (idRuta: number): Promise<PedidoRuta | null> => {
    try {
      const response = await axios.get(`/rutas/${idRuta}/pedido`);
      // Si la respuesta contiene un mensaje, significa que no hay pedido
      if (response.data.mensaje) {
        return null;
      }
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error al obtener pedido de la ruta:', error);
      throw error;
    }
  },

  // Asignar pedido específico a ruta de entrega
  asignarPedidoRuta: async (idRuta: number, idPedido: number): Promise<any> => {
    try {
      console.log('Enviando solicitud de asignación:', {
        url: `/rutas/${idRuta}/asignar-pedido`,
        data: { id_pedido: idPedido },
        idRuta,
        idPedido
      });

      const response = await axios.post(`/rutas/${idRuta}/asignar-pedido`, {
        id_pedido: idPedido
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Respuesta exitosa del servidor:', response.data);
      return response.data;

    } catch (error: any) {
      console.error('Error detallado en asignación:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
        requestData: error.config?.data
      });

      // Mejorar el manejo de errores específicos
      if (error.response?.status === 400) {
        const errorDetail = error.response.data?.detail || 'Error de validación en el servidor';
        throw new Error(errorDetail);
      } else if (error.response?.status === 404) {
        throw new Error('Ruta o pedido no encontrado');
      } else if (error.response?.status === 403) {
        throw new Error('No tienes permisos para realizar esta acción');
      } else {
        throw new Error(error.response?.data?.detail || error.message || 'Error desconocido');
      }
    }
  },

  // Desasignar pedido de ruta de entrega
  desasignarPedidoRuta: async (idRuta: number): Promise<void> => {
    try {
      console.log('Desasignando pedido de ruta:', idRuta);
      const response = await axios.delete(`/rutas/${idRuta}/desasignar-pedido`);
      console.log('Pedido desasignado exitosamente:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error al desasignar pedido:', error.response?.data || error.message);

      if (error.response?.status === 400) {
        throw new Error(error.response.data?.detail || 'Error de validación');
      } else if (error.response?.status === 404) {
        throw new Error('Ruta no encontrada');
      } else {
        throw new Error(error.response?.data?.detail || error.message || 'Error desconocido');
      }
    }
  },

  // Obtener pedidos disponibles para asignar a rutas
  getPedidosDisponibles: async (): Promise<PedidoRuta[]> => {
    try {
      const response = await axios.get('/pedidos/disponibles-para-ruta');
      return response.data;
    } catch (error) {
      console.error('Error al obtener pedidos disponibles:', error);
      throw error;
    }
  },

};