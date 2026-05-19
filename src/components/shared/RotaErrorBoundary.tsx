"use client";

import React from "react";

interface State {
  hasError: boolean;
  error?: Error;
}

interface Props {
  children: React.ReactNode;
  debug?: boolean;
}

export class RotaErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Rota page error:", error);
    console.error("Component stack:", info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const showDetails = this.props.debug ?? process.env.NODE_ENV === "development";

      return (
        <div className="p-8 bg-red-50 rounded-lg m-6">
          <h2 className="text-red-800 font-bold text-lg mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600 text-sm">
            The rota page encountered an error. Please try refreshing or contact support if the issue persists.
          </p>
          {showDetails && this.state.error && (
            <>
              <pre className="text-red-700 text-sm whitespace-pre-wrap mt-4">
                {this.state.error.message}
              </pre>
              <pre className="text-red-600 text-xs mt-4 whitespace-pre-wrap">
                {this.state.error.stack}
              </pre>
            </>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}