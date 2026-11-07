import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";

const Settings = lazy(() => import("./pages/Settings"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const History = lazy(() => import("./pages/History"));
const Progress = lazy(() => import("./pages/Progress"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Privacy = lazy(() => import("./pages/Privacy"));
const SignIn = lazy(() => import("./pages/SignIn"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <p className="text-muted-foreground">Loading...</p>
  </div>
);

const AuthErrorFallback = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
    <p className="text-body font-medium">Couldn't reach Quran Daily</p>
    <p className="text-small text-muted-foreground">{message}</p>
    <Button onClick={onRetry}>Try again</Button>
  </div>
);

// Everything needs a signed-in user (see AuthContext): until there is one, any
// page shows the sign-in screen, and the page opens once signed in.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { loading, user, error, retry } = useAuth();
  if (loading) return <PageFallback />;
  if (error) return <AuthErrorFallback message={error} onRetry={retry} />;
  if (!user) return <SignIn />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/profile" element={<Navigate to="/settings" replace />} />
              <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
              <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
              {/* Open to everyone: it's linked from the sign-in screen. */}
              <Route path="/privacy" element={<Privacy />} />
              <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
