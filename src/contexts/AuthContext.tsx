import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, auth, setSignedOutHandler, type SessionUser } from "@/lib/api";

interface AuthContextType {
  user: SessionUser | null;
  /** True until we know whether there's a session. */
  loading: boolean;
  /** Set when the session check couldn't reach the server. */
  error: string | null;
  retry: () => void;
  /** After the sign-in screen has signed someone in. */
  signedIn: (user: SessionUser) => void;
  signOut: () => Promise<void>;
  /** Permanently deletes the account and everything in it. */
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  retry: () => {},
  signedIn: () => {},
  signOut: async () => {},
  deleteAccount: async () => {},
});

export const useAuth = () => useContext(AuthContext);

/** Removes what this device remembers for the app (e.g. catch-up dismissals). */
function forgetDevice() {
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith("qd:")) localStorage.removeItem(key);
  } catch {
    // Storage unavailable: nothing to clear.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Signed out: drop everything cached for the previous user.
  const clear = useCallback(() => {
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  // The session is a cookie that lasts 60 days and renews when the app is opened,
  // so this normally finds the user straight away.
  const check = useCallback(() => {
    setLoading(true);
    setError(null);
    auth
      .session()
      .then(setUser)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    check();
    setSignedOutHandler(clear);
  }, [check, clear]);

  const value: AuthContextType = {
    user,
    loading,
    error,
    retry: check,
    signedIn: (u) => {
      queryClient.clear();
      setUser(u);
    },
    signOut: async () => {
      await auth.signOut();
      clear();
    },
    deleteAccount: async () => {
      await api.deleteAccount();
      forgetDevice();
      clear();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
