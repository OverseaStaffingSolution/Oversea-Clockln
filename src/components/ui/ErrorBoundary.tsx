import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-animated-gradient flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
          <div className="w-full max-w-md my-auto relative z-10 animate-fade-in">
            <GlassCard className="!p-8 border border-red-500/20 shadow-2xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-5 text-red-600">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                Une interruption est survenue
              </h1>

              <p className="text-sm text-gray-600 font-light mb-6 leading-relaxed">
                L'application a rencontré une erreur inattendue. Vos données locales et votre statut de pointage sont préservés.
              </p>

              {this.state.error?.message && (
                <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200 text-left text-xs font-mono text-gray-700 overflow-x-auto max-h-24">
                  {this.state.error.message}
                </div>
              )}

              <Button
                variant="primary"
                fullWidth
                onClick={this.handleReset}
                className="!py-3.5 text-sm font-bold flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Recharger l'application</span>
              </Button>
            </GlassCard>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
