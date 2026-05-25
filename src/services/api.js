import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://confiaplus-api.onrender.com', // Seu Back-end na nuvem!
});

api.interceptors.request.use(async (config) => {
  // No mobile usamos AsyncStorage no lugar do localStorage
  const token = await AsyncStorage.getItem('access_token'); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;