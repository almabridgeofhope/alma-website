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
    // Only handle redirect on initial mount or when we're on index.html (from 404.html redirect)
    const isFrom404 = window.location.pathname === '/index.html' || 
                      window.location.pathname === '/' && sessionStorage.getItem('404-redirect-path');
    
    if (!hasHandledRedirect.current && isFrom404) {
      // Check if we have a stored redirect path from 404.html
      const redirectPath = sessionStorage.getItem('404-redirect-path');
      if (redirectPath) {
        const currentPath = location.pathname + location.search + location.hash;
        if (redirectPath !== currentPath) {
          console.log('[Handle404Redirect] Redirecting from 404.html to:', redirectPath);
          sessionStorage.removeItem('404-redirect-path');
          hasHandledRedirect.current = true;
          // Navigate to the stored path
          try {
            navigate(redirectPath, { replace: true });
          } catch (error) {
            console.error('Navigation error:', error);
            // Fallback: force page reload if navigation fails
            window.location.href = redirectPath;
          }
        } else {
          // Path matches, just clear the stored path
          sessionStorage.removeItem('404-redirect-path');
          hasHandledRedirect.current = true;
        }
        return;
      }
    }
    
    // Handle browser back/forward navigation issues
    // Only listen to popstate events, not regular navigation
    const handlePopState = (event: PopStateEvent) => {
      // Small delay to let React Router process the navigation first
      setTimeout(() => {
        const currentPath = window.location.pathname;
        // Only handle if we're on index.html but React Router thinks we're elsewhere
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
  }, [navigate]); // Remove location from dependencies to prevent re-running on every route change
  
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

  // Global keep-alive mechanism to prevent network timeouts
  useEffect(() => {
    let keepAliveInterval: NodeJS.Timeout | null = null;
    let lastActivityTime = Date.now();

    // Track user activity
    const updateActivity = () => {
      lastActivityTime = Date.now();
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Keep-alive mechanism - only when page is visible and user is inactive
    const startKeepAlive = () => {
      if (keepAliveInterval) return; // Already running

      keepAliveInterval = setInterval(() => {
        const timeSinceActivity = Date.now() - lastActivityTime;
        const isInactive = timeSinceActivity > 60000; // 1 minute of inactivity
        const isVisible = !document.hidden;

        // Only send keep-alive if page is visible and user has been inactive
        if (isVisible && isInactive && navigator.onLine) {
          // Send a lightweight HEAD request to keep connection alive
          fetch(window.location.origin, {
            method: 'HEAD',
            cache: 'no-cache',
            keepalive: true,
            signal: AbortSignal.timeout(5000), // 5 second timeout
          }).catch(() => {
            // Silently fail - this is just a keep-alive
          });
        }
      }, 30000); // Check every 30 seconds
    };

    // Start keep-alive when page becomes visible
    if (!document.hidden) {
      startKeepAlive();
    }

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Stop keep-alive when page is hidden
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }
      } else {
        // Restart keep-alive when page becomes visible
        startKeepAlive();
        lastActivityTime = Date.now(); // Reset activity time
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
    };
  }, []);

  return (
    <>
      <ScrollToTop />
      <CookieBanner />
      <Navigation />
      <Routes>
        <Route path="/" element={<Index />} />
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
