import axios from 'axios';
import { getToken } from '../utils/token';
import { API_CONFIG } from '../utils/apiConfig';
import { ApiErrorHandler } from '../utils/errorHandler';

const API_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}`;

// Tipos basados en tu backend
export type Roles = 'ADMIN' | 'PROPIETARIO' | 'AGENTE' | 'CLIENTE';

export interface UsuarioRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
  rol?: Roles;
  documentoVerificacion?: string;
}

export interface UsuarioResponse {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  rol: Roles;
  activo: boolean;
  verificado: boolean;
  documentoVerificacion?: string;
  creadoEn: string;
}

// Crear usuario
export const createUser = async (data: UsuarioRequest): Promise<UsuarioResponse> => {
  try {
    const token = await getToken();
    const response = await axios.post<UsuarioResponse>(`${API_URL}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    const errorInfo = ApiErrorHandler.processUserError(error, 'create');
    throw { ...error, processedError: errorInfo };
  }
};

// Obtener usuario por ID
export const getUserById = async (id: number): Promise<UsuarioResponse> => {
  try {
    const token = await getToken();
    const response = await axios.get<UsuarioResponse>(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    const errorInfo = ApiErrorHandler.processUserError(error, 'fetch');
    throw { ...error, processedError: errorInfo };
  }
};

// Listar todos los usuarios (solo admin)
export const getAllUsers = async (): Promise<UsuarioResponse[]> => {
  try {
    const token = await getToken();
    const response = await axios.get<UsuarioResponse[]>(`${API_URL}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    const errorInfo = ApiErrorHandler.processUserError(error, 'fetch');
    throw { ...error, processedError: errorInfo };
  }
};

// Actualizar usuario
export const updateUser = async (id: number, data: UsuarioRequest): Promise<UsuarioResponse> => {
  try {
    const token = await getToken();
    const response = await axios.put<UsuarioResponse>(`${API_URL}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    const errorInfo = ApiErrorHandler.processUserError(error, 'update');
    throw { ...error, processedError: errorInfo };
  }
};

// Eliminar usuario
export const deleteUser = async (id: number): Promise<void> => {
  try {
    const token = await getToken();
    await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error: any) {
    const errorInfo = ApiErrorHandler.processUserError(error, 'delete');
    throw { ...error, processedError: errorInfo };
  }
};

// Buscar usuario por email
export const getUserByEmail = async (email: string): Promise<UsuarioResponse> => {
  try {
    const token = await getToken();
    const response = await axios.get<UsuarioResponse>(`${API_URL}/por-email`, {
      params: { email },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    const errorInfo = ApiErrorHandler.processUserError(error, 'fetch');
    throw { ...error, processedError: errorInfo };
  }
};

// Listar usuarios por rol (solo admin)
export const getUsersByRole = async (rol: Roles): Promise<UsuarioResponse[]> => {
  try {
    const token = await getToken();
    const response = await axios.get<UsuarioResponse[]>(`${API_URL}/por-rol`, {
      params: { rol },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    const errorInfo = ApiErrorHandler.processUserError(error, 'fetch');
    throw { ...error, processedError: errorInfo };
  }
};

// Buscar usuarios por nombre
export const searchUsersByName = async (nombre: string): Promise<UsuarioResponse[]> => {
  try {
    const token = await getToken();
    const response = await axios.get<UsuarioResponse[]>(`${API_URL}/buscar-nombre`, {
      params: { nombre },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    const errorInfo = ApiErrorHandler.processUserError(error, 'fetch');
    throw { ...error, processedError: errorInfo };
  }
};

// Listar usuarios activos
export const getActiveUsers = async (): Promise<UsuarioResponse[]> => {
  try {
    const token = await getToken();
    const response = await axios.get<UsuarioResponse[]>(`${API_URL}/activos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    const errorInfo = ApiErrorHandler.processUserError(error, 'fetch');
    throw { ...error, processedError: errorInfo };
  }
};

// Función de utilidad para obtener el nombre completo del usuario
export const getFullName = (user: UsuarioResponse): string => {
  return `${user.nombre} ${user.apellido}`;
};

// Función de utilidad para obtener el texto del rol en español
export const getRoleDisplayName = (role: Roles): string => {
  const roleNames = {
    ADMIN: 'Administrador',
    PROPIETARIO: 'Propietario',
    AGENTE: 'Agente Inmobiliario',
    CLIENTE: 'Cliente'
  };
  return roleNames[role] || role;
};

// Función de utilidad para obtener el color del rol
export const getRoleColor = (role: Roles): string => {
  const roleColors = {
    ADMIN: '#dc3545',      // Rojo
    PROPIETARIO: '#fd7e14', // Naranja
    AGENTE: '#007bff',     // Azul
    CLIENTE: '#28a745'     // Verde
  };
  return roleColors[role] || '#6c757d';
};

// Función de utilidad para obtener el icono del rol
export const getRoleIcon = (role: Roles): string => {
  const roleIcons = {
    ADMIN: '👑',
    PROPIETARIO: '🏠',
    AGENTE: '🤝',
    CLIENTE: '👤'
  };
  return roleIcons[role] || '👤';
};
