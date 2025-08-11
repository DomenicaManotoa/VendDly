import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { notification, message } from 'antd';
import { authService } from '../auth/auth';
import { AuthForm } from 'componentes/Form';

export const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const formRef = useRef<any>(null);

  // Mostrar notificación si viene de logout o acceso denegado
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const message_param = urlParams.get('message');

    if (message_param === 'logout') {
      // Limpiar cualquier notificación previa
      notification.destroy();
      message.destroy();

      // Esperar un momento para que el componente se monte completamente
      setTimeout(() => {
        // Notificación principal
        notification.success({
          message: '✅ Sesión Cerrada Exitosamente',
          description: 'Has cerrado sesión de forma segura. ¡Hasta pronto!',
          duration: 6,
          placement: 'topRight',
          style: {
            backgroundColor: '#f6ffed',
            border: '2px solid #52c41a',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(82, 196, 26, 0.15)'
          }
        });

        // Message adicional como respaldo
        message.success('🔓 Sesión cerrada correctamente', 4);

        // Limpiar URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 300);

    } else if (message_param === 'access-denied') {
      setTimeout(() => {
        notification.warning({
          message: '⚠️ Acceso Denegado',
          description: 'Tu sesión ha expirado o no tienes permisos. Inicia sesión nuevamente.',
          duration: 5,
          placement: 'topRight',
          style: {
            backgroundColor: '#fffbe6',
            border: '2px solid #faad14',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(250, 173, 20, 0.15)'
          }
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 300);

    } else if (message_param === 'token-expired') {
      setTimeout(() => {
        notification.error({
          message: '🔒 Sesión Expirada',
          description: 'Tu sesión caducó por seguridad. Inicia sesión nuevamente.',
          duration: 5,
          placement: 'topRight',
          style: {
            backgroundColor: '#fff2f0',
            border: '2px solid #ff4d4f',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(255, 77, 79, 0.15)'
          }
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 300);
    }
  }, [location]);

  const handleSubmit = async (values: any) => {
    setLoading(true);

    try {
      const { rucempresarial, email, password } = values;
      console.log('Datos del formulario:', { rucempresarial, email, password: '****' });

      const result = await authService.login(rucempresarial, email, password);
      console.log('Resultado del login:', result);

      if (result.success) {
        // ✅ Notificación de bienvenida
        notification.success({
          message: `🎉 ¡Bienvenido de vuelta!`,
          description: `Hola ${result.usuario}, accediendo al sistema...`,
          duration: 3,
          placement: 'topRight',
          style: {
            backgroundColor: '#f6ffed',
            border: '2px solid #52c41a',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(82, 196, 26, 0.15)'
          }
        });

        message.success(`Bienvenido, ${result.usuario}!`, 3);

        // Obtener el usuario actual para verificar el rol
        const user = authService.getCurrentUser();
        let redirectPath = '/home'; // Default para Admin

        if (user?.rol) {
          if (typeof user.rol === "object" && user.rol.descripcion) {
            const rolDescripcion = user.rol.descripcion.toLowerCase();

            switch (rolDescripcion) {
              case 'admin':
                redirectPath = '/home';
                break;
              case 'bodeguero':
                redirectPath = '/bodega/home';
                break;
              case 'facturador':
                redirectPath = '/facturador/home';
                break;
              case 'transportista':
                redirectPath = '/transportista/home';
                break;
              case 'vendedor':
                redirectPath = '/vendedor/home';
                break;
              default:
                redirectPath = '/home'; // Default para Admin
            }
          } else if (typeof user.rol === "string") {
            const rolString = user.rol.toLowerCase();

            switch (rolString) {
              case 'admin':
                redirectPath = '/home';
                break;
              case 'bodeguero':
                redirectPath = '/bodega/home';
                break;
              case 'facturador':
                redirectPath = '/facturador/home';
                break;
              case 'transportista':
                redirectPath = '/transportista/home';
                break;
              case 'vendedor':
                redirectPath = '/vendedor/home';
                break;
              default:
                redirectPath = '/home'; // Default para Admin
            }
          }
        }

        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 1000);

      } else {
        // Login falló
        if (formRef.current?.incrementFailedAttempts) {
          formRef.current.incrementFailedAttempts();
        }

        // Notificaciones de error
        if (result.error?.includes('Credenciales incorrectas') ||
          result.error?.includes('Usuario no encontrado') ||
          result.error?.includes('Contraseña incorrecta')) {
          notification.error({
            message: '❌ Credenciales Incorrectas',
            description: 'RUC, email o contraseña incorrectos. Verifica e intenta nuevamente.',
            duration: 6,
            placement: 'topRight',
            style: {
              backgroundColor: '#fff2f0',
              border: '2px solid #ff4d4f',
              borderRadius: '8px'
            }
          });
        } else {
          notification.error({
            message: '❌ Error de Autenticación',
            description: result.error || 'Error durante el inicio de sesión.',
            duration: 6,
            placement: 'topRight',
            style: {
              backgroundColor: '#fff2f0',
              border: '2px solid #ff4d4f',
              borderRadius: '8px'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error);

      if (formRef.current?.incrementFailedAttempts) {
        formRef.current.incrementFailedAttempts();
      }

      notification.error({
        message: '💥 Error Inesperado',
        description: 'Error inesperado. Recarga la página e intenta nuevamente.',
        duration: 8,
        placement: 'topRight',
        style: {
          backgroundColor: '#fff2f0',
          border: '2px solid #ff4d4f',
          borderRadius: '8px'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
      <AuthForm ref={formRef} isLogin onSubmit={handleSubmit} loading={loading} />
    </div>
  );
};