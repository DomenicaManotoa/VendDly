import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import { authService } from '../auth/auth';
import { AuthForm } from 'componentes/Form';

export const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    
    try {
      const { rucempresarial, email, password } = values;
      console.log('Datos del formulario:', { rucempresarial, email, password: '****' });
      
      const result = await authService.login(rucempresarial, email, password);
      console.log('Resultado del login:', result);

      if (result.success) {
        notification.success({ 
          message: 'Bienvenido',
          description: `Hola ${result.usuario}`,
          duration: 3
        });
        
        // Verificar que el token se guardó correctamente
        const savedToken = authService.getToken();
        console.log('Token guardado verificado:', savedToken ? 'Sí' : 'No');
        
        // Esperar un poco para asegurar que el token se guardó
        setTimeout(() => {
          navigate('/home');
        }, 500);
      } else {
        notification.error({ 
          message: 'Error de autenticación',
          description: result.error || 'Credenciales incorrectas',
          duration: 5
        });
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      notification.error({ 
        message: 'Error', 
        description: 'Error inesperado al iniciar sesión',
        duration: 5
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
      <AuthForm isLogin onSubmit={handleSubmit} loading={loading} />
    </div>
  );
};