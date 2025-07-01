import axios from 'axios';
import { getToken } from '../utils/token';
import { buildApiUrl } from '../utils/apiConfig';

const API_URL = buildApiUrl('/api');

export const getUserProfile = async () => {
  const token = await getToken();
  const response = await axios.get(`${API_URL}/usuario/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getUserFavorites = async () => {
  const token = await getToken();
  const response = await axios.get(`${API_URL}/usuario/favoritos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
//a
export const addFavorite = async (propertyId: string) => {
  const token = await getToken();
  const response = await axios.post(
    `${API_URL}/usuario/favoritos`,
    { propertyId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const removeFavorite = async (propertyId: string) => {
  const token = await getToken();
  const response = await axios.delete(
    `${API_URL}/usuario/favoritos/${propertyId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const updateUserProfile = async (data: { nombre?: string; email?: string; telefono?: string; fotoPerfil?: string }) => {
  const token = await getToken();
  const response = await axios.put(
    `${API_URL}/usuario/me`,
    data,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
