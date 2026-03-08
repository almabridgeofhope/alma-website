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
import Membership from "./pages/Membership";
import MembershipSuccess from "./pages/MembershipSuccess";
import GiftDonations from "./pages/GiftDonations";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to handle 404 redirects from GitHub Pages and browser history
const Handle404Redirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectHandled = React.useRef(false);
  
  useEffect(() => {
    // Only process redirect once per page load
    if (redirectHandled.current) {
      return;
    }
    
    const redirectPath = sessionStorage.getItem('404-redirect-path');
    
    // If we have a redirect path, process it
    if (redirectPath) {
      const targetPath = redirectPath.split('?')[0];
      const targetSearch = redirectPath.includes('?') ? redirectPath.split('?')[1] : '';
      const currentPathname = window.location.pathname;
      const currentRoute = location.pathname;
      const currentRouteSearch = location.search;
      
      // Normalize search strings for comparison
      const normalizeSearch = (search: string) => search.replace(/^\?/, '').split('&').sort().join('&');
      const targetSearchNormalized = normalizeSearch(targetSearch);
      const currentSearchNormalized = normalizeSearch(currentRouteSearch);
      
      // Check if we're already on the target path
      const isOnTargetPath = 
        (currentRoute === targetPath || currentPathname === targetPath) &&
        (targetSearchNormalized === currentSearchNormalized || !targetSearch);
      
      if (isOnTargetPath) {
        // Already on target, just clear the stored path
        console.log('[Handle404Redirect] Already on target path:', redirectPath);
        sessionStorage.removeItem('404-redirect-path');
        redirectHandled.current = true;
        return;
      }
      
      // We need to redirect - only do this if we're on /index.html or /
      const shouldRedirect = 
        currentPathname === '/index.html' || 
        currentPathname === '/' || 
        currentRoute === '/index.html' || 
        currentRoute === '/';
      
      if (shouldRedirect) {
        console.log('[Handle404Redirect] Redirecting from', currentPathname || currentRoute, 'to:', redirectPath);
        redirectHandled.current = true;
        sessionStorage.removeItem('404-redirect-path');
        
        // Use requestAnimationFrame to ensure navigation happens after React Router is ready
        requestAnimationFrame(() => {
          navigate(redirectPath, { replace: true });
        });
        return;
      }
    }
    
    // Handle browser back/forward navigation issues
    const handlePopState = (event: PopStateEvent) => {
      if (redirectHandled.current) {
        return;
      }
      
      setTimeout(() => {
        const currentPath = window.location.pathname;
        const storedPath = sessionStorage.getItem('404-redirect-path');
        
        if (storedPath && (currentPath === '/index.html' || currentPath === '/')) {
          console.log('[Handle404Redirect] PopState redirect to:', storedPath);
          sessionStorage.removeItem('404-redirect-path');
          redirectHandled.current = true;
          try {
            navigate(storedPath, { replace: true });
          } catch (error) {
            console.error('Navigation error on popstate:', error);
          }
        }
      }, 50);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate, location.pathname, location.search]);
  
  return null;
};

// Redirect component for /dev/* routes
const DevRedirect = () => {
  const location = useLocation();
  // Remove /dev prefix from pathname
  const newPath = location.pathname.replace(/^\/dev/, '') || '/';
  return <Navigate to={newPath} replace />;
};

// Conditional redirect for /index.html - only redirect to / if we don't have a stored redirect path
const IndexHtmlRedirect = () => {
  const [shouldRedirect, setShouldRedirect] = React.useState(false);
  
  useEffect(() => {
    // Check for redirect path with a small delay to let Handle404Redirect process first
    const checkRedirect = () => {
      const redirectPath = sessionStorage.getItem('404-redirect-path');
      // If we have a redirect path, don't redirect to / - let Handle404Redirect handle it
      if (!redirectPath) {
        setShouldRedirect(true);
      }
    };
    
    // Small delay to ensure Handle404Redirect runs first
    const timer = setTimeout(checkRedirect, 10);
    return () => clearTimeout(timer);
  }, []);
  
  if (!shouldRedirect) {
    return null;
  }
  
  return <Navigate to="/" replace />;
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
        {/* Redirect /index.html to / to prevent 404 flash, but only if no redirect path is stored */}
        <Route path="/index.html" element={<IndexHtmlRedirect />} />
        <Route path="/about" element={<Team />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:date" element={<Article />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/membership/success" element={<MembershipSuccess />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/donation" element={<Donation />} />
        <Route path="/donation/success" element={<DonationSuccess />} />
        <Route path="/spenden-statt-geschenke" element={<GiftDonations />} />
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
