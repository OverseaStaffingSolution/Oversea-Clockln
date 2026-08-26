import { useCallback } from 'react';

// Route component loaders dictionary for instant preloading
const routeLoaders: Record<string, () => Promise<any>> = {
  dashboard: () => import('../pages/Dashboard'),
  historique: () => import('../pages/Historique'),
  correction: () => import('../pages/Correction'),
  login: () => import('../pages/Login')
};

// Cache to prevent duplicate preloads
const preloadedRoutes = new Set<string>();

export function preloadRoute(routeName: string): void {
  const normalizedKey = routeName.toLowerCase().replace(/^\//, '') || 'dashboard';
  
  if (preloadedRoutes.has(normalizedKey)) return;

  const loader = routeLoaders[normalizedKey];
  if (loader) {
    preloadedRoutes.add(normalizedKey);
    // Use requestIdleCallback if available, or fallback to setTimeout
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        loader().catch((err) => {
          preloadedRoutes.delete(normalizedKey);
          console.debug(`[Preload] Error preloading route: ${normalizedKey}`, err);
        });
      });
    } else {
      setTimeout(() => {
        loader().catch((err) => {
          preloadedRoutes.delete(normalizedKey);
          console.debug(`[Preload] Error preloading route: ${normalizedKey}`, err);
        });
      }, 50);
    }
  }
}

/**
 * React hook to generate hover/touch preload handlers for navigation
 */
export function usePreload() {
  const handlePreload = useCallback((path: string) => {
    const route = path.replace(/^\//, '') || 'dashboard';
    preloadRoute(route);
  }, []);

  return {
    preloadRoute: handlePreload
  };
}
