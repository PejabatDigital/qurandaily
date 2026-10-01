import { createRoot } from "react-dom/client";
import { Component, type ErrorInfo, type ReactNode } from "react";
import "./index.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return <FatalError message={this.state.error.message} />;
    }
    return this.props.children;
  }
}

function FatalError({ message }: { message: string }) {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Something went wrong loading the app</h1>
      <p>{message}</p>
      <p>Check the browser console for more details.</p>
    </div>
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Could not find root element: <div id="root"> is missing from index.html');
}

const root = createRoot(rootElement);

// App (and its transitive imports, e.g. the Supabase client) is loaded dynamically
// so a module-load-time crash — like a missing env var — can be caught here and
// shown on screen, instead of silently failing before React ever renders anything.
import("./App.tsx")
  .then(({ default: App }) => {
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  })
  .catch((error: unknown) => {
    console.error("App failed to load:", error);
    root.render(<FatalError message={error instanceof Error ? error.message : String(error)} />);
  });
