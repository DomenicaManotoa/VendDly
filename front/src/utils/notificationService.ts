import { notification } from 'antd';
import type { NotificationPlacement } from 'antd/es/notification/interface';

// Tipos de notificaciones
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Configuración por defecto
const defaultConfig = {
  placement: 'topRight' as NotificationPlacement,
  duration: 4,
};

// Estilos personalizados para cada tipo
const notificationStyles = {
  success: {
    backgroundColor: '#f6ffed',
    border: '1px solid #b7eb8f'
  },
  error: {
    backgroundColor: '#fff2f0',
    border: '1px solid #ffccc7'
  },
  warning: {
    backgroundColor: '#fffbe6',
    border: '1px solid #ffe58f'
  },
  info: {
    backgroundColor: '#e6f7ff',
    border: '1px solid #91d5ff'
  }
};

class NotificationService {
  // Método genérico para mostrar notificaciones
  private showNotification(
    type: NotificationType,
    message: string,
    description: string,
    duration?: number,
    placement?: NotificationPlacement
  ) {
    notification[type]({
      message,
      description,
      duration: duration || defaultConfig.duration,
      placement: placement || defaultConfig.placement,
      style: notificationStyles[type]
    });
  }

  // Notificaciones de autenticación
  auth = {
    loginSuccess: (username: string) => {
      this.showNotification(
        'success',
        '¡Bienvenido de vuelta!',
        `Hola ${username}, has iniciado sesión correctamente. Redirigiendo...`,
        3
      );
    },

    loginFailed: (reason?: string) => {
      const messages = {
        'credentials': {
          message: 'Credenciales Incorrectas',
          description: 'El RUC empresarial, correo electrónico o contraseña son incorrectos. Por favor, verifica tus datos e intenta nuevamente.'
        },
        'inactive': {
          message: 'Cuenta Inactiva',
          description: 'Tu cuenta está temporalmente inactiva. Por favor, contacta al administrador del sistema para activar tu cuenta.'
        },
        'connection': {
          message: 'Error de Conexión',
          description: 'No se pudo conectar al servidor. Verifica tu conexión a internet y que el servidor esté funcionando.'
        },
        'timeout': {
          message: 'Tiempo de Espera Agotado',
          description: 'La conexión tardó demasiado en responder. Por favor, intenta nuevamente.'
        },
        'server': {
          message: 'Error del Servidor',
          description: 'Hay un problema temporal con el servidor. Por favor, intenta nuevamente en unos minutos.'
        },
        'default': {
          message: 'Error de Autenticación',
          description: 'Ha ocurrido un error durante el inicio de sesión. Si el problema persiste, contacta al soporte técnico.'
        }
      };

      const errorInfo = messages[reason as keyof typeof messages] || messages.default;
      this.showNotification('error', errorInfo.message, errorInfo.description, 6);
    },

    logoutSuccess: (username?: string) => {
      this.showNotification(
        'success',
        'Sesión Cerrada Exitosamente',
        `¡Hasta pronto${username ? `, ${username}` : ''}! Tu sesión se ha cerrado de forma segura.`,
        4
      );
    },

    sessionExpired: () => {
      this.showNotification(
        'error',
        'Sesión Expirada',
        'Tu sesión ha expirado por seguridad. Por favor, inicia sesión nuevamente para continuar.',
        6
      );
    },

    accessDenied: () => {
      this.showNotification(
        'warning',
        'Acceso Denegado',
        'Debes iniciar sesión para acceder a esta página. Serás redirigido al formulario de login.',
        5
      );
    },

    tokenExpired: () => {
      this.showNotification(
        'error',
        'Sesión Expirada',
        'Tu sesión ha caducado por seguridad. Serás redirigido al login para iniciar sesión nuevamente.',
        5
      );
    },

    insufficientPermissions: (requiredRole?: string) => {
      this.showNotification(
        'error',
        'Permisos Insuficientes',
        `No tienes permisos para acceder a esta sección.${requiredRole ? ` Se requiere rol: ${requiredRole}` : ''}`,
        6
      );
    }
  };

  // Notificaciones de red y conectividad
  network = {
    connectionError: () => {
      this.showNotification(
        'error',
        'Error de Conexión',
        'No se pudo conectar al servidor. Verifica tu conexión a internet e intenta nuevamente.',
        6
      );
    },

    timeout: () => {
      this.showNotification(
        'error',
        'Tiempo de Espera Agotado',
        'La petición tardó demasiado en responder. Por favor, intenta nuevamente.',
        5
      );
    },

    serverError: () => {
      this.showNotification(
        'error',
        'Error del Servidor',
        'Hay un problema temporal con el servidor. Por favor, intenta nuevamente en unos minutos.',
        6
      );
    },

    validationError: (details?: string) => {
      this.showNotification(
        'error',
        'Error de Validación',
        details || 'Datos de entrada inválidos. Verifica la información e intenta nuevamente.',
        5
      );
    },

    notFound: () => {
      this.showNotification(
        'error',
        'Recurso No Encontrado',
        'El recurso solicitado no existe o ha sido eliminado.',
        4
      );
    }
  };

  // Notificaciones generales de la aplicación
  app = {
    saveSuccess: (item?: string) => {
      this.showNotification(
        'success',
        'Guardado Exitoso',
        `${item || 'Los datos'} se han guardado correctamente.`,
        3
      );
    },

    deleteSuccess: (item?: string) => {
      this.showNotification(
        'success',
        'Eliminado Exitoso',
        `${item || 'El elemento'} se ha eliminado correctamente.`,
        3
      );
    },

    updateSuccess: (item?: string) => {
      this.showNotification(
        'success',
        'Actualizado Exitoso',
        `${item || 'Los datos'} se han actualizado correctamente.`,
        3
      );
    },

    operationFailed: (operation?: string) => {
      this.showNotification(
        'error',
        'Operación Fallida',
        `No se pudo completar la operación${operation ? `: ${operation}` : ''}. Intenta nuevamente.`,
        4
      );
    },

    confirmRequired: (action: string) => {
      this.showNotification(
        'warning',
        'Confirmación Requerida',
        `Por favor, confirma que deseas ${action}.`,
        4
      );
    },

    processingStarted: (process?: string) => {
      this.showNotification(
        'info',
        'Procesando',
        `${process || 'La operación'} está en proceso. Por favor, espera...`,
        3
      );
    },

    unexpectedError: () => {
      this.showNotification(
        'error',
        'Error Inesperado',
        'Ha ocurrido un error inesperado en la aplicación. Por favor, recarga la página e intenta nuevamente.',
        8
      );
    }
  };

  // Método para notificaciones personalizadas
  custom = (
    type: NotificationType,
    message: string,
    description: string,
    duration?: number,
    placement?: NotificationPlacement
  ) => {
    this.showNotification(type, message, description, duration, placement);
  };

  // Método para cerrar todas las notificaciones
  closeAll = () => {
    notification.destroy();
  };
}

// Exportar una instancia única del servicio
export const notificationService = new NotificationService();

// Exportar también la clase para casos especiales
export { NotificationService };