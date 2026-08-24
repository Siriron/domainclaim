import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
          <p className="font-mono text-xs uppercase tracking-wide text-stamp mb-3">
            record could not be rendered
          </p>
          <h1 className="font-display text-3xl font-semibold text-ink mb-3">
            Something broke on this page.
          </h1>
          <p className="text-file max-w-md mb-6">
            Reloading usually fixes it. If it keeps happening, the RPC endpoint
            or your wallet connection is the likeliest cause.
          </p>
          <button
            onClick={() => window.location.assign('/')}
            className="rounded-sm bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-ink-soft transition-colors"
          >
            Back to file a claim
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
