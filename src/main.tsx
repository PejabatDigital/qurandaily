import { createRoot } from "react-dom/client";
import { useState } from "react";
import App from "./App.tsx";
import { SplashIntro } from "./components/SplashIntro.tsx";
import "./index.css";

const INTRO_SESSION_KEY = "kasahKodIntroShown";

function Root() {
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

createRoot(document.getElementById("root")!).render(<Root />);
