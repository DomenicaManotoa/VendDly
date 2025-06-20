interface User {
  email: string;
  password: string;
  name?: string;
}
const fakeDB: User[] = [];

export const authService = {
  login: async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const user = fakeDB.find(u => u.email === email && u.password === password);
    return user 
      ? { success: true } 
      : { success: false, error: 'Credenciales inválidas' };
  },

  register: async (userData: User): Promise<{ success: boolean; error?: string }> => {
    const exists = fakeDB.some(u => u.email === userData.email);
    if (exists) return { success: false, error: 'Email ya registrado' };
    
    fakeDB.push(userData);
    return { success: true };
  }
};