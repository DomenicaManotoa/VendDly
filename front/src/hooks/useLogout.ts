import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, message } from 'antd';
import { authService } from '../auth/auth';

export const useLogout = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Obtener información del usuario ANTES de hacer logout
      const currentUser = authService.getCurrentUser();
      const isAuthenticated = authService.isAuthenticated();
      
      if (!isAuthenticated) {
        message.warning('No hay una sesión activa para cerrar.');
        navigate('/', { replace: true });
        return;
      }

      // Cerrar el modal inmediatamente
      setShowLogoutModal(false);
      
      // MOSTRAR NOTIFICACIÓN ANTES de hacer logout (mientras el componente aún existe)
      notification.success({
        message: '🔓 Cerrando Sesión...',
        description: `Cerrando sesión de ${currentUser?.nombre || 'usuario'}. Redirigiendo al login...`,
        duration: 3,
        placement: 'topRight',
        style: {
          backgroundColor: '#f6ffed',
          border: '1px solid #b7eb8f',
          zIndex: 9999
        }
      });

      // También mostrar un message global como respaldo
      message.success(`¡Hasta pronto, ${currentUser?.nombre || 'usuario'}! Sesión cerrada exitosamente.`, 4);
      
      // Esperar un momento para que se vea la notificación ANTES de hacer logout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Ahora sí hacer logout
      authService.logout();
      
      // Redirigir al login
      navigate('/?message=logout', { replace: true });

    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      
      // Notificación de error visible
      notification.error({
        message: '❌ Error al Cerrar Sesión',
        description: 'Hubo un problema, pero la sesión se cerró por seguridad.',
        duration: 4,
        placement: 'topRight',
        style: {
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7',
          zIndex: 9999
        }
      });
      
      message.error('Error al cerrar sesión, pero se limpió por seguridad.');
      
      // Forzar limpieza
      authService.logout();
      
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const showLogoutConfirmation = () => {
    // Verificar si hay sesión activa antes de mostrar confirmación
    if (!authService.isAuthenticated()) {
      message.info('No hay una sesión activa para cerrar.');
      return;
    }
    
    setShowLogoutModal(true);
  };

  const hideLogoutModal = () => {
    if (!isLoggingOut) {
      setShowLogoutModal(false);
    }
  };

  return {
    showLogoutModal,
    isLoggingOut,
    handleLogout,
    showLogoutConfirmation,
    hideLogoutModal,
  };
};