import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Keeps session/user in sync for every future auth event (token refresh,
    // the SIGNED_IN event that signInAnonymously() itself triggers below,
    // etc). It must NOT touch `loading` — onAuthStateChange fires an initial
    // event with session:null almost immediately, well before the bootstrap
    // below finishes, and clearing `loading` on that event let ProtectedRoute
    // render children with no user yet. `user` would then flip from null to
    // the real anonymous user while already mounted, and downstream query
    // state (enabled: !!user) would flip with it — a false->true->false
    // isLoading flicker in Index.tsx that hit its full-skeleton early return
    // and unmounted everything below it, wiping in-progress onboarding input.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // `loading` is only ever cleared here, once, after we know for certain
    // whether there's an existing session or the anonymous sign-in attempt
    // has finished (success or failure).
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        setLoading(false);
        return;
      }
      // No session yet on this device — open a silent anonymous one so the
      // app never shows a sign-in screen.
      const { data, error: signInError } = await supabase.auth.signInAnonymously();
      if (signInError) {
        console.error("Anonymous sign-in failed:", signInError);
        setError(signInError.message);
      } else {
        setSession(data.session);
        setUser(data.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}
