// Configuración de endpoints del backend
const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!envUrl) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL no está configurada en las variables de entorno');
  }
  return envUrl;
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  ENDPOINTS: {
    // Autenticación
    AUTH: '/api/auth',
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    
    // Usuarios
    USERS: '/api/usuarios',
    USER_PROFILE: '/api/usuarios/perfil',
    
    // Propiedades
    PROPERTIES: '/api/propiedades',
    PROPERTIES_FAVORITES: '/api/propiedades/favoritos',
    
    // Ubicaciones (nuevo)
    LOCATIONS_GEOCODE: '/api/ubicaciones/geocodificar',
    LOCATIONS_AUTOCOMPLETE: '/api/ubicaciones/autocompletar',
    
    // Transacciones
    TRANSACTIONS: '/api/transacciones',
    TRANSACTIONS_BY_CLIENT: '/api/transacciones/por-cliente',
    TRANSACTIONS_BY_AGENT: '/api/transacciones/por-agente',
    TRANSACTIONS_BY_PROPERTY: '/api/transacciones/por-propiedad',
    TRANSACTIONS_BY_AGENT_MONTH: '/api/transacciones/por-agente-mes',
    
    // Verificaciones
    VERIFICATION_REQUESTS: '/api/solicitudes-verificacion',
    VERIFICATION_ADMIN: '/api/solicitudes-verificacion/admin',
    
    // Reservas/Visitas
    VISITS: '/api/visitas',
    
    // Chat/Mensajes
    CHAT_MESSAGES: '/api/mensajes-chat',
    
    // Notificaciones
    NOTIFICATIONS: '/api/preferencias-notificacion',
  }
};

// Helper function para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function para obtener la URL base
export const getApiBaseUrl = (): string => {
  return API_CONFIG.BASE_URL;
};

// Headers por defecto
export const getDefaultHeaders = async () => {
  const { getToken } = await import('../utils/token');
  const token = await getToken();
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Configuración de axios por defecto
export const setupAxiosDefaults = async () => {
  const axios = (await import('axios')).default;
  
  axios.defaults.baseURL = API_CONFIG.BASE_URL;
  
  // Interceptor para agregar token automáticamente
  axios.interceptors.request.use(
    async (config) => {
      const { getToken } = await import('../utils/token');
      const token = await getToken();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  // Interceptor para manejar errores de autenticación
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        const { removeToken } = await import('../utils/token');
        await removeToken();
        // Aquí podrías redirigir al login si tienes acceso a navigation
      }
      return Promise.reject(error);
    }
  );
};
