import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="w-full max-w-sm text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-lg font-bold text-text-primary">Algo deu errado</h1>
              <p className="text-sm text-text-secondary leading-relaxed">
                Ocorreu um erro inesperado. Tente recarregar a pagina ou volte mais tarde.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-accent text-background font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar Pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
