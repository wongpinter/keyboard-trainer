import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FocusModeProvider } from "./contexts/FocusModeContext";
import { EmulationProvider } from "./contexts/EmulationContext";
import Index from "./pages/Index";
import Statistics from "./pages/Statistics";
import AuthPage from "./components/auth/AuthPage";
import Dashboard from "./components/dashboard/Dashboard";
import KeyboardTrainer from "./components/KeyboardTrainer";
import NotFound from "./pages/NotFound";
import DevMigration from "./pages/DevMigration";

// Import migration script to make it available globally (dev only)
if (import.meta.env.DEV) {
  import("./scripts/migrateTrainingData");
}

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider defaultTheme="system">
      <FocusModeProvider>
        <EmulationProvider>
          <QueryClientProvider client={queryClient}>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/trainer" element={<KeyboardTrainer />} />
              {/* Developer-only migration route */}
              {import.meta.env.DEV && (
                <Route path="/dev/migration" element={<DevMigration />} />
              )}
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
        </EmulationProvider>
      </FocusModeProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
