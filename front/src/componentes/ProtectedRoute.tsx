import { Navigate, useLocation } from 'react-router-dom';
import { notification } from 'antd';
import { authService } from '../auth/auth';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string; // Opcional: para rutas que requieren roles específicos
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const isAuthenticated = authService.isAuthenticated();
        const currentUser = authService.getCurrentUser();

        if (!isAuthenticated) {
          // Determinar el tipo de mensaje según la situación
          const hasExpiredToken = localStorage.getItem('token') ||
            localStorage.getItem('authToken') ||
            localStorage.getItem('access_token');

          if (hasExpiredToken) {
            // Había un token pero ya no es válido
            notification.error({
              message: 'Sesión Expirada',
              description: 'Tu sesión ha expirado por seguridad. Por favor, inicia sesión nuevamente para continuar.',
              duration: 6,
              placement: 'topRight',
              style: {
                backgroundColor: '#fff2f0',
                border: '1px solid #ffccc7'
              }
            });

            // Limpiar tokens inválidos
            authService.logout();
            setShouldRedirect(true);
            return;
          } else {
            // No hay token, acceso directo sin autenticación
            notification.warning({
              message: 'Acceso Denegado',
              description: 'Debes iniciar sesión para acceder a esta página. Serás redirigido al formulario de login.',
              duration: 5,
              placement: 'topRight',
              style: {
                backgroundColor: '#fffbe6',
                border: '1px solid #ffe58f'
              }
            });
          }

          setShouldRedirect(true);
          return;
        }

        // Verificar si el token es válido haciendo una petición al servidor
        const isTokenValid = await authService.isTokenValid();
        if (!isTokenValid) {
          notification.error({
            message: 'Sesión Inválida',
            description: 'Tu sesión no es válida. Por favor, inicia sesión nuevamente.',
            duration: 5,
            placement: 'topRight',
            style: {
              backgroundColor: '#fff2f0',
              border: '1px solid #ffccc7'
            }
          });

          setShouldRedirect(true);
          return;
        }

        // Verificar rol si es requerido
        if (requiredRole && currentUser) {
          let userRole: string | undefined;

          // Obtener el rol del usuario de manera consistente
          if (typeof currentUser.rol === "object" && currentUser.rol?.descripcion) {
            userRole = currentUser.rol.descripcion;
          } else if (typeof currentUser.rol === "string") {
            userRole = currentUser.rol;
          }

          // Verificar si el usuario tiene el rol requerido
          if (!userRole || userRole.toLowerCase() !== requiredRole.toLowerCase()) {
            // Determinar la ruta de redirección basada en el rol actual del usuario
            let correctPath = '/';

            if (userRole) {
              const roleLower = userRole.toLowerCase();
              switch (roleLower) {
                case 'admin':
                  correctPath = '/home';
                  break;
                case 'bodeguero':
                  correctPath = '/bodega/home';
                  break;
                case 'cajero':
                  correctPath = '/facturador/home';
                  break;
                case 'transportista':
                  correctPath = '/transportista/home';
                  break;
                case 'vendedor':
                  correctPath = '/vendedor/home';
                  break;
                default:
                  correctPath = '/';
              }
            }

            notification.warning({
              message: 'Acceso Restringido',
              description: `Esta sección es para usuarios con rol ${requiredRole}. Tu rol actual es ${userRole}. Serás redirigido a tu área correspondiente.`,
              duration: 6,
              placement: 'topRight',
              style: {
                backgroundColor: '#fffbe6',
                border: '1px solid #ffe58f'
              }
            });

            // Redirigir a la ruta correcta según el rol del usuario
            return <Navigate to={correctPath} replace />;
          }
        }

        // Todo está bien, mostrar contenido
        setIsChecking(false);

      } catch (error) {
        console.error('Error verificando autenticación:', error);

        notification.error({
          message: 'Error de Verificación',
          description: 'Hubo un problema verificando tu sesión. Por favor, inicia sesión nuevamente.',
          duration: 5,
          placement: 'topRight',
          style: {
            backgroundColor: '#fff2f0',
            border: '1px solid #ffccc7'
          }
        });

        authService.logout();
        setShouldRedirect(true);
      }
    };

    checkAuthentication();
  }, [location.pathname, requiredRole]);

  // Mostrar loading mientras se verifica
  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#666'
      }}>
        Verificando sesión...
      </div>
    );
  }

  // Redirigir si es necesario
  if (shouldRedirect) {
    console.log('Usuario no autenticado, redirigiendo al login...');
    return <Navigate to="/?message=access-denied" replace />;
  }

  // Mostrar contenido protegido
  return <>{children}</>;
};