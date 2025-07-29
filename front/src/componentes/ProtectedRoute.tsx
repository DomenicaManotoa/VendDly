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
          const userRole = currentUser.rol?.descripcion || currentUser.rol;
          if (userRole !== requiredRole) {
            notification.error({
              message: 'Permisos Insuficientes',
              description: `No tienes permisos para acceder a esta sección. Se requiere rol: ${requiredRole}`,
              duration: 6,
              placement: 'topRight',
              style: {
                backgroundColor: '#fff2f0',
                border: '1px solid #ffccc7'
              }
            });
            
            // Redirigir a la página de inicio según el rol del usuario
            const roleRedirects: { [key: string]: string } = {
              'admin': '/home',
              'vendedor': '/vendedor/home',
              'bodeguero': '/bodega/home',
              'facturador': '/facturador/home',
              'transportista': '/transportista/home'
            };
            
            const redirectPath = roleRedirects[userRole.toLowerCase()] || '/home';
            setTimeout(() => {
              window.location.href = redirectPath;
            }, 2000);
            
            return;
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