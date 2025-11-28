import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import React, { useEffect } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ShoppingCartProvider } from "@/contexts/ShoppingCartContext";
import { CartSidebar } from "@/components/CartSidebar";
import Navigation from "@/components/Navigation";
import ScrollToTop from "@/components/ScrollToTop";
import CookieBanner from "@/components/CookieBanner";
import NetworkRecovery from "@/components/NetworkRecovery";
import Index from "./pages/Index";
import Team from "./pages/Team";
import Projects from "./pages/Projects";
import News from "./pages/News";
import Article from "./pages/Article";
import Contact from "./pages/Contact";
import Impressum from "./pages/Impressum";
import Privacy from "./pages/Privacy";
import Donation from "./pages/Donation";
import DonationSuccess from "./pages/DonationSuccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to handle 404 redirects from GitHub Pages and browser history
const Handle404Redirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasHandledRedirect = React.useRef(false);
  
  useEffect(() => {
    // Handle redirect immediately on mount or route change
    const redirectPath = sessionStorage.getItem('404-redirect-path');
    const currentPathname = window.location.pathname;
    const currentSearch = window.location.search;
    
    // If we're on /index.html and have a redirect path, navigate immediately
    if ((currentPathname === '/index.html' || currentPathname === '/') && redirectPath) {
      const targetPath = redirectPath.split('?')[0]; // Remove query string for comparison
      const targetSearch = redirectPath.includes('?') ? redirectPath.split('?')[1] : '';
      const currentRoute = location.pathname;
      const currentRouteSearch = location.search;
      
      // Always navigate if paths don't match, or if paths match but query params differ
      const pathsMatch = targetPath === currentRoute || targetPath === currentPathname;
      const queryParamsMatch = targetSearch === currentRouteSearch.replace('?', '');
      
      if (!pathsMatch || !queryParamsMatch) {
        console.log('[Handle404Redirect] Redirecting from 404.html to:', redirectPath);
        sessionStorage.removeItem('404-redirect-path');
        hasHandledRedirect.current = true;
        // Navigate immediately with full path including query parameters
        navigate(redirectPath, { replace: true });
        return;
      } else {
        // Path and query params already match, just clear the stored path
        sessionStorage.removeItem('404-redirect-path');
        hasHandledRedirect.current = true;
      }
    }
    
    // Handle browser back/forward navigation issues
    const handlePopState = (event: PopStateEvent) => {
      setTimeout(() => {
        const currentPath = window.location.pathname;
        if ((currentPath === '/index.html' || currentPath === '/') && currentPath !== location.pathname) {
          const storedPath = sessionStorage.getItem('404-redirect-path');
          if (storedPath) {
            console.log('[Handle404Redirect] PopState redirect to:', storedPath);
            sessionStorage.removeItem('404-redirect-path');
            try {
              navigate(storedPath, { replace: true });
            } catch (error) {
              console.error('Navigation error on popstate:', error);
            }
          }
        }
      }, 50);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate, location.pathname]);
  
  return null;
};

// Redirect component for /dev/* routes
const DevRedirect = () => {
  const location = useLocation();
  // Remove /dev prefix from pathname
  const newPath = location.pathname.replace(/^\/dev/, '') || '/';
  return <Navigate to={newPath} replace />;
};

const AppContent = () => {
  const location = useLocation();
  const isDonationPage = location.pathname === '/donation';

  // Debug: Log route changes
  useEffect(() => {
    console.log('[AppContent] Route changed to:', location.pathname);
  }, [location.pathname]);

  // Network connectivity monitoring and recovery
  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => {
      console.log('[AppContent] Network connection restored');
      // Optionally refresh critical data when coming back online
    };

    const handleOffline = () => {
      console.warn('[AppContent] Network connection lost');
    };

    // Listen for network status changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      <ScrollToTop />
      <CookieBanner />
      <Navigation />
      <Routes>
        <Route path="/" element={<Index />} />
        {/* Redirect /index.html to / to prevent 404 flash */}
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="/about" element={<Team />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:date" element={<Article />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/donation" element={<Donation />} />
        <Route path="/donation/success" element={<DonationSuccess />} />
        {/* Redirect all /dev/* routes to their non-dev equivalents */}
        <Route path="/dev/*" element={<DevRedirect />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isDonationPage && <CartSidebar basePath="" />}
      <NetworkRecovery />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <ShoppingCartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
            basename="/"
          >
            <Handle404Redirect />
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </ShoppingCartProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
