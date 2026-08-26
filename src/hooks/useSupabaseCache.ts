import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheService } from '../services/cacheService';
import { useOnlineStatus } from './useOnlineStatus';

interface UseSupabaseCacheOptions<T> {
  key: string;
  queryFn: () => Promise<T>;
  ttlMinutes?: number;
  enabled?: boolean;
  initialData?: T;
  revalidateOnFocus?: boolean;
}

export function useSupabaseCache<T>({
  key,
  queryFn,
  ttlMinutes = 10,
  enabled = true,
  initialData,
  revalidateOnFocus = false
}: UseSupabaseCacheOptions<T>) {
  const isOnline = useOnlineStatus();
  
  // Read instant cached data from storage/memory tier
  const [data, setData] = useState<T | null>(() => {
    const cached = cacheService.get<T>(key);
    if (cached !== null) return cached;
    return initialData !== undefined ? initialData : null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    const cached = cacheService.get<T>(key);
    return cached === null && enabled;
  });

  const [error, setError] = useState<Error | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const executeQuery = useCallback(
    async (forceRefresh = false) => {
      if (!enabled) return;

      const cached = cacheService.get<T>(key);
      if (cached !== null && !forceRefresh) {
        setData(cached);
        setLoading(false);
        return cached;
      }

      // If offline and have cached data (even stale), do not throw error
      if (!isOnline && cached !== null) {
        setData(cached);
        setLoading(false);
        return cached;
      }

      if (data === null) {
        setLoading(true);
      } else {
        setIsValidating(true);
      }

      try {
        const freshData = await queryFn();
        if (isMounted.current && freshData !== undefined) {
          setData(freshData);
          setError(null);
          cacheService.set(key, freshData, ttlMinutes, true);
        }
        return freshData;
      } catch (err: any) {
        console.warn(`[useSupabaseCache] Query error for key: ${key}`, err);
        if (isMounted.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
          // Fallback to cache if exists
          if (cached !== null) {
            setData(cached);
          }
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setIsValidating(false);
        }
      }
    },
    [key, queryFn, ttlMinutes, enabled, isOnline, data]
  );

  useEffect(() => {
    executeQuery();
  }, [key, enabled]);

  // Revalidate on network recovery
  useEffect(() => {
    if (isOnline && enabled) {
      executeQuery(false);
    }
  }, [isOnline]);

  const mutate = useCallback(
    (newData: T | ((prev: T | null) => T), shouldRevalidate = true) => {
      setData((prev) => {
        const resolved = typeof newData === 'function' ? (newData as any)(prev) : newData;
        cacheService.set(key, resolved, ttlMinutes, true);
        return resolved;
      });

      if (shouldRevalidate && isOnline) {
        executeQuery(true);
      }
    },
    [key, ttlMinutes, isOnline, executeQuery]
  );

  const refetch = useCallback(() => executeQuery(true), [executeQuery]);

  return {
    data,
    loading,
    error,
    isValidating,
    refetch,
    mutate
  };
}
