import axios from 'axios';
import { getToken } from '../utils/token';
import { buildApiUrl } from '../utils/apiConfig';

const API_URL = buildApiUrl('/api/chat-mensajes');

// Tipos para request y response
export interface ChatMensajeRequest {
  remitenteId: number;
  destinatarioId: number;
  agenteId: number;
  propiedadId: number;
  titulo: string;
  mensaje: string;
}

export interface ChatMensajeResponse {
  id: number;
  remitenteId: number;
  destinatarioId: number;
  agenteId: number;
  propiedadId: number;
  titulo: string;
  mensaje: string;
  leido: boolean;
  enviadoEn: string;
}

const getAuthHeaders = async () => {
  const token = await getToken();
  return { Authorization: `Bearer ${token}` };
};

export const createChatMessage = async (data: ChatMensajeRequest): Promise<ChatMensajeResponse> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(API_URL, data, { headers });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al enviar mensaje');
  }
};

export const getChatMessageById = async (id: number): Promise<ChatMensajeResponse> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/${id}`, { headers });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'No se pudo obtener el mensaje');
  }
};

export const getAllChatMessages = async (): Promise<ChatMensajeResponse[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(API_URL, { headers });
    return response.data;
  } catch (error: any) {
    throw new Error('No se pudieron obtener los mensajes');
  }
};

export const deleteChatMessage = async (id: number): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    await axios.delete(`${API_URL}/${id}`, { headers });
  } catch (error: any) {
    throw new Error('No se pudo eliminar el mensaje');
  }
};

export const getChatMessagesByPropiedadAgente = async (propiedadId: number, agenteId: number): Promise<ChatMensajeResponse[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/por-propiedad-agente`, {
      headers,
      params: { propiedadId, agenteId },
    });
    return response.data;
  } catch (error: any) {
    throw new Error('No se pudieron obtener los mensajes de la propiedad y agente');
  }
};

export const getChatMessagesByClientePropiedad = async (clienteId: number, propiedadId: number): Promise<ChatMensajeResponse[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/por-cliente-propiedad`, {
      headers,
      params: { clienteId, propiedadId },
    });
    return response.data;
  } catch (error: any) {
    throw new Error('No se pudieron obtener los mensajes del cliente y propiedad');
  }
};

export const getChatMessagesByAgente = async (agenteId: number): Promise<ChatMensajeResponse[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/por-agente/${agenteId}`, { headers });
    return response.data;
  } catch (error: any) {
    throw new Error('No se pudieron obtener los mensajes del agente');
  }
};

export const markChatMessageAsRead = async (id: number): Promise<ChatMensajeResponse> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.patch(`${API_URL}/${id}/leido`, {}, { headers });
    return response.data;
  } catch (error: any) {
    throw new Error('No se pudo marcar el mensaje como leído');
  }
};
