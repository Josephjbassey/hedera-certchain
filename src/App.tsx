/**
 * App.tsx - Main Application Component
 * 
 * Description: Root application component with Hedera wallet integration
 * using proven template architecture from hedera-dev/template-ts-hedera-cra-dapp
 * 
 * Author: Hedera CertChain Team
 * Created: September 27, 2025
 */

import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

/* Application components */
import { Layout } from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import IssuePage from "./pages/IssuePage";
import VerifyPage from "./pages/VerifyPage";
import NotFound from "./pages/NotFound";

/* Wallet integration from Hedera template */
import { AllWalletsProvider } from "./services/wallets/AllWalletsProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});

const AppContent = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/issue" element={<IssuePage />} />
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const App = () => {
  return (
    <AllWalletsProvider>
      <AppContent />
    </AllWalletsProvider>
  );
};

export default App;
