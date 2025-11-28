import { useLocation } from "react-router-dom";
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, ArrowLeft, Search, Mail, ArrowRight, Calendar, User, Tag } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { getNewsArticles, NewsArticle } from "@/data/newsArticles";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [shouldRender, setShouldRender] = React.useState(true);

  useEffect(() => {
    // Don't show 404 if we're in the middle of a redirect from 404.html
    const redirectPath = sessionStorage.getItem('404-redirect-path');
    const currentPathname = window.location.pathname;
    
    // If we're on /index.html and have a redirect path, don't render the 404 page
    if ((currentPathname === '/index.html' || currentPathname === '/') && redirectPath) {
      setShouldRender(false);
      // Clear after a short delay to allow redirect to complete
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setShouldRender(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Only log error if we're actually showing the 404 page
    if (shouldRender && location.pathname !== '/index.html') {
      console.error(
        "404 Error: User attempted to access non-existent route:",
        location.pathname
      );
    }
  }, [location.pathname, shouldRender]);

  // Don't render if we're in the middle of a redirect
  if (!shouldRender) {
    return null;
  }

  const featuredArticles: NewsArticle[] = getNewsArticles(t).slice(0, 3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(t("news.date_format"), {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      [t("news.categories.project_update")]: "bg-blue-100 text-blue-800",
      [t("news.categories.community")]: "bg-green-100 text-green-800",
      [t("news.categories.organization")]: "bg-purple-100 text-purple-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const handleReadMore = (article: NewsArticle) => {
    const dateSlug = article.date;
    navigate(`/news/${dateSlug}`);
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10" />
          
          {/* Content */}
          <div className="relative z-10 text-center max-w-4xl px-6 mx-auto">
            {/* 404 Number */}
            <div className="mb-8">
              <h1 className="text-8xl md:text-9xl font-bold text-primary/20 mb-4">
                404
              </h1>
            </div>
            
            {/* Main Message */}
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {t("404.title")}
              </h2>
              <p className="text-xl text-muted-foreground mb-4">
                {t("404.subtitle")}
              </p>
              <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto">
                {t("404.description")}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg">
                <Link 
                  to="/" 
                  className="flex items-center gap-2"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <Home size={20} />
                  {t("404.button_home")}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link 
                  to="/projects" 
                  className="flex items-center gap-2"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <Search size={20} />
                  {t("404.button_projects")}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link 
                  to="/contact" 
                  className="flex items-center gap-2"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <Mail size={20} />
                  {t("404.button_contact")}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Articles Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-content mx-auto px-6">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                {t("404.helpful_links")}
              </h3>
              <p className="text-muted-foreground">
                {t("404.suggestions")}
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {featuredArticles.map((article, index) => (
                <div 
                  key={article.id}
                  className="overflow-hidden shadow-card hover:shadow-soft transition-all duration-300 group animate-fade-in bg-card rounded-lg border cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => handleReadMore(article)}
                >
                  {/* Image */}
                  <div className="relative overflow-hidden aspect-video">
                    <img 
                      src={article.image} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    <div className="absolute top-3 left-3">
                      <Badge className={getCategoryColor(article.category)}>
                        <Tag className="w-3 h-3 mr-1" />
                        {article.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <User className="w-3 h-3" />
                      <span>{article.author}</span>
                      <span>•</span>
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(article.date)}</span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                      {article.excerpt}
                    </p>
                    
                    <div className="flex items-center text-primary hover:text-primary/80 group">
                      <span className="text-sm font-medium">Read More</span>
                      <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
