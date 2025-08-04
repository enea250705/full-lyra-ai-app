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