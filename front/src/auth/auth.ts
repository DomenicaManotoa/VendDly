import { User } from "types/types";

const fakeDB: User[] = [];

export const authService = {
  login: async (email: string, password: string): Promise<{ success: boolean; error?: string; usuario?: string }> => {
    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email, contrasena: password }),
      });
      if (response.ok) {
        const data = await response.json();
        return { success: true, usuario: data.usuario };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.detail || 'Error de autenticación' };
      }
    } catch (e) {
      return { success: false, error: 'No se pudo conectar al servidor' };
    }
  },

  register: async (userData: User): Promise<{ success: boolean; error?: string }> => {
    const exists = fakeDB.some(u => u.email === userData.email);
    if (exists) return { success: false, error: 'Email ya registrado' };
    
    fakeDB.push(userData);
    return { success: true };
  }
};