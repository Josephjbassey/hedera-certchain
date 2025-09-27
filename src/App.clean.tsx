/**
 * App.tsx - Main Application Component
 * 
 * Description: Root application component that sets up routing, providers,
 * and global application state. Follows Betty coding style guidelines.
 * 
 * Author: Hedera CertChain Team
 * Created: September 27, 2025
 * Last Modified: September 27, 2025
 * 
 * Betty Style Guidelines:
 * - Component names in PascalCase
 * - Function names in snake_case for utilities
 * - Organized imports by category
 * - Clear component documentation
 */

/* React core imports */
import React from "react";

/* Third-party library imports */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

/* UI component imports */
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

/* Application component imports */
import { Layout } from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import IssuePage from "./pages/IssuePage";
import VerifyPage from "./pages/VerifyPage";
import NotFound from "./pages/NotFound";

/* Context and provider imports */
import { WalletProvider, useWallet } from "./contexts/WalletContext";
import { AllWalletsProvider } from "./services/wallets/AllWalletsProvider";

/* Utilities and logging */
import { log_info } from "@/shared/utils/logger.util";

/**
 * Initialize React Query client with default configuration
 */
const query_client = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, /* 5 minutes */
			refetchOnWindowFocus: false,
			retry: 3,
		},
	},
});

/**
 * AppContent - Main application content component
 * 
 * Description: Renders the main application content including routing
 * and layout components. Wrapped by providers for state management.
 * 
 * Return: JSX element containing the main application
 */
const AppContent: React.FC = () => {
	const { isConnected, user } = useWallet();

	/* Log application initialization */
	React.useEffect(() => {
		log_info('App', 'Application initialized');
	}, []);

	return (
		<QueryClientProvider client={query_client}>
			<TooltipProvider>
				{/* Toast notification components */}
				<Toaster />
				<Sonner />
				
				{/* Main application routing */}
				<BrowserRouter>
					<Layout 
						user={user} 
						onLogout={() => {
							log_info('App', 'User logout initiated');
						}}
					>
						<Routes>
							{/* Public routes */}
							<Route path="/" element={<LandingPage />} />
							<Route path="/verify" element={<VerifyPage />} />
							
							{/* Protected routes */}
							<Route path="/issue" element={<IssuePage />} />
							
							{/* Catch-all route - must be last */}
							<Route path="*" element={<NotFound />} />
						</Routes>
					</Layout>
				</BrowserRouter>
			</TooltipProvider>
		</QueryClientProvider>
	);
};

/**
 * App - Root application component
 * 
 * Description: Root component that wraps the application with all necessary
 * providers including wallet contexts and state management.
 * 
 * Return: JSX element containing the complete application
 */
const App: React.FC = () => {
	return (
		<AllWalletsProvider>
			<WalletProvider>
				<AppContent />
			</WalletProvider>
		</AllWalletsProvider>
	);
};

export default App;