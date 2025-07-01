import axios from 'axios';
import { getToken } from '../utils/token';
import { buildApiUrl } from '../utils/apiConfig';

export type EstadoPropiedad = 'DISPONIBLE' | 'RESERVADO' | 'VENDIDO' | 'ALQUILADO';
export type TipoPropiedad = 'DEPARTAMENTO' | 'CASA' | 'TERRENO';

export interface PropertyRequest {
  titulo: string;
  descripcion: string;
  direccion: string;
  tipo: TipoPropiedad;
  metrosCuadrados: number;
  precio: number;
  estado: EstadoPropiedad;
  propietarioId: number;
  imagenes?: string; // URLs separadas por coma
}

export interface PropertyResponse extends PropertyRequest {
  id: number;
  verificada: boolean;
  creadoEn: string;
}

const API_URL = buildApiUrl('/api/propiedades');

async function authHeader() {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const createProperty = async (data: PropertyRequest) => {
  const headers = await authHeader();
  const response = await axios.post<PropertyResponse>(`${API_URL}`, data, { headers });
  return response.data;
};

export const getPropertyById = async (id: number) => {
  const headers = await authHeader();
  const response = await axios.get<PropertyResponse>(`${API_URL}/${id}`, { headers });
  return response.data;
};

export const getAllProperties = async () => {
  const response = await axios.get<PropertyResponse[]>(`${API_URL}`);
  return response.data;
};

export const updateProperty = async (id: number, data: PropertyRequest) => {
  const headers = await authHeader();
  const response = await axios.put<PropertyResponse>(`${API_URL}/${id}`, data, { headers });
  return response.data;
};

export const deleteProperty = async (id: number) => {
  const headers = await authHeader();
  const response = await axios.delete(`${API_URL}/${id}`, { headers });
  return response.data;
};

export const getPropertiesByOwner = async (propietarioId: number) => {
  const headers = await authHeader();
  const response = await axios.get<PropertyResponse[]>(`${API_URL}/por-propietario/${propietarioId}`, { headers });
  return response.data;
};

export const getPropertiesByEstado = async (estado: EstadoPropiedad) => {
  const response = await axios.get<PropertyResponse[]>(`${API_URL}/por-estado`, { params: { estado } });
  return response.data;
};

export const getPropertiesByTipo = async (tipo: TipoPropiedad) => {
  const response = await axios.get<PropertyResponse[]>(`${API_URL}/por-tipo`, { params: { tipo } });
  return response.data;
};

export const getPropertiesByOwnerAndEstado = async (propietarioId: number, estado: EstadoPropiedad) => {
  const headers = await authHeader();
  const response = await axios.get<PropertyResponse[]>(`${API_URL}/por-propietario-estado`, { params: { propietarioId, estado }, headers });
  return response.data;
};

export const getVerifiedProperties = async () => {
  const response = await axios.get<PropertyResponse[]>(`${API_URL}/verificadas`);
  return response.data;
};

export const getUnverifiedProperties = async () => {
  const headers = await authHeader();
  const response = await axios.get<PropertyResponse[]>(`${API_URL}/no-verificadas`, { headers });
  return response.data;
};

export const validatePropertyAddress = async (direccion: string) => {
  const headers = await authHeader();
  const response = await axios.post(`${API_URL}/validar-direccion`, null, { headers, params: { direccion } });
  return response.data;
};

export const autocompletePropertyAddress = async (input: string) => {
  const headers = await authHeader();
  const response = await axios.get(`${API_URL}/autocompletar`, { headers, params: { input } });
  return response.data;
};

export const getProperties = async (filters: any = {}) => {
  const response = await axios.get<PropertyResponse[]>(`${API_URL}`, { params: filters });
  return response.data;
};
