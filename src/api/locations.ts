import axios from 'axios';
import { getToken } from '../utils/token';
import { buildApiUrl } from '../utils/apiConfig';

const API_URL = buildApiUrl('/api/ubicaciones');

// Tipos basados en tu backend
export interface UbicacionGeografica {
  direccionCompleta?: string;
  region?: string; // Lima, Junín, Loreto
  provincia?: string; // Lima, Huancayo, Maynas
  distrito?: string; // Barranco, El Tambo, Iquitos
  latitud?: number;
  longitud?: number;
  codigoPostal?: string;
  pais?: string; // Por defecto "Perú"
}

export interface GeocodeRequest {
  direccion: string;
}

export interface AutocompleteRequest {
  input: string;
}

// Geocodificar una dirección
export const geocodeAddress = async (direccion: string): Promise<UbicacionGeografica> => {
  const token = await getToken();
  const response = await axios.post<UbicacionGeografica>(
    `${API_URL}/geocodificar`,
    { direccion },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
};

// Autocompletar direcciones
export const autocompleteAddress = async (input: string): Promise<string[]> => {
  const token = await getToken();
  const response = await axios.get<string[]>(
    `${API_URL}/autocompletar`,
    {
      params: { input },
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
};

// Validar si una ubicación tiene coordenadas válidas
export const hasValidCoordinates = (ubicacion: UbicacionGeografica): boolean => {
  return ubicacion.latitud !== undefined && 
         ubicacion.longitud !== undefined && 
         ubicacion.latitud !== null && 
         ubicacion.longitud !== null;
};

// Formatear dirección para mostrar
export const formatAddress = (ubicacion: UbicacionGeografica): string => {
  if (ubicacion.direccionCompleta) {
    return ubicacion.direccionCompleta;
  }
  
  const parts = [
    ubicacion.distrito,
    ubicacion.provincia,
    ubicacion.region,
    ubicacion.pais || 'Perú'
  ].filter(Boolean);
  
  return parts.join(', ');
};

// Obtener ubicación resumida
export const getShortAddress = (ubicacion: UbicacionGeografica): string => {
  const parts = [
    ubicacion.distrito,
    ubicacion.provincia
  ].filter(Boolean);
  
  return parts.join(', ') || ubicacion.direccionCompleta || 'Ubicación no especificada';
};
