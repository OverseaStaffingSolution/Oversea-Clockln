import { useState, useEffect, useCallback } from 'react';
import { cacheService } from '../services/cacheService';

export function useDataCache<T>(
  key: string,
  initialFallback?: T,
  ttlMinutes = 10
) {
  const [data, setData] = useState<T | null>(() => {
    const cached = cacheService.get<T>(key);
    if (cached !== null) return cached;
    return initialFallback !== undefined ? initialFallback : null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(data === null);

  useEffect(() => {
    const cached = cacheService.get<T>(key);
    if (cached !== null) {
      setData(cached);
      setIsLoading(false);
    }
  }, [key]);

  const updateData = useCallback(
    (newData: T, persist = true) => {
      cacheService.set(key, newData, ttlMinutes, persist);
      setData(newData);
    },
    [key, ttlMinutes]
  );

  const invalidate = useCallback(() => {
    cacheService.remove(key);
    setData(initialFallback !== undefined ? initialFallback : null);
  }, [key, initialFallback]);

  return {
    data,
    setData: updateData,
    invalidate,
    isLoading
  };
}
