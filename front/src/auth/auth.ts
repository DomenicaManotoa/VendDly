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
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rucempresarial, 
          correo: email, 
          contrasena: password 
        }),
      });
      
      console.log('Respuesta del servidor:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Datos recibidos del login:', data);
        
        // Guardar el token con nombres consistentes
        if (data.access_token) {
          // Guardar con múltiples nombres para compatibilidad
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('authToken', data.access_token);
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('token_type', data.token_type || 'bearer');
          console.log('Token guardado correctamente:', data.access_token);
        }
        
        // Guardar información del usuario
        if (data.user) {
          localStorage.setItem('user_info', JSON.stringify(data.user));
          console.log('Información del usuario guardada:', data.user);
        }
        
        return { 
          success: true, 
          usuario: data.user?.nombre || 'Usuario',
          access_token: data.access_token,
          token_type: data.token_type
        };
      } else {
        const errorData = await response.json();
        console.error('Error en login:', errorData);
        return { 
          success: false, 
          error: errorData.detail || 'Error de autenticación' 
        };
      }
    } catch (e) {
      console.error('Error en login:', e);
      return { 
        success: false, 
        error: 'No se pudo conectar al servidor' 
      };
    }
  },

  register: async (userData: User): Promise<{ success: boolean; error?: string }> => {
    const exists = fakeDB.some(u => u.email === userData.email);
    if (exists) return { success: false, error: 'Email ya registrado' };
    
    fakeDB.push(userData);
    return { success: true };
  },

  logout: () => {
    // Limpiar todos los tokens
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('user_info');
    console.log('Sesión cerrada, tokens eliminados');
  },

  getToken: () => {
    // Intentar obtener el token con diferentes nombres
    return localStorage.getItem('token') || 
           localStorage.getItem('authToken') || 
           localStorage.getItem('access_token');
  },

  isAuthenticated: () => {
    const token = authService.getToken();
    const isAuth = !!token;
    console.log('Usuario autenticado:', isAuth);
    return isAuth;
  },

  getCurrentUser: () => {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  }
};