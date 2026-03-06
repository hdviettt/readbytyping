"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="max-w-md mx-auto mt-20 p-8 text-center">
          <h2 className="text-xl font-bold font-typewriter text-ink-error mb-3">
            Something went wrong
          </h2>
          <p className="text-sm text-muted mb-6">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-accent hover:bg-accent-hover text-background rounded-lg font-medium transition-colors"
          >
            Go back to Library
          </a>
        </div>
      );
    }

    return this.props.children;
  }
}
