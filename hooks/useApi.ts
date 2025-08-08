import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

interface UseApiOptions {
  immediate?: boolean;
  deps?: any[];
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  reset: () => void;
}

export function useApi<T>(
  apiCall: () => Promise<{ success: boolean; data: T; error?: string }>,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const { immediate = true, deps = [] } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCall();
      
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error || 'API call failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, deps);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [fetchData, immediate]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    reset,
  };
}

// Mutation hook for API calls that modify data
interface UseMutationResult<T, V> {
  mutate: (variables: V) => Promise<T>;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

export function useMutation<T, V>(
  apiCall: (variables: V) => Promise<{ success: boolean; data: T; error?: string }>
): UseMutationResult<T, V> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (variables: V): Promise<T> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCall(variables);
      
      if (response.success) {
        return response.data;
      } else {
        const errorMessage = response.error || 'Mutation failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setLoading(false);
  };

  return {
    mutate,
    loading,
    error,
    reset,
  };
}

export function useApiRequest() {
  const request = useCallback(
    async (path: string, init?: RequestInit) => {
      // Reuse apiService private request via a small facade
      // We can't access apiService.request directly since it's private, so we call endpoint through apiService by method
      // Build a generic passthrough using fetch to the same base as apiService
      try {
        const headers = await (async () => {
          try {
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            const token = await AsyncStorage.getItem('authToken');
            const h: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) h['Authorization'] = `Bearer ${token}`;
            return h;
          } catch {
            return { 'Content-Type': 'application/json' } as Record<string, string>;
          }
        })();
        const base = (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.trim().length > 0
          ? process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '')
          : 'https://lyra-backend-xn4o.onrender.com/api/v1');
        const res = await fetch(`${base}${path}`, {
          ...init,
          headers: { ...headers, ...(init?.headers as any) },
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data?.error || data?.message || 'Request failed' };
        }
        return data;
      } catch (e: any) {
        return { success: false, error: e?.message || 'Network error' };
      }
    },
    []
  );

  const get = useCallback((path: string, init?: RequestInit) => request(path, { method: 'GET', ...(init || {}) }), [request]);
  const post = useCallback((path: string, body?: any, init?: RequestInit) => request(path, { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body || {}), ...(init || {}) }), [request]);
  const put = useCallback((path: string, body?: any, init?: RequestInit) => request(path, { method: 'PUT', body: typeof body === 'string' ? body : JSON.stringify(body || {}), ...(init || {}) }), [request]);
  const del = useCallback((path: string, init?: RequestInit) => request(path, { method: 'DELETE', ...(init || {}) }), [request]);

  return { request, get, post, put, del };
}