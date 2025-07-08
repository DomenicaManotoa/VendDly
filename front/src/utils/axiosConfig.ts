import axios from 'axios';
import { authService } from '../auth/auth';

// Configurar la URL base
axios.defaults.baseURL = 'http://127.0.0.1:8000';

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
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas de error
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log('Token expirado o inválido, redirigiendo al login...');
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios;