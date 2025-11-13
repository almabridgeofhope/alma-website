import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ShoppingCartProvider } from "@/contexts/ShoppingCartContext";
import { CartSidebar } from "@/components/CartSidebar";
import Navigation from "@/components/Navigation";
import Index from "./pages/Index";
import Team from "./pages/Team";
import Projects from "./pages/Projects";
import News from "./pages/News";
import Article from "./pages/Article";
import Contact from "./pages/Contact";
import Impressum from "./pages/Impressum";
import Privacy from "./pages/Privacy";
import Donation from "./pages/Donation";
import TeaserIndex from "./pages/TeaserIndex";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isDevRoute = location.pathname.startsWith('/dev');
  const basePath = isDevRoute ? '/dev' : '';
  const isDonationPage = location.pathname === '/dev/donation' || location.pathname === '/donation';

  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<TeaserIndex />} />
        <Route path="/dev" element={<Index />} />
        <Route path="/dev/about" element={<Team />} />
        <Route path="/dev/projects" element={<Projects />} />
        <Route path="/dev/news" element={<News />} />
        <Route path="/dev/news/:date" element={<Article />} />
        <Route path="/dev/contact" element={<Contact />} />
        <Route path="/dev/impressum" element={<Impressum />} />
        <Route path="/dev/privacy" element={<Privacy />} />
        <Route path="/dev/donation" element={<Donation />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isDonationPage && <CartSidebar basePath={basePath} />}
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
          <HashRouter>
            <AppContent />
          </HashRouter>
        </TooltipProvider>
      </ShoppingCartProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
