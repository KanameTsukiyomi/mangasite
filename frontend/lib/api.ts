import axios from 'axios';
import { getSupabase } from './supabase';

/**
 * Cliente Axios preconfigurado para el backend Express.
 * Añade automáticamente el JWT de Supabase en cada petición.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
});

api.interceptors.request.use(async (config) => {
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export default api;
