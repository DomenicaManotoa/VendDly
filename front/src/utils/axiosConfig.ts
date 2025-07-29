import axios from 'axios';
import { notification } from 'antd';
import { authService } from '../auth/auth';

// Configurar la URL base
axios.defaults.baseURL = 'http://127.0.0.1:8000';

// Variable para evitar múltiples notificaciones de token expirado
let isRedirecting = false;

// Interceptor para añadir el token automáticamente a todas las peticiones
axios.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Petición axios enviada con token:', token ? 'Sí' : 'No');
    return config;
  },
  (error) => {
    console.error('Error en interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas de error
axios.interceptors.response.use(
  (response) => {
    // Reset del flag si la respuesta es exitosa
    if (response.status === 200 || response.status === 201) {
      isRedirecting = false;
    }
    return response;
  },
  (error) => {
    console.error('Error en interceptor de response:', error);
    
    // Evitar múltiples redirects
    if (isRedirecting) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      isRedirecting = true;
      
      console.log('Token expirado o inválido, manejando logout...');
      
      // Limpiar la sesión
      authService.logout();
      
      // Mostrar notificación específica según el contexto
      const isLoginAttempt = error.config?.url?.includes('/login');
      
      if (!isLoginAttempt) {
        // Error 401 en una petición normal (token expirado)
        notification.error({
          message: 'Sesión Expirada',
          description: 'Tu sesión ha expirado por seguridad. Serás redirigido al login para iniciar sesión nuevamente.',
          duration: 5,
          placement: 'topRight',
          style: {
            backgroundColor: '#fff2f0',
            border: '1px solid #ffccc7'
          }
        });
        
        // Redirigir con mensaje de token expirado
        setTimeout(() => {
          window.location.href = '/?message=token-expired';
        }, 1500);
      }
      
    } else if (error.response?.status === 403) {
      // Error de permisos insuficientes
      notification.error({
        message: 'Permisos Insuficientes',
        description: 'No tienes permisos para realizar esta acción. Contacta al administrador si crees que es un error.',
        duration: 6,
        placement: 'topRight',
        style: {
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7'
        }
      });
      
    } else if (error.response?.status === 404) {
      // Error de recurso no encontrado
      notification.error({
        message: 'Recurso No Encontrado',
        description: 'El recurso solicitado no existe o ha sido eliminado.',
        duration: 4,
        placement: 'topRight',
        style: {
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7'
        }
      });
      
    } else if (error.response?.status === 422) {
      // Error de validación
      const validationErrors = error.response?.data?.detail;
      let errorMessage = 'Datos de entrada inválidos. Verifica la información e intenta nuevamente.';
      
      if (Array.isArray(validationErrors)) {
        const firstError = validationErrors[0];
        errorMessage = `Error en ${firstError.loc?.join(' > ')}: ${firstError.msg}`;
      }
      
      notification.error({
        message: 'Error de Validación',
        description: errorMessage,
        duration: 5,
        placement: 'topRight',
        style: {
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7'
        }
      });
      
    } else if (error.response?.status >= 500) {
      // Error del servidor
      notification.error({
        message: 'Error del Servidor',
        description: 'Hay un problema temporal con el servidor. Por favor, intenta nuevamente en unos minutos.',
        duration: 6,
        placement: 'topRight',
        style: {
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7'
        }
      });
      
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      // Error de red/conectividad
      notification.error({
        message: 'Error de Conexión',
        description: 'No se pudo conectar al servidor. Verifica tu conexión a internet e intenta nuevamente.',
        duration: 6,
        placement: 'topRight',
        style: {
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7'
        }
      });
      
    } else if (error.code === 'TIMEOUT') {
      // Error de timeout
      notification.error({
        message: 'Tiempo de Espera Agotado',
        description: 'La petición tardó demasiado en responder. Por favor, intenta nuevamente.',
        duration: 5,
        placement: 'topRight',
        style: {
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7'
        }
      });
    }
    
    return Promise.reject(error);
  }
);

// Función para reiniciar el flag de redirección (útil para testing)
export const resetRedirectFlag = () => {
  isRedirecting = false;
};

export default axios;