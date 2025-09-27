import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import IssuePage from "./pages/IssuePage";
import VerifyPage from "./pages/VerifyPage";
import NotFound from "./pages/NotFound";
import { WalletProvider, useWallet } from "./contexts/WalletContext";
import { AllWalletsProvider } from "./services/wallets/AllWalletsProvider";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isConnected, user } = useWallet();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout user={user} onLogout={() => {}}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/issue" element={<IssuePage />} />
              <Route path="/verify" element={<VerifyPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
      <WalletProvider>
        <AppContent />
      </WalletProvider>
    </AllWalletsProvider>
  );
};

export default App;
