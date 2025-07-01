import axios from 'axios';
import { getToken } from '../utils/token';
import { buildApiUrl } from '../utils/apiConfig';

const API_URL = buildApiUrl('/api');

// Crear una reserva de visita
export const scheduleVisit = async (propertyId: string, date: string, message: string) => {
  const token = await getToken();
  const response = await axios.post(
    `${API_URL}/reservaVisita`,
    { propertyId, date, message },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// Obtener reserva por ID
export const getVisitById = async (id: string) => {
  const token = await getToken();
  const response = await axios.get(`${API_URL}/reservaVisita/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Listar todas las reservas
export const getAllVisits = async () => {
  const token = await getToken();
  const response = await axios.get(`${API_URL}/reservaVisita`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Actualizar reserva
export const updateVisit = async (id: string, data: any) => {
  const token = await getToken();
  const response = await axios.put(`${API_URL}/reservaVisita/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Eliminar reserva
export const deleteVisit = async (id: string) => {
  const token = await getToken();
  const response = await axios.delete(`${API_URL}/reservaVisita/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Listar reservas por propiedad
export const getVisitsByProperty = async (propertyId: string) => {
  const token = await getToken();
  const response = await axios.get(`${API_URL}/reservaVisita/propiedad/${propertyId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Listar reservas por cliente
export const getVisitsByClient = async (clientId: string) => {
  const token = await getToken();
  const response = await axios.get(`${API_URL}/reservaVisita/cliente/${clientId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Listar reservas por agente
export const getVisitsByAgent = async (agentId: string) => {
  const token = await getToken();
  const response = await axios.get(`${API_URL}/reservaVisita/agente/${agentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Listar reservas por propiedad y fecha
export const getVisitsByPropertyAndDate = async (propertyId: string, date: string) => {
  const token = await getToken();
  const response = await axios.get(`${API_URL}/reservaVisita/propiedad/${propertyId}/fecha/${date}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Confirmar asistencia a la visita
export const confirmVisitAttendance = async (id: string) => {
  const token = await getToken();
  const response = await axios.post(`${API_URL}/reservaVisita/${id}/confirmar`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
