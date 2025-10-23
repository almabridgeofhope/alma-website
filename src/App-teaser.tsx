import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import TeaserIndex from "./pages/TeaserIndex";
import Teaser from "./pages/Teaser";
import Index from "./pages/Index";
import Team from "./pages/Team";
import Projects from "./pages/Projects";
import News from "./pages/News";
import Article from "./pages/Article";
import Contact from "./pages/Contact";
import Impressum from "./pages/Impressum";
import Privacy from "./pages/Privacy";
import Donation from "./pages/Donation";
import NotFound from "./pages/NotFound";
import { Toaster } from "@/components/ui/sonner";
import { Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<TeaserIndex />} />
            <Route path="/tbd" element={<Teaser />} />
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
        </HashRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
