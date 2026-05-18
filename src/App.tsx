import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Layout } from "@/components/Layout";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Discover from "./pages/Discover";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Authenticated pages get the sidebar + bottom nav layout
const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => (
  <Layout>{children}</Layout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>
          <AuthProvider>
            <Routes>
              {/* Public */}
              <Route path="/auth" element={<Auth />} />

              {/* Authenticated — with sidebar layout */}
              <Route
                path="/"
                element={
                  <AuthenticatedLayout>
                    <Home />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/library"
                element={
                  <AuthenticatedLayout>
                    <Index />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/discover"
                element={
                  <AuthenticatedLayout>
                    <Discover />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/profile"
                element={
                  <AuthenticatedLayout>
                    <Profile />
                  </AuthenticatedLayout>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
