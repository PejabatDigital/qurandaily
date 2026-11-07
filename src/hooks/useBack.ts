import { useLocation, useNavigate } from "react-router-dom";

/** Back to the page the reader came from, or to `fallback` when this page was opened
 *  directly (a link, a refresh, the Home Screen). */
export function useBack(fallback: string) {
  const navigate = useNavigate();
  const location = useLocation();
  return () => (location.key === "default" ? navigate(fallback, { replace: true }) : navigate(-1));
}
