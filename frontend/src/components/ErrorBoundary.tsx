import React, { Component, ReactNode, ErrorInfo } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: string; // e.g., "game", "navigation", "general"
  maxRetries?: number;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private maxRetries: number;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.maxRetries = props.maxRetries || 3;
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error info
    this.setState({ errorInfo });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log error for monitoring (in production, send to error service)
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // TODO: Implement error logging service integration
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.warn('Error report ready for logging service:', errorReport);
  };

  handleReload = () => {
    window.location.reload();
  };

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
      });
    }
  };

  handleGoHome = () => {
    // Reset error state and navigate to home
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId, errorInfo } = this.state;
      const { context = 'application' } = this.props;
      const canRetry = this.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 to-gray-900 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-2xl w-full text-center border border-red-500/20">
            <div className="mb-6">
              <ExclamationTriangleIcon className="w-16 h-16 mx-auto text-red-400 mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">
                {context === 'game' ? 'Game Error Encountered' : 'Application Error'}
              </h1>
              <p className="text-red-200">
                {context === 'game'
                  ? 'Something went wrong in Echoes Of War. Your progress has been saved.'
                  : 'An unexpected error occurred. Please try again.'}
              </p>
            </div>

            {/* Error ID for support */}
            <div className="mb-4 p-2 bg-black/20 rounded border">
              <p className="text-xs text-gray-400">
                Error ID: <span className="font-mono text-gray-300">{errorId}</span>
              </p>
            </div>

            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && error && (
              <div className="bg-black/30 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-red-400 font-semibold mb-2">Error Details:</h3>
                <pre className="text-xs text-gray-300 overflow-auto max-h-32">{error.message}</pre>
                {errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-400 cursor-pointer">
                      Component Stack
                    </summary>
                    <pre className="text-xs text-gray-500 mt-1 overflow-auto max-h-32">
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {canRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowPathIcon className="w-5 h-5" />
                    Try Again ({this.maxRetries - this.retryCount} left)
                  </button>
                )}

                <button
                  onClick={this.handleReload}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Reload Page
                </button>

                {context === 'game' && (
                  <button
                    onClick={this.handleGoHome}
                    className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <HomeIcon className="w-5 h-5" />
                    Return to Menu
                  </button>
                )}
              </div>

              <div className="text-sm text-gray-400">
                If the problem persists, please contact support with the error ID above.
              </div>
            </div>

            {/* Context-specific recovery tips */}
            <div className="mt-8 bg-gray-800/50 rounded-lg p-4 border border-gray-600">
              <h4 className="text-white font-semibold mb-2">Recovery Tips:</h4>
              <ul className="text-sm text-gray-300 space-y-1 text-left">
                {context === 'game' ? (
                  <>
                    <li>• Check your internet connection for real-time sync</li>
                    <li>• Your game progress is automatically saved</li>
                    <li>• Try returning to the menu and rejoining</li>
                    <li>• Clear browser cache if issues continue</li>
                  </>
                ) : (
                  <>
                    <li>• Check your internet connection</li>
                    <li>• Ensure your browser is up to date</li>
                    <li>• Clear browser cache if issues continue</li>
                    <li>• Try refreshing the page</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Convenience wrapper for game-specific error boundaries
export const GameErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    context="game"
    onError={(error, errorInfo) => {
      // Game-specific error handling
      console.error('Game Error:', { error, errorInfo });

      // Could save game state or notify server of error
      // saveGameStateToLocalStorage();
      // notifyServerOfError(error);
    }}
  >
    {children}
  </ErrorBoundary>
);

// Convenience wrapper for general app error boundaries
export const AppErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary context="application">{children}</ErrorBoundary>
);
