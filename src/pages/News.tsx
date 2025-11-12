import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import NewsList from "@/components/NewsList";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/project/water.jpg";
import { getNewsArticles, NewsArticle } from "@/data/newsArticles";

const News = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const newsArticles: NewsArticle[] = getNewsArticles(t);

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
    // Navigate to individual article page using date
    console.log('Navigating to:', `/news/${article.date}`);
    navigate(`/dev/news/${article.date}`);
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-hero" />
          
          <div className="relative z-10 text-center text-white max-w-4xl px-6">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t("news.hero.title")}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              {t("news.hero.subtitle")}
            </p>
          </div>
        </section>

        {/* All News Articles */}
        <NewsList
          articles={newsArticles}
          formatDate={formatDate}
          getCategoryColor={getCategoryColor}
          onReadMore={handleReadMore}
          title={t("news.all_news.title")}
          subtitle={t("news.all_news.subtitle")}
          readMoreLabel={t("news.read_more")}
        />

        {/* Newsletter Section */}
        <section className="pt-section pb-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                {t("news.newsletter.title")}
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {t("news.newsletter.subtitle")}
              </p>
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button"
              >
                {t("news.newsletter.button")}
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default News;
