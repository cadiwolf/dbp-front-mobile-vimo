import axios from 'axios';
import { getToken } from '../utils/token';
import { buildApiUrl } from '../utils/apiConfig';

const API_URL = buildApiUrl('/api/solicitudes-verificacion');

// Tipos basados en tu backend
export type EstadoSolicitud = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface SolicitudVerificacionRequest {
  usuarioId: number;
  documentoAdjunto: string;
  comentarios?: string;
}

export interface SolicitudVerificacionResponse {
  id: number;
  usuarioId: number;
  estado: EstadoSolicitud;
  documentoAdjunto: string;
  comentarios?: string;
  adminAprobadorId?: number;
  fechaAprobacion?: string;
  fechaSolicitud: string;
}

// Crear solicitud de verificación
export const createVerificationRequest = async (data: SolicitudVerificacionRequest) => {
  const token = await getToken();
  const response = await axios.post<SolicitudVerificacionResponse>(`${API_URL}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Obtener solicitud por ID
export const getVerificationRequestById = async (id: number) => {
  const token = await getToken();
  const response = await axios.get<SolicitudVerificacionResponse>(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Listar solicitudes por usuario
export const getVerificationRequestsByUser = async (usuarioId: number) => {
  const token = await getToken();
  const response = await axios.get<SolicitudVerificacionResponse[]>(`${API_URL}/usuario/${usuarioId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Actualizar estado de la solicitud (solo para administradores)
export const updateVerificationRequestStatus = async (
  id: number, 
  estado: EstadoSolicitud, 
  adminId: number, 
  comentarios?: string
) => {
  const token = await getToken();
  const params = new URLSearchParams();
  params.append('estado', estado);
  params.append('adminId', adminId.toString());
  if (comentarios) {
    params.append('comentarios', comentarios);
  }
  
  const response = await axios.put<SolicitudVerificacionResponse>(
    `${API_URL}/${id}/estado?${params.toString()}`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
