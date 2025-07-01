import axios from 'axios';
import { saveToken } from '../utils/token';
import { ApiErrorHandler } from '../utils/errorHandler';
import { buildApiUrl, API_CONFIG } from '../utils/apiConfig';

const API_URL = buildApiUrl('/api');

const TEST_EMAIL = 'demo@demo.com';
const TEST_PASSWORD = 'demo123';
const TEST_TOKEN = 'fake-jwt-token-demo';

export const login = async (email: string, password: string) => {
  // Simulación de cuenta de prueba
  if (email === TEST_EMAIL && password === TEST_PASSWORD) {
    await saveToken(TEST_TOKEN);
    return { token: TEST_TOKEN, user: { email: TEST_EMAIL, nombre: 'Demo' } };
  }
  
  // Si las credenciales no coinciden con la cuenta de prueba, simular error de credenciales incorrectas
  // Esto evita intentar conectar a un servidor que podría no estar disponible durante desarrollo
  if (email !== TEST_EMAIL || password !== TEST_PASSWORD) {
    const mockError = {
      response: {
        status: 401,
        data: {
          error: 'Email o contraseña incorrectos'
        }
      }
    };
    const errorInfo = ApiErrorHandler.processAuthError(mockError, 'login');
    throw { ...mockError, processedError: errorInfo };
  }
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    const { token } = response.data;
    if (token) {
      await saveToken(token);
    }
    return response.data;
  } catch (error: any) {
    const errorInfo = ApiErrorHandler.processAuthError(error, 'login');
    throw { ...error, processedError: errorInfo };
  }
};

export const register = async (
  name: string,
  apellido: string,
  email: string,
  password: string,
  phone: string
) => {
  // Simulación de registro de cuenta de prueba
  if (email === TEST_EMAIL) {
    return { token: TEST_TOKEN, user: { email: TEST_EMAIL, nombre: 'Demo' } };
  }
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      name,
      apellido,
      email,
      password,
      phone,
    });
    return response.data;
  } catch (error: any) {
    const errorInfo = ApiErrorHandler.processAuthError(error, 'register');
    throw { ...error, processedError: errorInfo };
  }
};
