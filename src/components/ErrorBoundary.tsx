import React, { Component, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
  goHome: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError, goHome }) => {
  const { t } = useTranslation(['errors', 'common']);
  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">
            {t('errors:general.somethingWentWrong')}
          </CardTitle>
          <CardDescription className="text-base">
            {t('errors:general.unexpectedError')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Details for Development */}
          {isDevelopment && error && (
            <div className="bg-muted/50 p-4 rounded-lg border">
              <h4 className="font-semibold text-sm mb-2 text-destructive">
                {t('errors:general.developmentDetails')}
              </h4>
              <div className="text-xs font-mono bg-background p-3 rounded border overflow-auto max-h-40">
                <div className="text-destructive font-semibold mb-1">
                  {error.name}: {error.message}
                </div>
                {error.stack && (
                  <pre className="text-muted-foreground whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* User-friendly message */}
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              {t('errors:general.errorReported')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={resetError} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                {t('common:buttons.tryAgain')}
              </Button>
              <Button onClick={goHome} className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                {t('common:buttons.goHome')}
              </Button>
            </div>
          </div>

          {/* Additional Help */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              {t('errors:general.persistentProblem')}{' '}
              <a
                href="mailto:support@keyboardtrainer.com"
                className="text-primary hover:underline"
              >
                {t('errors:general.contactSupport')}
              </a>
              {' '}{t('errors:general.withDetails')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Error info:', errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    if (!import.meta.env.DEV) {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  goHome = () => {
    // Reset error state and navigate to home
    this.resetError();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          goHome={this.goHome}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
