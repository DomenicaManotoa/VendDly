import { User } from "types/types";

const fakeDB: User[] = [];

export const authService = {
  login: async (rucempresarial: string, email: string, password: string): Promise<{
    success: boolean;
    error?: string;
    usuario?: string;
    access_token?: string;
    token_type?: string;
  }> => {
    try {
      console.log('Enviando petición de login...');

      // Mostrar indicador de carga más específico
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rucempresarial,
          correo: email,
          contrasena: password
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('Respuesta del servidor:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Datos recibidos del login:', data);

        // Validar que los datos necesarios estén presentes
        if (!data.access_token) {
          console.error('Token de acceso no recibido del servidor');
          return {
            success: false,
            error: 'Error en la respuesta del servidor: token no recibido'
          };
        }

        // Guardar el token con nombres consistentes
        try {
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('authToken', data.access_token);
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('token_type', data.token_type || 'bearer');
          console.log('Token guardado correctamente:', data.access_token.substring(0, 20) + '...');
        } catch (storageError) {
          console.error('Error guardando token en localStorage:', storageError);
          return {
            success: false,
            error: 'Error guardando la sesión. Verifica que el navegador permita localStorage.'
          };
        }

        // Guardar información del usuario
        if (data.user) {
          try {
            localStorage.setItem('user_info', JSON.stringify(data.user));
            console.log('Información del usuario guardada:', data.user);
          } catch (storageError) {
            console.error('Error guardando información del usuario:', storageError);
            // No es crítico, continuar con el login
          }
        }

        return {
          success: true,
          usuario: data.user?.nombre || 'Usuario',
          access_token: data.access_token,
          token_type: data.token_type
        };

      } else {
        // Manejar diferentes códigos de error HTTP
        let errorMessage = 'Error de autenticación';

        try {
          const errorData = await response.json();
          console.error('Error en login:', errorData);

          // Mapear errores específicos del backend
          if (response.status === 401) {
            errorMessage = errorData.detail || 'Credenciales incorrectas';
          } else if (response.status === 422) {
            errorMessage = 'Datos de entrada inválidos';
          } else if (response.status === 500) {
            errorMessage = 'Error interno del servidor';
          } else {
            errorMessage = errorData.detail || `Error del servidor (${response.status})`;
          }
        } catch (parseError) {
          console.error('Error parseando respuesta de error:', parseError);
          errorMessage = `Error del servidor (${response.status})`;
        }

        return {
          success: false,
          error: errorMessage
        };
      }

    } catch (error: any) {
      console.error('Error en login:', error);

      // Manejar diferentes tipos de errores
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Timeout: La petición tardó demasiado en responder'
        };
      } else if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
        return {
          success: false,
          error: 'No se pudo conectar al servidor. Verifica tu conexión a internet.'
        };
      } else if (error.message?.includes('fetch')) {
        return {
          success: false,
          error: 'Error de conexión con el servidor'
        };
      } else {
        return {
          success: false,
          error: 'Error inesperado durante el login'
        };
      }
    }
  },

  register: async (userData: User): Promise<{ success: boolean; error?: string }> => {
    const exists = fakeDB.some(u => u.email === userData.email);
    if (exists) return { success: false, error: 'Email ya registrado' };

    fakeDB.push(userData);
    return { success: true };
  },

  logout: () => {
    try {
      // Obtener información del usuario antes de limpiar
      const userInfo = authService.getCurrentUser();
      console.log(`Cerrando sesión para usuario: ${userInfo?.nombre || 'Desconocido'}`);

      // Limpiar todos los tokens y datos
      const itemsToRemove = [
        'token',
        'authToken',
        'access_token',
        'token_type',
        'user_info',
        'refresh_token',
        'remember_me',
        'last_activity'
      ];

      itemsToRemove.forEach(item => {
        try {
          localStorage.removeItem(item);
          sessionStorage.removeItem(item);
        } catch (error) {
          console.warn(`Error removiendo ${item} del storage:`, error);
        }
      });

      console.log('Sesión cerrada, todos los datos eliminados');

    } catch (error) {
      console.error('Error durante logout:', error);
      // Forzar limpieza en caso de error
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (clearError) {
        console.error('Error limpiando storage:', clearError);
      }
    }
  },

  getToken: () => {
    try {
      // Intentar obtener el token con diferentes nombres
      return localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('access_token') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('authToken') ||
        sessionStorage.getItem('access_token');
    } catch (error) {
      console.error('Error obteniendo token:', error);
      return null;
    }
  },

  isAuthenticated: () => {
    try {
      const token = authService.getToken();
      const isAuth = !!token;
      console.log('Usuario autenticado:', isAuth);

      // Verificación adicional: si no hay token, limpiar storage
      if (!isAuth) {
        authService.logout();
        return false;
      }

      // Verificar si el token no está vacío o corrupto
      if (token.length < 10) {
        console.warn('Token parece corrupto, limpiando sesión');
        authService.logout();
        return false;
      }

      return true;

    } catch (error) {
      console.error('Error verificando autenticación:', error);
      authService.logout();
      return false;
    }
  },

  // Método para verificar si el token aún es válido
  isTokenValid: async (): Promise<boolean> => {
    const token = authService.getToken();
    if (!token) {
      console.log('No hay token para validar');
      return false;
    }

    try {
      console.log('Validando token con el servidor...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

      const response = await fetch('http://localhost:8000/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('Token válido');

        // Actualizar información del usuario si es necesario
        try {
          const userData = await response.json();
          localStorage.setItem('user_info', JSON.stringify(userData));
        } catch (error) {
          console.warn('Error actualizando info del usuario:', error);
        }

        return true;
      } else {
        console.log('Token inválido, respuesta del servidor:', response.status);
        // Token inválido, limpiar
        authService.logout();
        return false;
      }

    } catch (error: any) {
      console.error('Error verificando token:', error);

      if (error.name === 'AbortError') {
        console.warn('Timeout verificando token');
        // En caso de timeout, asumir que el token sigue siendo válido
        // para evitar logout forzoso por problemas de red
        return true;
      }

      // Solo hacer logout si es un error definitivo (no de red)
      if (error.message?.includes('401') || error.message?.includes('403')) {
        authService.logout();
        return false;
      }

      // Para otros errores de red, asumir que el token sigue válido
      return true;
    }
  },

  getCurrentUser: () => {
    try {
      const userInfo = localStorage.getItem('user_info') ||
        sessionStorage.getItem('user_info');

      if (!userInfo) {
        return null;
      }

      const parsedUser = JSON.parse(userInfo);

      // Validar que el objeto del usuario tenga las propiedades esperadas
      if (!parsedUser.identificacion && !parsedUser.correo) {
        console.warn('Información del usuario corrupta, limpiando...');
        authService.logout();
        return null;
      }

      return parsedUser;

    } catch (error) {
      console.error('Error obteniendo información del usuario:', error);
      // Limpiar datos corruptos
      try {
        localStorage.removeItem('user_info');
        sessionStorage.removeItem('user_info');
      } catch (removeError) {
        console.error('Error removiendo datos corruptos:', removeError);
      }
      return null;
    }
  },

  getUserRole: (): string | null => {
    try {
      const user = authService.getCurrentUser();
      if (!user?.rol) {
        return null;
      }

      // Obtener el rol de manera consistente
      if (typeof user.rol === "object" && user.rol.descripcion) {
        return user.rol.descripcion;
      } else if (typeof user.rol === "string") {
        return user.rol;
      }

      return null;
    } catch (error) {
      console.error('Error obteniendo rol del usuario:', error);
      return null;
    }
  },

  // Método para verificar si el usuario tiene un rol específico
  hasRole: (roleName: string): boolean => {
    const userRole = authService.getUserRole();
    return userRole?.toLowerCase() === roleName.toLowerCase();
  },

  getHomeRouteByRole: (): string => {
    const userRole = authService.getUserRole();
    if (!userRole) return '/';

    switch (userRole) {
      case 'Admin':
        return '/home';
      case 'Bodeguero':
        return '/bodega/home';
      case 'Cajero':
        return '/facturador/home';
      case 'Transportista':
        return '/transportista/home';
      case 'Vendedor':
        return '/vendedor/home';
      default:
        return '/home'; // Default para Admin
    }
  },

  // Método para refrescar el token (si implementas refresh tokens)
  refreshToken: async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        return false;
      }

      const response = await fetch('http://localhost:8000/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Guardar el nuevo token
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('authToken', data.access_token);
        localStorage.setItem('access_token', data.access_token);

        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }

        console.log('Token refrescado exitosamente');
        return true;
      } else {
        console.log('Error refrescando token');
        authService.logout();
        return false;
      }

    } catch (error) {
      console.error('Error refrescando token:', error);
      return false;
    }
  },

  // Método para actualizar la actividad del usuario
  updateLastActivity: () => {
    try {
      const now = new Date().getTime().toString();
      localStorage.setItem('last_activity', now);
    } catch (error) {
      console.warn('Error actualizando última actividad:', error);
    }
  },

  // Método para verificar inactividad
  checkInactivity: (maxInactiveMinutes: number = 30): boolean => {
    try {
      const lastActivity = localStorage.getItem('last_activity');
      if (!lastActivity) {
        authService.updateLastActivity();
        return false;
      }

      const now = new Date().getTime();
      const lastActivityTime = parseInt(lastActivity);
      const inactiveTime = now - lastActivityTime;
      const maxInactiveTime = maxInactiveMinutes * 60 * 1000; // convertir a ms

      return inactiveTime > maxInactiveTime;
    } catch (error) {
      console.error('Error verificando inactividad:', error);
      return false;
    }
  }
};