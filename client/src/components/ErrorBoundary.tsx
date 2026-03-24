import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("UI error:", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            padding: "2rem",
            fontFamily: "system-ui, sans-serif",
            background: "#1c1410",
            color: "#f8f3ee",
          }}
        >
          <h1 style={{ fontSize: "1.25rem" }}>Something went wrong</h1>
          <p style={{ opacity: 0.9 }}>{this.state.error.message}</p>
          <p style={{ fontSize: "0.9rem", opacity: 0.75 }}>
            Open the browser developer console (F12) for details. After fixing, refresh the page.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
