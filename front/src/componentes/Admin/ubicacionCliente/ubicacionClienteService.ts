import axios from '../../../utils/axiosConfig';
import { UbicacionCliente } from '../../../types/types';

export const ubicacionClienteService = {
  // Obtener todas las ubicaciones
  getUbicaciones: async (): Promise<UbicacionCliente[]> => {
    try {
      const response = await axios.get('/ubicaciones_cliente');
      return response.data;
    } catch (error) {
      console.error('Error al obtener ubicaciones:', error);
      throw error;
    }
  },

  // Obtener una ubicación por ID
  getUbicacion: async (id: number): Promise<UbicacionCliente> => {
    try {
      const response = await axios.get(`/ubicaciones_cliente/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
      throw error;
    }
  },

  // Crear nueva ubicación - ACTUALIZADO para manejar ubicación principal automática
  createUbicacion: async (ubicacion: Omit<UbicacionCliente, 'id_ubicacion' | 'fecha_registro'>): Promise<UbicacionCliente> => {
    try {
      const response = await axios.post('/ubicaciones_cliente', ubicacion);
      
      // El backend ya maneja automáticamente el establecimiento de la ubicación principal
      // si es la primera ubicación del cliente
      console.log('Ubicación creada:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error al crear ubicación:', error);
      throw error;
    }
  },

  // Actualizar ubicación
  updateUbicacion: async (id: number, ubicacion: Partial<UbicacionCliente>): Promise<UbicacionCliente> => {
    try {
      const response = await axios.put(`/ubicaciones_cliente/${id}`, ubicacion);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar ubicación:', error);
      throw error;
    }
  },

  // Eliminar ubicación - ACTUALIZADO para manejar ubicación principal automáticamente
  deleteUbicacion: async (id: number): Promise<void> => {
    try {
      await axios.delete(`/ubicaciones_cliente/${id}`);
      // El backend ya maneja automáticamente la reasignación de ubicación principal
      // si se elimina la ubicación principal actual
    } catch (error) {
      console.error('Error al eliminar ubicación:', error);
      throw error;
    }
  },

  // Obtener ubicaciones por sector
  getUbicacionesPorSector: async (sector: string): Promise<UbicacionCliente[]> => {
    try {
      const ubicaciones = await ubicacionClienteService.getUbicaciones();
      return ubicaciones.filter(u => u.sector.toLowerCase() === sector.toLowerCase());
    } catch (error) {
      console.error('Error al obtener ubicaciones por sector:', error);
      throw error;
    }
  },

  // Obtener ubicaciones por cliente
  getUbicacionesPorCliente: async (codCliente: string): Promise<UbicacionCliente[]> => {
    try {
      const response = await axios.get(`/ubicaciones_cliente/cliente/${codCliente}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener ubicaciones por cliente:', error);
      throw error;
    }
  },

  // Establecer ubicación principal para un cliente - NUEVO MÉTODO
  setUbicacionPrincipal: async (codCliente: string, idUbicacion: number): Promise<{ mensaje: string }> => {
    try {
      const response = await axios.put(`/ubicaciones_cliente/cliente/${codCliente}/principal/${idUbicacion}`);
      return response.data;
    } catch (error) {
      console.error('Error al establecer ubicación principal:', error);
      throw error;
    }
  },

  // Validar si una ubicación puede ser establecida como principal
  validarUbicacionPrincipal: async (codCliente: string, idUbicacion: number): Promise<boolean> => {
    try {
      const ubicacionesCliente = await ubicacionClienteService.getUbicacionesPorCliente(codCliente);
      const ubicacionExiste = ubicacionesCliente.some(u => u.id_ubicacion === idUbicacion);
      return ubicacionExiste;
    } catch (error) {
      console.error('Error al validar ubicación principal:', error);
      return false;
    }
  },

  // Obtener estadísticas de ubicaciones - ACTUALIZADO con información de ubicaciones principales
  getEstadisticasUbicaciones: async () => {
    try {
      const ubicaciones = await ubicacionClienteService.getUbicaciones();
      
      // Obtener información de clientes para verificar ubicaciones principales
      const clientesResponse = await axios.get('/clientes');
      const clientes = clientesResponse.data;
      
      const estadisticas = {
        totalUbicaciones: ubicaciones.length,
        totalClientes: Array.from(new Set(ubicaciones.map(u => u.cod_cliente))).length,
        clientesConUbicacionPrincipal: clientes.filter((c: any) => c.id_ubicacion_principal).length,
        clientesSinUbicacionPrincipal: clientes.filter((c: any) => !c.id_ubicacion_principal).length,
        porSector: {} as Record<string, number>,
        clientesConMultiplesUbicaciones: 0,
        ubicacionesSinReferencia: ubicaciones.filter(u => !u.referencia || u.referencia.trim() === '').length,
        ubicacionesPrincipales: clientes.filter((c: any) => c.id_ubicacion_principal).length
      };

      // Agrupar por sector
      ubicaciones.forEach(ubicacion => {
        const sector = ubicacion.sector || 'Sin sector';
        estadisticas.porSector[sector] = (estadisticas.porSector[sector] || 0) + 1;
      });

      // Contar clientes con múltiples ubicaciones
      const ubicacionesPorCliente = ubicaciones.reduce((acc, ubicacion) => {
        acc[ubicacion.cod_cliente] = (acc[ubicacion.cod_cliente] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      estadisticas.clientesConMultiplesUbicaciones = Object.values(ubicacionesPorCliente)
        .filter(count => count > 1).length;

      return estadisticas;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  },

  // Buscar ubicaciones por texto (dirección, sector, referencia)
  buscarUbicaciones: async (texto: string): Promise<UbicacionCliente[]> => {
    try {
      const ubicaciones = await ubicacionClienteService.getUbicaciones();
      const textoBusqueda = texto.toLowerCase();
      
      return ubicaciones.filter(ubicacion => 
        ubicacion.direccion.toLowerCase().includes(textoBusqueda) ||
        ubicacion.sector.toLowerCase().includes(textoBusqueda) ||
        (ubicacion.referencia && ubicacion.referencia.toLowerCase().includes(textoBusqueda)) ||
        ubicacion.cod_cliente.toLowerCase().includes(textoBusqueda)
      );
    } catch (error) {
      console.error('Error al buscar ubicaciones:', error);
      throw error;
    }
  },

  // NUEVO: Método para sincronizar ubicaciones con clientes
  sincronizarUbicacionesPrincipales: async (): Promise<{ mensaje: string; actualizados: number }> => {
    try {
      const response = await axios.post('/ubicaciones_cliente/sincronizar-principales');
      return response.data;
    } catch (error) {
      console.error('Error al sincronizar ubicaciones principales:', error);
      throw error;
    }
  },

  // NUEVO: Obtener resumen de ubicaciones por cliente
  getResumenUbicacionesPorCliente: async (): Promise<any[]> => {
    try {
      const [ubicaciones, clientes] = await Promise.all([
        ubicacionClienteService.getUbicaciones(),
        axios.get('/clientes').then(res => res.data)
      ]);

      const resumen = clientes.map((cliente: any) => {
        const ubicacionesCliente = ubicaciones.filter(u => u.cod_cliente === cliente.cod_cliente);
        const ubicacionPrincipal = ubicacionesCliente.find(u => u.id_ubicacion === cliente.id_ubicacion_principal);

        return {
          cod_cliente: cliente.cod_cliente,
          nombre_cliente: cliente.nombre,
          total_ubicaciones: ubicacionesCliente.length,
          tiene_ubicacion_principal: !!cliente.id_ubicacion_principal,
          ubicacion_principal: ubicacionPrincipal ? {
            id: ubicacionPrincipal.id_ubicacion,
            direccion: ubicacionPrincipal.direccion,
            sector: ubicacionPrincipal.sector
          } : null,
          ubicaciones: ubicacionesCliente.map(u => ({
            id: u.id_ubicacion,
            direccion: u.direccion,
            sector: u.sector,
            es_principal: u.id_ubicacion === cliente.id_ubicacion_principal
          }))
        };
      });

      return resumen;
    } catch (error) {
      console.error('Error al obtener resumen de ubicaciones por cliente:', error);
      throw error;
    }
  },

  // NUEVO: Verificar integridad de ubicaciones principales
  verificarIntegridadUbicacionesPrincipales: async (): Promise<{
    clientesSinUbicacionPrincipal: string[];
    ubicacionesPrincipalesInvalidas: string[];
    clientesConUbicacionesDisponibles: string[];
  }> => {
    try {
      const [ubicaciones, clientes] = await Promise.all([
        ubicacionClienteService.getUbicaciones(),
        axios.get('/clientes').then(res => res.data)
      ]);

      const resultado = {
        clientesSinUbicacionPrincipal: [] as string[],
        ubicacionesPrincipalesInvalidas: [] as string[],
        clientesConUbicacionesDisponibles: [] as string[]
      };

      clientes.forEach((cliente: any) => {
        const ubicacionesCliente = ubicaciones.filter(u => u.cod_cliente === cliente.cod_cliente);
        
        if (ubicacionesCliente.length > 0) {
          if (!cliente.id_ubicacion_principal) {
            resultado.clientesSinUbicacionPrincipal.push(cliente.cod_cliente);
            resultado.clientesConUbicacionesDisponibles.push(cliente.cod_cliente);
          } else {
            // Verificar que la ubicación principal existe y pertenece al cliente
            const ubicacionPrincipalValida = ubicacionesCliente.some(
              u => u.id_ubicacion === cliente.id_ubicacion_principal
            );
            
            if (!ubicacionPrincipalValida) {
              resultado.ubicacionesPrincipalesInvalidas.push(cliente.cod_cliente);
              resultado.clientesConUbicacionesDisponibles.push(cliente.cod_cliente);
            }
          }
        }
      });

      return resultado;
    } catch (error) {
      console.error('Error al verificar integridad de ubicaciones principales:', error);
      throw error;
    }
  }
};