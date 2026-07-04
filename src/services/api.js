import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://confiaplus-api.onrender.com',
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token'); 
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Tratamento global para erros de rede (Sem internet ou API offline)
    if (!error.response) {
      console.error('[API] Erro de Rede ou Timeout:', error.message);
      return Promise.reject(new Error("Sem conexão com o servidor. Verifique sua internet."));
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.warn('[API] Token expirado (401). Tentando refresh...');
      
      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${api.defaults.baseURL}/api/token/refresh/`, {
            refresh: refreshToken
          });
          
          if (res.status === 200) {
            await AsyncStorage.setItem('access_token', res.data.access);
            originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
            console.log('[API] Token renovado com sucesso.');
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('[API] Falha no refresh token. Deslogando...', refreshError.message);
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('refresh_token');
        router.replace('/');
        return Promise.reject(refreshError);
      }
      
      // Se não tem refreshToken ou falhou sem cair no catch
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      router.replace('/');
    }

    return Promise.reject(error);
  }
);

export default api;