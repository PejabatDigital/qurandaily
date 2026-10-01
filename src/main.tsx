import { createRoot } from "react-dom/client";
import { Component, useState, type ErrorInfo, type ReactNode } from "react";
import "./index.css";

const INTRO_SESSION_KEY = "kasahKodIntroShown";

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

function Root({ App, SplashIntro }: { App: React.ComponentType; SplashIntro: typeof import("./components/SplashIntro.tsx").SplashIntro }) {
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return sessionStorage.getItem(INTRO_SESSION_KEY) !== "1";
    } catch {
      return true;
    }
  });

  const dismissIntro = () => {
    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, "1");
    } catch {
      // sessionStorage unavailable (private mode etc) — intro will replay next load
    }
    setShowIntro(false);
  };

  return (
    <>
      <App />
      {showIntro && <SplashIntro onComplete={dismissIntro} />}
    </>
  );
}

const root = createRoot(document.getElementById("root")!);

// App (and its transitive imports, e.g. the Supabase client) is loaded dynamically
// so a module-load-time crash — like a missing env var — can be caught here and
// shown on screen, instead of silently failing before React ever renders anything.
Promise.all([import("./App.tsx"), import("./components/SplashIntro.tsx")])
  .then(([{ default: App }, { SplashIntro }]) => {
    root.render(
      <ErrorBoundary>
        <Root App={App} SplashIntro={SplashIntro} />
      </ErrorBoundary>
    );
  })
  .catch((error: unknown) => {
    console.error("App failed to load:", error);
    root.render(<FatalError message={error instanceof Error ? error.message : String(error)} />);
  });
