import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { useApi, useMutation } from './useApi';

export interface EmotionInsight {
  id: string;
  insightType: string;
  data: {
    period: string;
    averages: {
      mood: number;
      energy: number;
      sleep: number;
      sleepQuality: number;
    };
    totals: {
      focusTime: number;
      completedFocusSessions: number;
      totalFocusSessions: number;
    };
    insights: string[];
    dataPoints: {
      mood: number;
      energy: number;
      sleep: number;
      focus: number;
    };
  };
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export interface Correlation {
  type: string;
  strength: string;
  description: string;
  recommendation: string;
}

export interface WeeklySummary {
  period: string;
  averages: {
    mood: number;
    energy: number;
    sleep: number;
    sleepQuality: number;
  };
  totals: {
    focusTime: number;
    completedFocusSessions: number;
    totalFocusSessions: number;
  };
  insights: string[];
  dataPoints: {
    mood: number;
    energy: number;
    sleep: number;
    focus: number;
  };
}

export interface DataTrends {
  trends: {
    mood: Array<{ value: number; date: string }>;
    energy: Array<{ value: number; date: string }>;
    sleep: Array<{ duration: number; quality: number; date: string }>;
    focus: Array<{ duration: number; completed: boolean; date: string }>;
  };
  period: string;
  dataPoints: {
    mood: number;
    energy: number;
    sleep: number;
    focus: number;
  };
}

export const useInsights = () => {
  const {
    data: emotionInsights,
    loading: loadingEmotionInsights,
    error: emotionInsightsError,
    refetch: refetchEmotionInsights,
  } = useApi<EmotionInsight>(() => apiService.getEmotionInsights(), { immediate: false });

  const {
    data: correlationsData,
    loading: loadingCorrelations,
    error: correlationsError,
    refetch: refetchCorrelations,
  } = useApi<{ correlations: Correlation[] }>(() => apiService.getCorrelations(), { immediate: false });

  const {
    data: weeklySummary,
    loading: loadingWeeklySummary,
    error: weeklySummaryError,
    refetch: refetchWeeklySummary,
  } = useApi<WeeklySummary>(() => apiService.getWeeklySummary(), { immediate: false });

  const {
    data: dataTrends,
    loading: loadingDataTrends,
    error: dataTrendsError,
    refetch: refetchDataTrends,
  } = useApi<DataTrends>(() => apiService.getTrends('month'), { immediate: false });

  const getEmotionInsights = useCallback(async (regenerate = false) => {
    const response = await apiService.getEmotionInsights(regenerate);
    return response.data;
  }, []);

  const getCorrelations = useCallback(async () => {
    const response = await apiService.getCorrelations();
    return response.data;
  }, []);

  const getWeeklySummary = useCallback(async () => {
    const response = await apiService.getWeeklySummary();
    return response.data;
  }, []);

  const getDataTrends = useCallback(async (period: 'week' | 'month' | 'quarter' = 'month') => {
    const response = await apiService.getTrends(period);
    return response.data;
  }, []);

  const refreshAllInsights = useCallback(async () => {
    await Promise.all([
      refetchEmotionInsights(),
      refetchCorrelations(),
      refetchWeeklySummary(),
      refetchDataTrends(),
    ]);
  }, [refetchEmotionInsights, refetchCorrelations, refetchWeeklySummary, refetchDataTrends]);

  return {
    // Data
    emotionInsights,
    correlations: correlationsData?.correlations || [],
    weeklySummary,
    dataTrends,
    
    // Loading states
    loadingEmotionInsights,
    loadingCorrelations,
    loadingWeeklySummary,
    loadingDataTrends,
    loadingAny: loadingEmotionInsights || loadingCorrelations || loadingWeeklySummary || loadingDataTrends,
    
    // Error states
    emotionInsightsError,
    correlationsError,
    weeklySummaryError,
    dataTrendsError,
    
    // Actions
    getEmotionInsights,
    getCorrelations,
    getWeeklySummary,
    getDataTrends,
    refreshAllInsights,
    
    // Refresh functions
    refetchEmotionInsights,
    refetchCorrelations,
    refetchWeeklySummary,
    refetchDataTrends,
  };
};