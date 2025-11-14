'use client';

import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ApiErrorBoundaryProps {
  children: React.ReactNode;
}

interface ApiErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ApiErrorBoundary extends React.Component<
  ApiErrorBoundaryProps,
  ApiErrorBoundaryState
> {
  constructor(props: ApiErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ApiErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('API Error Boundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p>
                Unable to connect to the API server. This might be because:
              </p>
              <ul className="ml-4 list-disc space-y-1 text-sm">
                <li>The API server is not running</li>
                <li>The API endpoint URL is incorrect</li>
                <li>There's a network connectivity issue</li>
                <li>CORS is not properly configured on the server</li>
              </ul>
              <p className="text-sm">
                Error: {this.state.error?.message || 'Unknown error'}
              </p>
              <Button onClick={this.handleReset} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Connection
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
