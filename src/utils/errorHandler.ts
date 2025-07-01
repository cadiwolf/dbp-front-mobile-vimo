import { Alert } from 'react-native';

// Tipos de errores basados en el backend GlobalExceptionHandler
export interface ApiError {
  error?: string;
  message?: string;
  [key: string]: any; // Para errores de validación con múltiples campos
}

export interface ValidationErrors {
  [field: string]: string;
}

// Clase para manejar errores de API sin alertas automáticas
export class ApiErrorHandler {
  
  // Maneja errores de ResourceNotFoundException (404)
  static handleResourceNotFound(error: any, resource: string = 'Recurso'): string {
    const message = error?.response?.data?.error || `${resource} no encontrado`;
    return message;
  }

  // Maneja errores de BadRequestException y IllegalArgumentException (400)
  static handleBadRequest(error: any): string {
    const message = error?.response?.data?.error || 'Solicitud inválida';
    return message;
  }

  // Maneja errores de UserAlreadyExistException
  static handleUserAlreadyExists(error: any): string {
    const message = error?.response?.data?.error || 'El usuario ya existe';
    return message;
  }

  // Maneja errores de validación (MethodArgumentNotValidException)
  static handleValidationErrors(error: any): ValidationErrors | string {
    const data = error?.response?.data;
    
    // Si es un error de validación con múltiples campos
    if (data && typeof data === 'object' && !data.error && !data.message) {
      return data as ValidationErrors;
    }
    
    // Si es un error de validación con mensaje único
    return data?.error || 'Error de validación';
  }

  // Maneja errores de servidor interno (500)
  static handleInternalServerError(error: any): string {
    return error?.response?.data?.error || 'Error interno del servidor';
  }

  // Maneja errores de autenticación (401)
  static handleUnauthorized(error: any): string {
    return error?.response?.data?.error || 'Email o contraseña incorrectos';
  }

  // Maneja errores de permisos (403)
  static handleForbidden(error: any): string {
    return error?.response?.data?.error || 'No tiene permisos para realizar esta acción';
  }

  // Función principal para procesar cualquier error de API (sin alertas automáticas)
  static processApiError(error: any, context: string = ''): {
    message: string;
    validationErrors?: ValidationErrors;
    shouldShowAlert?: boolean;
  } {
    console.error(`Error en ${context}:`, error);

    if (!error.response) {
      return {
        message: 'Error de conexión. Verifique su conexión a internet',
        shouldShowAlert: false
      };
    }

    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        // Puede ser BadRequestException, IllegalArgumentException o ValidationException
        if (data && typeof data === 'object' && !data.error && !data.message) {
          // Es un error de validación con múltiples campos
          return {
            message: 'Error de validación en los datos enviados',
            validationErrors: data,
            shouldShowAlert: false
          };
        }
        return {
          message: this.handleBadRequest(error),
          shouldShowAlert: false
        };

      case 401:
        return {
          message: this.handleUnauthorized(error),
          shouldShowAlert: false
        };

      case 403:
        return {
          message: this.handleForbidden(error),
          shouldShowAlert: false
        };

      case 404:
        return {
          message: this.handleResourceNotFound(error),
          shouldShowAlert: false
        };

      case 409:
        // Conflict - típicamente para UserAlreadyExistException
        return {
          message: this.handleUserAlreadyExists(error),
          shouldShowAlert: false
        };

      case 500:
        return {
          message: this.handleInternalServerError(error),
          shouldShowAlert: false
        };

      default:
        return {
          message: data?.error || data?.message || 'Error desconocido',
          shouldShowAlert: false
        };
    }
  }

  // Muestra un alert automáticamente para errores comunes (solo cuando sea explícitamente solicitado)
  static showErrorAlert(error: any, context: string = '', title: string = 'Error') {
    const { message, validationErrors } = this.processApiError(error, context);
    
    if (validationErrors) {
      // Para errores de validación, mostrar el primer error o un resumen
      const firstError = Object.values(validationErrors)[0];
      const fieldName = Object.keys(validationErrors)[0];
      Alert.alert(title, `${fieldName}: ${firstError}`);
    } else {
      Alert.alert(title, message);
    }
  }

  // Nueva función para obtener solo el mensaje de error sin alertas
  static getErrorMessage(error: any, context: string = ''): string {
    const { message, validationErrors } = this.processApiError(error, context);
    
    if (validationErrors) {
      const errorMessages = Object.entries(validationErrors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join('\n');
      return `Error de validación:\n${errorMessages}`;
    }
    
    return message;
  }

  // Procesa errores específicos para operaciones de usuarios
  static processUserError(error: any, operation: 'create' | 'update' | 'delete' | 'fetch' = 'fetch') {
    const context = `${operation} usuario`;
    const result = this.processApiError(error, context);

    // Personalizar mensajes según la operación
    if (result.message.includes('Error interno del servidor')) {
      switch (operation) {
        case 'create':
          result.message = 'No se pudo crear el usuario. Intente nuevamente';
          break;
        case 'update':
          result.message = 'No se pudo actualizar el usuario. Intente nuevamente';
          break;
        case 'delete':
          result.message = 'No se pudo eliminar el usuario. Intente nuevamente';
          break;
        case 'fetch':
          result.message = 'No se pudo cargar la información del usuario';
          break;
      }
    }

    return result;
  }

  // Procesa errores específicos para autenticación
  static processAuthError(error: any, operation: 'login' | 'register' = 'login') {
    const context = operation === 'login' ? 'iniciar sesión' : 'registrar usuario';
    return this.processApiError(error, context);
  }
}

// Función de utilidad para obtener solo el mensaje de error (sin alertas)
export const getApiErrorMessage = (error: any, context?: string) => {
  return ApiErrorHandler.getErrorMessage(error, context);
};

// Función de utilidad para manejar errores en forma simple (sin alertas automáticas)
export const handleApiError = (error: any, context?: string) => {
  return ApiErrorHandler.processApiError(error, context);
};

// Función de utilidad para mostrar alertas de error (solo cuando se solicite explícitamente)
export const showApiErrorAlert = (error: any, context?: string, title?: string) => {
  ApiErrorHandler.showErrorAlert(error, context, title);
};

// Función para obtener información de error formateada para usar con ErrorModal
export const getErrorInfo = (error: any, context?: string) => {
  return ApiErrorHandler.processApiError(error, context);
};
