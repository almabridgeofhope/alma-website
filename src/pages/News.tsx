import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import NewsList from "@/components/NewsList";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/project/water.jpg";

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image: string;
  featured: boolean;
  additionalImages?: string[];
}

const News = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Sample news articles
  const newsArticles: NewsArticle[] = [
    {
      id: "1",
      title: t("news.article1.title"),
      excerpt: t("news.article1.excerpt"),
      content: t("news.article1.content"),
      author: t("news.article1.author"),
      date: "2024-12-15",
      category: t("news.categories.project_update"),
      image: "/src/assets/project/construction_house.png",
      additionalImages: [
        "/src/assets/project/header_construction.jpeg",
        "/src/assets/community/community_2.png"
      ],
      featured: false,
    },
    {
      id: "2",
      title: t("news.article2.title"),
      excerpt: t("news.article2.excerpt"),
      content: t("news.article2.content"),
      author: t("news.article2.author"),
      date: "2024-12-10",
      category: t("news.categories.community"),
      image: "/src/assets/community/community_2.png",
      additionalImages: [
        "/src/assets/community/children.png",
        "/src/assets/community/community_3.png"
      ],
      featured: false,
    },
    {
      id: "3",
      title: t("news.article3.title"),
      excerpt: t("news.article3.excerpt"),
      content: t("news.article3.content"),
      author: t("news.article3.author"),
      date: "2024-12-05",
      category: t("news.categories.organization"),
      image: "/src/assets/team/team.png",
      additionalImages: [
        "/src/assets/team/team_2.jpg"
      ],
      featured: false,
    },
  ];

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
    navigate(`/news/${article.date}`);
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
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button text-lg px-8 py-6"
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
