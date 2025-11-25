import React from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import logger from '../utils/logger';
import ErrorRecovery from './ErrorRecovery';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      errorId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('Error caught by boundary', error, { errorInfo });
    this.setState({
      error,
      errorInfo,
    });

    // Report error to external service in production (optional)
    if (process.env.NODE_ENV === 'production') {
      // You can add error reporting service here
      // Example: reportErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null, 
      errorId: null,
      retryCount: 0,
    });
    // Try to reset without full page reload first
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  handleRetry = () => {
    const { retryCount } = this.state;
    if (retryCount < 3) {
      this.setState({ retryCount: retryCount + 1 });
      // Attempt to recover by resetting error state
      setTimeout(() => {
        this.handleReset();
      }, 500);
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;
      
      // Use custom fallback if provided
      if (Fallback) {
        return (
          <Fallback 
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.handleReset}
          />
        );
      }

      return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl w-full glass-card p-8"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="text-red-400" size={32} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Something went wrong
                </h2>
                <p className="text-gray-400 mb-4">
                  An unexpected error occurred. You can try to recover by going back or reloading the page.
                </p>
                
                {this.state.errorId && (
                  <p className="text-xs text-gray-500 mb-4">
                    Error ID: {this.state.errorId}
                  </p>
                )}

                <ErrorRecovery
                  error={this.state.error}
                  onRetry={this.handleRetry}
                  onDismiss={this.handleReset}
                  retryCount={this.state.retryCount}
                  maxRetries={3}
                  showDetails={process.env.NODE_ENV === 'development'}
                  title="Application Error"
                  retryLabel="Try Again"
                  dismissLabel="Reload Page"
                />

                <div className="flex flex-wrap gap-3 mt-4">
                  <motion.button
                    onClick={this.handleGoBack}
                    className="btn-secondary flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Go back to previous page"
                  >
                    <ArrowLeft size={18} aria-hidden="true" />
                    <span>Go Back</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={this.handleGoHome}
                    className="btn-secondary flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Go to home page"
                  >
                    <Home size={18} aria-hidden="true" />
                    <span>Go Home</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
