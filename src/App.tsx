import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";

const Profile = lazy(() => import("./pages/Profile"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const History = lazy(() => import("./pages/History"));
const Calendar = lazy(() => import("./pages/Calendar"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <p className="text-muted-foreground">Loading...</p>
  </div>
);

const AuthErrorFallback = ({ message }: { message: string | null }) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
    <p className="text-sm font-medium">Couldn't sign you in</p>
    <p className="text-xs text-muted-foreground">{message || "Something went wrong starting your session."}</p>
    <Button onClick={() => window.location.reload()}>Try again</Button>
  </div>
);

// Waits for the silent anonymous session (see AuthContext) before rendering
// anything that talks to Supabase. There is no sign-in screen to fall back to,
// so if the session never materializes (sign-ins disabled, rate-limited,
// network error) this shows a retry screen instead of silently rendering
// pages with no user.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { loading, user, error } = useAuth();
  if (loading) return <PageFallback />;
  if (!user) return <AuthErrorFallback message={error} />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
