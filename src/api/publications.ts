import axios from 'axios';
import { getToken } from '../utils/token';
import { buildApiUrl } from '../utils/apiConfig';

const API_URL = buildApiUrl('/api/publicaciones');

export const createPublication = async (data: any) => {
  const token = await getToken();
  const response = await axios.post(`${API_URL}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getPublicationById = async (id: string) => {
  const token = await getToken();
  const response = await axios.get(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getAllPublications = async () => {
  const token = await getToken();
  const response = await axios.get(`${API_URL}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updatePublication = async (id: string, data: any) => {
  const token = await getToken();
  const response = await axios.put(`${API_URL}/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deletePublication = async (id: string) => {
  const token = await getToken();
  const response = await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getPublicationsByProperty = async (propiedadId: string) => {
  const token = await getToken();
  const response = await axios.get(`${API_URL}/por-propiedad/${propiedadId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getPublicationsByAgent = async (agenteId: string) => {
  const token = await getToken();
  const response = await axios.get(`${API_URL}/por-agente/${agenteId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const addAgentToPublication = async (publicacionId: string, agenteId: string) => {
  const token = await getToken();
  const response = await axios.post(`${API_URL}/${publicacionId}/agentes/${agenteId}`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const removeAgentFromPublication = async (publicacionId: string, agenteId: string) => {
  const token = await getToken();
  const response = await axios.delete(`${API_URL}/${publicacionId}/agentes/${agenteId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Función paginada para publicaciones
export const getPublicacionesPaginadas = async (page: number, size: number) => {
  const token = await getToken();
  const response = await axios.get(`${API_URL}`, {
    params: { page, size },
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data; // Espera un Page<PublicacionResponse> del backend
};
