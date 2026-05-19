"use client";

import React from "react";

interface State {
  hasError: boolean;
  error?: Error;
}

export class RotaErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
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
      return (
        <div className="p-8 bg-red-50 rounded-lg m-6">
          <h2 className="text-red-800 font-bold text-lg mb-2">
            Rota page error (debug view)
          </h2>
          <pre className="text-red-700 text-sm whitespace-pre-wrap">
            {this.state.error?.message}
          </pre>
          <pre className="text-red-600 text-xs mt-4 whitespace-pre-wrap">
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}