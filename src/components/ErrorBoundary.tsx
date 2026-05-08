import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  message: string | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { message: null };

  static getDerivedStateFromError(error: Error): State {
    return { message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(error, info);
    }
  }

  render() {
    if (this.state.message) {
      return (
        <main className="fatal-shell">
          <section className="fatal-panel">
            <h1>OpenSlide StarDist Viewer</h1>
            <p>{this.state.message}</p>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
