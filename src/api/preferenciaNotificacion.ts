import axios from 'axios';
import { getToken } from '../utils/token';
import { buildApiUrl } from '../utils/apiConfig';

export type TipoBusqueda = 'POR_UBICACION' | 'POR_PROXIMIDAD' | 'AMBAS';
export type TipoTransaccion = 'VENTA' | 'ALQUILER';

export interface PreferenciaNotificacionRequest {
  usuarioId: number;
  regionInteres?: string;
  distritoInteres?: string;
  regionUsuario?: string;
  distritoUsuario?: string;
  radioKm?: number;
  latitudCentro?: number;
  longitudCentro?: number;
  tipoBusqueda?: TipoBusqueda;
  tipo: TipoTransaccion;
  activa?: boolean;
}

export interface PreferenciaNotificacionResponse extends PreferenciaNotificacionRequest {
  id: number;
}

const API_URL = buildApiUrl('/api/preferencias-notificacion');

async function authHeader() {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const crearPreferencia = async (data: PreferenciaNotificacionRequest) => {
  const headers = await authHeader();
  const res = await axios.post<PreferenciaNotificacionResponse>(API_URL, data, { headers });
  return res.data;
};

export const obtenerPreferencia = async (id: number) => {
  const headers = await authHeader();
  const res = await axios.get<PreferenciaNotificacionResponse>(`${API_URL}/${id}`, { headers });
  return res.data;
};

export const listarPreferencias = async () => {
  const headers = await authHeader();
  const res = await axios.get<PreferenciaNotificacionResponse[]>(API_URL, { headers });
  return res.data;
};

export const listarPreferenciasPorUsuario = async (usuarioId: number) => {
  const headers = await authHeader();
  const res = await axios.get<PreferenciaNotificacionResponse[]>(`${API_URL}/por-usuario/${usuarioId}`, { headers });
  return res.data;
};

export const actualizarPreferencia = async (id: number, data: PreferenciaNotificacionRequest) => {
  const headers = await authHeader();
  const res = await axios.put<PreferenciaNotificacionResponse>(`${API_URL}/${id}`, data, { headers });
  return res.data;
};

export const eliminarPreferencia = async (id: number) => {
  const headers = await authHeader();
  await axios.delete(`${API_URL}/${id}`, { headers });
};

export const buscarPorRegionInteres = async (region: string, tipo: TipoTransaccion) => {
  const headers = await authHeader();
  const res = await axios.get<PreferenciaNotificacionResponse[]>(`${API_URL}/por-region-interes`, { params: { region, tipo }, headers });
  return res.data;
};

export const buscarPorDistritoInteres = async (distrito: string, tipo: TipoTransaccion) => {
  const headers = await authHeader();
  const res = await axios.get<PreferenciaNotificacionResponse[]>(`${API_URL}/por-distrito-interes`, { params: { distrito, tipo }, headers });
  return res.data;
};

export const buscarPorTipoBusqueda = async (tipoBusqueda: TipoBusqueda, tipo: TipoTransaccion) => {
  const headers = await authHeader();
  const res = await axios.get<PreferenciaNotificacionResponse[]>(`${API_URL}/por-tipo-busqueda`, { params: { tipoBusqueda, tipo }, headers });
  return res.data;
};
