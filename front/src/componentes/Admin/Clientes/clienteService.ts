import axios from '../../../utils/axiosConfig';
import { Cliente } from '../../../types/types';

export interface ClienteConUbicaciones extends Cliente {
  ubicaciones: {
    id_ubicacion: number;
    latitud: number;
    longitud: number;
    direccion: string;
    sector: string;
    referencia?: string;
    fecha_registro?: string;
    es_principal?: boolean; // NUEVO CAMPO
  }[];
  ubicacion_principal_info?: {
    id_ubicacion: number;
    direccion: string;
    sector: string;
    latitud: number;
    longitud: number;
  };
}

export const clienteService = {
  // Obtener todos los clientes
  getClientes: async (): Promise<Cliente[]> => {
    try {
      const response = await axios.get('/clientes');
      return response.data;
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      throw error;
    }
  },

  // Obtener todos los clientes con sus ubicaciones - ACTUALIZADO
  getClientesConUbicaciones: async (): Promise<ClienteConUbicaciones[]> => {
    try {
      const response = await axios.get('/clientes/con-ubicaciones');
      
      // Procesar la respuesta para marcar la ubicación principal
      const clientesConUbicaciones = response.data.map((cliente: any) => {
        const ubicacionesConMarca = cliente.ubicaciones.map((ubicacion: any) => ({
          ...ubicacion,
          es_principal: ubicacion.id_ubicacion === cliente.id_ubicacion_principal
        }));

        const ubicacionPrincipal = ubicacionesConMarca.find((u: any) => u.es_principal);

        return {
          ...cliente,
          ubicaciones: ubicacionesConMarca,
          ubicacion_principal_info: ubicacionPrincipal ? {
            id_ubicacion: ubicacionPrincipal.id_ubicacion,
            direccion: ubicacionPrincipal.direccion,
            sector: ubicacionPrincipal.sector,
            latitud: ubicacionPrincipal.latitud,
            longitud: ubicacionPrincipal.longitud
          } : undefined
        };
      });

      return clientesConUbicaciones;
    } catch (error) {
      console.error('Error al obtener clientes con ubicaciones:', error);
      throw error;
    }
  },

  // Obtener un cliente por código - ACTUALIZADO
  getCliente: async (codCliente: string): Promise<Cliente> => {
    try {
      const response = await axios.get(`/clientes/${codCliente}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener cliente:', error);
      throw error;
    }
  },

  // Obtener un cliente con sus ubicaciones detalladas
  getClienteConUbicaciones: async (codCliente: string): Promise<ClienteConUbicaciones> => {
    try {
      const [clienteResponse, ubicacionesResponse] = await Promise.all([
        axios.get(`/clientes/${codCliente}`),
        axios.get(`/ubicaciones_cliente/cliente/${codCliente}`)
      ]);

      const cliente = clienteResponse.data;
      const ubicaciones = ubicacionesResponse.data;

      const ubicacionesConMarca = ubicaciones.map((ubicacion: any) => ({
        ...ubicacion,
        es_principal: ubicacion.id_ubicacion === cliente.id_ubicacion_principal
      }));

      const ubicacionPrincipal = ubicacionesConMarca.find((u: any) => u.es_principal);

      return {
        ...cliente,
        ubicaciones: ubicacionesConMarca,
        ubicacion_principal_info: ubicacionPrincipal ? {
          id_ubicacion: ubicacionPrincipal.id_ubicacion,
          direccion: ubicacionPrincipal.direccion,
          sector: ubicacionPrincipal.sector,
          latitud: ubicacionPrincipal.latitud,
          longitud: ubicacionPrincipal.longitud
        } : undefined
      };
    } catch (error) {
      console.error('Error al obtener cliente con ubicaciones:', error);
      throw error;
    }
  },

  // Crear nuevo cliente - ACTUALIZADO para validar ubicación principal
  createCliente: async (cliente: Omit<Cliente, 'fecha_registro' | 'fecha_actualizacion'>): Promise<Cliente> => {
    try {
      // Validar ubicación principal si se proporciona
      if (cliente.id_ubicacion_principal) {
        try {
          const ubicacionResponse = await axios.get(`/ubicaciones_cliente/${cliente.id_ubicacion_principal}`);
          const ubicacion = ubicacionResponse.data;
          
          // Verificar que la ubicación pertenezca al cliente
          if (ubicacion.cod_cliente !== cliente.cod_cliente) {
            throw new Error('La ubicación principal debe pertenecer al cliente');
          }
        } catch (error: any) {
          if (error.response?.status === 404) {
            throw new Error('La ubicación principal especificada no existe');
          }
          throw error;
        }
      }

      const response = await axios.post('/clientes', cliente);
      return response.data;
    } catch (error) {
      console.error('Error al crear cliente:', error);
      throw error;
    }
  },

  // Actualizar cliente - ACTUALIZADO para validar ubicación principal
  updateCliente: async (codCliente: string, cliente: Partial<Cliente>): Promise<Cliente> => {
    try {
      // Validar ubicación principal si se proporciona
      if (cliente.id_ubicacion_principal) {
        try {
          const ubicacionResponse = await axios.get(`/ubicaciones_cliente/${cliente.id_ubicacion_principal}`);
          const ubicacion = ubicacionResponse.data;
          
          // Verificar que la ubicación pertenezca al cliente
          if (ubicacion.cod_cliente !== codCliente) {
            throw new Error('La ubicación principal debe pertenecer al cliente');
          }
        } catch (error: any) {
          if (error.response?.status === 404) {
            throw new Error('La ubicación principal especificada no existe');
          }
          throw error;
        }
      }

      const response = await axios.put(`/clientes/${codCliente}`, cliente);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      throw error;
    }
  },

  // Eliminar cliente - ACTUALIZADO para verificar ubicaciones
  deleteCliente: async (codCliente: string): Promise<void> => {
    try {
      // Verificar si tiene ubicaciones asociadas antes de eliminar
      const ubicacionesResponse = await axios.get(`/ubicaciones_cliente/cliente/${codCliente}`);
      const ubicaciones = ubicacionesResponse.data;

      if (ubicaciones.length > 0) {
        throw new Error(`No se puede eliminar el cliente. Tiene ${ubicaciones.length} ubicación(es) asociada(s). Elimine primero las ubicaciones.`);
      }

      await axios.delete(`/clientes/${codCliente}`);
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      throw error;
    }
  },

  // Establecer ubicación principal para un cliente
  setUbicacionPrincipal: async (codCliente: string, idUbicacion: number): Promise<Cliente> => {
    try {
      // Validar que la ubicación existe y pertenece al cliente
      const ubicacionResponse = await axios.get(`/ubicaciones_cliente/${idUbicacion}`);
      const ubicacion = ubicacionResponse.data;

      if (ubicacion.cod_cliente !== codCliente) {
        throw new Error('La ubicación debe pertenecer al cliente');
      }

      // Actualizar el cliente con la nueva ubicación principal
      const clienteActualizado = await clienteService.updateCliente(codCliente, {
        id_ubicacion_principal: idUbicacion
      });

      return clienteActualizado;
    } catch (error) {
      console.error('Error al establecer ubicación principal:', error);
      throw error;
    }
  },

  // Exportar clientes a Excel
  exportarExcel: async (): Promise<Blob> => {
    try {
      const response = await axios({
        method: 'GET',
        url: '/clientes/exportar-excel',
        responseType: 'blob'
      });
      return new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
    } catch (error) {
      console.error('Error al exportar clientes:', error);
      throw error;
    }
  },

  // Validar si un cliente puede establecer una ubicación como principal
  validarUbicacionPrincipal: async (codCliente: string, idUbicacion: number): Promise<boolean> => {
    try {
      const ubicacionResponse = await axios.get(`/ubicaciones_cliente/${idUbicacion}`);
      const ubicacion = ubicacionResponse.data;
      
      // Verificar que la ubicación pertenezca al cliente
      return ubicacion.cod_cliente === codCliente;
    } catch (error) {
      console.error('Error al validar ubicación principal:', error);
      return false;
    }
  },

  // Obtener estadísticas de clientes - ACTUALIZADO
  getEstadisticasClientes: async () => {
    try {
      const clientesConUbicaciones = await clienteService.getClientesConUbicaciones();
      
      const estadisticas = {
        totalClientes: clientesConUbicaciones.length,
        clientesConUbicacionPrincipal: clientesConUbicaciones.filter(c => c.id_ubicacion_principal).length,
        clientesSinUbicacionPrincipal: clientesConUbicaciones.filter(c => !c.id_ubicacion_principal).length,
        clientesSinUbicaciones: clientesConUbicaciones.filter(c => c.ubicaciones.length === 0).length,
        clientesConMultiplesUbicaciones: clientesConUbicaciones.filter(c => c.ubicaciones.length > 1).length,
        totalUbicaciones: clientesConUbicaciones.reduce((acc, c) => acc + c.ubicaciones.length, 0),
        promedioUbicacionesPorCliente: 0,
        porSector: {} as Record<string, number>,
        porTipoCliente: {} as Record<string, number>,
        sectoresConMasClientes: [] as { sector: string; cantidad: number }[]
      };

      // Calcular promedio de ubicaciones por cliente
      if (estadisticas.totalClientes > 0) {
        estadisticas.promedioUbicacionesPorCliente = 
          estadisticas.totalUbicaciones / estadisticas.totalClientes;
      }

      // Agrupar por sector
      clientesConUbicaciones.forEach(cliente => {
        const sector = cliente.sector || 'Sin sector';
        estadisticas.porSector[sector] = (estadisticas.porSector[sector] || 0) + 1;
      });

      // Agrupar por tipo de cliente
      clientesConUbicaciones.forEach(cliente => {
        const tipo = cliente.tipo_cliente || 'Sin tipo';
        estadisticas.porTipoCliente[tipo] = (estadisticas.porTipoCliente[tipo] || 0) + 1;
      });

      // Obtener sectores con más clientes
      estadisticas.sectoresConMasClientes = Object.entries(estadisticas.porSector)
        .map(([sector, cantidad]) => ({ sector, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5); // Top 5 sectores

      return estadisticas;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  },

  // NUEVO: Reparar ubicaciones principales inconsistentes
  repararUbicacionesPrincipales: async (): Promise<{
    reparados: number;
    errores: string[];
    detalles: { codCliente: string; accion: string }[];
  }> => {
    try {
      const clientesConUbicaciones = await clienteService.getClientesConUbicaciones();
      
      const resultado = {
        reparados: 0,
        errores: [] as string[],
        detalles: [] as { codCliente: string; accion: string }[]
      };

      for (const cliente of clientesConUbicaciones) {
        try {
          // Si el cliente tiene ubicaciones pero no tiene ubicación principal
          if (cliente.ubicaciones.length > 0 && !cliente.id_ubicacion_principal) {
            const primeraUbicacion = cliente.ubicaciones[0];
            
            await clienteService.updateCliente(cliente.cod_cliente, {
              id_ubicacion_principal: primeraUbicacion.id_ubicacion
            });
            
            resultado.reparados++;
            resultado.detalles.push({
              codCliente: cliente.cod_cliente,
              accion: `Establecida ubicación principal: ${primeraUbicacion.direccion}`
            });
          }
          
          // Si tiene ubicación principal pero no existe en sus ubicaciones
          else if (cliente.id_ubicacion_principal && 
                   !cliente.ubicaciones.some(u => u.id_ubicacion === cliente.id_ubicacion_principal)) {
            
            if (cliente.ubicaciones.length > 0) {
              // Asignar la primera ubicación disponible
              const primeraUbicacion = cliente.ubicaciones[0];
              
              await clienteService.updateCliente(cliente.cod_cliente, {
                id_ubicacion_principal: primeraUbicacion.id_ubicacion
              });
              
              resultado.reparados++;
              resultado.detalles.push({
                codCliente: cliente.cod_cliente,
                accion: `Reasignada ubicación principal: ${primeraUbicacion.direccion}`
              });
            } else {
              // No tiene ubicaciones, limpiar ubicación principal
              await clienteService.updateCliente(cliente.cod_cliente, {
                id_ubicacion_principal: null
              });
              
              resultado.reparados++;
              resultado.detalles.push({
                codCliente: cliente.cod_cliente,
                accion: 'Limpiada ubicación principal (sin ubicaciones)'
              });
            }
          }
        } catch (error: any) {
          resultado.errores.push(
            `Error al reparar cliente ${cliente.cod_cliente}: ${error.message}`
          );
        }
      }

      return resultado;
    } catch (error) {
      console.error('Error al reparar ubicaciones principales:', error);
      throw error;
    }
  },

  // NUEVO: Verificar integridad de los datos de clientes y ubicaciones
  verificarIntegridad: async (): Promise<{
    clientesSinUbicacionPrincipal: string[];
    clientesConUbicacionPrincipalInvalida: string[];
    clientesSinUbicaciones: string[];
    ubicacionesHuerfanas: number[];
    resumen: string;
  }> => {
    try {
      const [clientes, ubicaciones] = await Promise.all([
        clienteService.getClientes(),
        axios.get('/ubicaciones_cliente').then(res => res.data)
      ]);

      const resultado = {
        clientesSinUbicacionPrincipal: [] as string[],
        clientesConUbicacionPrincipalInvalida: [] as string[],
        clientesSinUbicaciones: [] as string[],
        ubicacionesHuerfanas: [] as number[],
        resumen: ''
      };

      // Verificar clientes
      clientes.forEach((cliente: Cliente) => {
        const ubicacionesCliente = ubicaciones.filter((u: any) => u.cod_cliente === cliente.cod_cliente);
        
        if (ubicacionesCliente.length === 0) {
          resultado.clientesSinUbicaciones.push(cliente.cod_cliente);
        } else {
          if (!cliente.id_ubicacion_principal) {
            resultado.clientesSinUbicacionPrincipal.push(cliente.cod_cliente);
          } else {
            const ubicacionPrincipalExiste = ubicacionesCliente.some(
              (u: any) => u.id_ubicacion === cliente.id_ubicacion_principal
            );
            
            if (!ubicacionPrincipalExiste) {
              resultado.clientesConUbicacionPrincipalInvalida.push(cliente.cod_cliente);
            }
          }
        }
      });

      // Verificar ubicaciones huérfanas
      ubicaciones.forEach((ubicacion: any) => {
        const clienteExiste = clientes.some((c: Cliente) => c.cod_cliente === ubicacion.cod_cliente);
        if (!clienteExiste) {
          resultado.ubicacionesHuerfanas.push(ubicacion.id_ubicacion);
        }
      });

      // Generar resumen
      const problemas = [
        resultado.clientesSinUbicaciones.length > 0 && `${resultado.clientesSinUbicaciones.length} clientes sin ubicaciones`,
        resultado.clientesSinUbicacionPrincipal.length > 0 && `${resultado.clientesSinUbicacionPrincipal.length} clientes sin ubicación principal`,
        resultado.clientesConUbicacionPrincipalInvalida.length > 0 && `${resultado.clientesConUbicacionPrincipalInvalida.length} clientes con ubicación principal inválida`,
        resultado.ubicacionesHuerfanas.length > 0 && `${resultado.ubicacionesHuerfanas.length} ubicaciones huérfanas`
      ].filter(Boolean);

      resultado.resumen = problemas.length > 0 
        ? `Se encontraron los siguientes problemas: ${problemas.join(', ')}`
        : 'No se encontraron problemas de integridad';

      return resultado;
    } catch (error) {
      console.error('Error al verificar integridad:', error);
      throw error;
    }
  }
};