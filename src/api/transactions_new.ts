import axios from 'axios';
import { getToken } from '../utils/token';
import { buildApiUrl } from '../utils/apiConfig';

const API_URL = buildApiUrl('/api/transacciones');

// Tipos basados en tu backend
export type TipoTransaccion = 'VENTA' | 'ALQUILER';

export interface TransaccionRequest {
  propiedadId: number;
  clienteId: number;
  agenteId: number;
  tipo: TipoTransaccion;
  monto: number;
  comisionAgente: number;
  detalles?: string;
}

export interface TransaccionResponse {
  id: number;
  propiedadId: number;
  clienteId: number;
  agenteId: number;
  tipo: TipoTransaccion;
  monto: number;
  comisionAgente: number;
  fecha: string;
  detalles?: string;
}

// Crear transacción
export const createTransaction = async (data: TransaccionRequest) => {
  const token = await getToken();
  const response = await axios.post<TransaccionResponse>(`${API_URL}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Obtener transacción por ID
export const getTransactionById = async (id: number) => {
  const token = await getToken();
  const response = await axios.get<TransaccionResponse>(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Listar todas las transacciones
export const getAllTransactions = async () => {
  const token = await getToken();
  const response = await axios.get<TransaccionResponse[]>(`${API_URL}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Actualizar transacción
export const updateTransaction = async (id: number, data: TransaccionRequest) => {
  const token = await getToken();
  const response = await axios.put<TransaccionResponse>(`${API_URL}/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Eliminar transacción
export const deleteTransaction = async (id: number) => {
  const token = await getToken();
  const response = await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Listar transacciones por cliente
export const getTransactionsByClient = async (clienteId: number) => {
  const token = await getToken();
  const response = await axios.get<TransaccionResponse[]>(`${API_URL}/por-cliente/${clienteId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Listar transacciones por agente
export const getTransactionsByAgent = async (agenteId: number) => {
  const token = await getToken();
  const response = await axios.get<TransaccionResponse[]>(`${API_URL}/por-agente/${agenteId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Listar transacciones por propiedad
export const getTransactionsByProperty = async (propiedadId: number) => {
  const token = await getToken();
  const response = await axios.get<TransaccionResponse[]>(`${API_URL}/por-propiedad/${propiedadId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Listar transacciones por agente y mes
export const getTransactionsByAgentAndMonth = async (agenteId: number, anio: number, mes: number) => {
  const token = await getToken();
  const params = new URLSearchParams();
  params.append('agenteId', agenteId.toString());
  params.append('anio', anio.toString());
  params.append('mes', mes.toString());
  
  const response = await axios.get<TransaccionResponse[]>(`${API_URL}/por-agente-mes?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
