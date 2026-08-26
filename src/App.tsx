import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/common/Layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ClockLoader } from './components/ui/ClockLoader';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { preloadRoute } from './hooks/usePreload';

// Code Splitting - Lazy loaded pages for ultra-lightweight initial bundle (< 100KB)
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Historique = lazy(() => import('./pages/Historique'));
const Correction = lazy(() => import('./pages/Correction'));

export default function App() {
  // Preload secondary routes when browser is idle for zero-wait navigation
  useEffect(() => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        preloadRoute('historique');
        preloadRoute('correction');
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<ClockLoader subtitle="Chargement de la page..." />}>
            <div className="min-h-screen flex flex-col transition-all duration-300">
              <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="correction" element={<Correction />} />
                  <Route path="historique" element={<Historique />} />
                </Route>

                {/* Catch-all redirect to Dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}


