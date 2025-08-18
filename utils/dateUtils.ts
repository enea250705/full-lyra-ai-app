import { useI18n } from '@/i18n';

export const formatDate = (date: Date): string => {
  try {
    if (!date || isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return 'Invalid date';
  }
};

export const formatTime = (date: Date): string => {
  try {
    if (!date || isNaN(date.getTime())) {
      return 'Invalid time';
    }
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    return 'Invalid time';
  }
};
  
  export const getGreeting = (): string => {
    const hour = new Date().getHours();
    // Basic locale-aware greeting; screens should use i18n keys instead
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  export const getDayOfWeek = (date: Date = new Date()): string => {
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  };
  
  export const getLastNDays = (n: number): Date[] => {
    const result: Date[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      result.push(date);
    }
    return result;
  };
  
  export const formatShortDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };