import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  {children: React.ReactNode},
  ErrorBoundaryState
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {hasError: true};
  }

  componentDidCatch(error: Error) {
    console.error('Storefront render error:', error);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#DDDCDB] text-[#1F2225] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#F4F3F2] border border-[#C2C0BE] rounded-2xl p-8 text-center space-y-4">
            <p className="text-xs font-mono-num uppercase tracking-[0.2em] text-[#7D8287]">
              Cleats D Hub
            </p>
            <h1 className="text-xl font-bold tracking-tight">Something went wrong loading the store</h1>
            <p className="text-sm text-[#575C62]">
              Please refresh the page to restore the latest catalog view.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#FD7B41] text-[#1F2225] text-sm font-semibold hover:bg-[#e86a32] transition-colors cursor-pointer"
            >
              Reload Storefront
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
