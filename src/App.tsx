import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ShoppingCartProvider } from "@/contexts/ShoppingCartContext";
import { CartSidebar } from "@/components/CartSidebar";
import Navigation from "@/components/Navigation";
import ScrollToTop from "@/components/ScrollToTop";
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

  return (
    <>
      <ScrollToTop />
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
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </ShoppingCartProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
