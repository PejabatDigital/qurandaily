// Appearance: System, Light or Dark, remembered on this device (kept when signing out).
// public/theme.js applies the saved choice before the page draws; the colours themselves
// are in src/index.css.
export type Appearance = "system" | "light" | "dark";

export const APPEARANCE_KEY = "qd:theme";
const COLOR = { light: "#F6F7F9", dark: "#0B1020" };

export function getAppearance(): Appearance {
  try {
    const t = localStorage.getItem(APPEARANCE_KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

export function setAppearance(t: Appearance): void {
  try {
    if (t === "system") localStorage.removeItem(APPEARANCE_KEY);
    else localStorage.setItem(APPEARANCE_KEY, t);
  } catch {
    // Storage blocked: the choice still applies until the page is closed.
  }
  const root = document.documentElement;
  if (t === "system") delete root.dataset.theme;
  else root.dataset.theme = t;
  // The browser bar follows too; "system" puts back each tag's own (light or dark) colour.
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
    if (!m.dataset.color) m.dataset.color = m.content;
    m.content = t === "system" ? m.dataset.color : COLOR[t];
  });
}
