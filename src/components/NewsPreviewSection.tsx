import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, User, ArrowRight, Tag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  image: string;
}

const NewsPreviewSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Sample news articles - same as in News.tsx
  const newsArticles: NewsArticle[] = [
    {
      id: "1",
      title: t("news.article1.title"),
      excerpt: t("news.article1.excerpt"),
      author: t("news.article1.author"),
      date: "2024-12-15",
      category: t("news.categories.project_update"),
      image: "/src/assets/project/construction_house.png",
    },
    {
      id: "2",
      title: t("news.article2.title"),
      excerpt: t("news.article2.excerpt"),
      author: t("news.article2.author"),
      date: "2024-12-10",
      category: t("news.categories.community"),
      image: "/src/assets/community/community_2.png",
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
    console.log('Original date:', article.date);
    const dateSlug = article.date
    console.log('Converted date:', dateSlug);
    console.log('Full URL:', `/news/${dateSlug}`);
    navigate(`/news/${dateSlug}`);
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <section id="news" className="pt-section pb-section bg-muted/30">
      <div className="max-w-content mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("news.hero.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("news.hero.subtitle")}
          </p>
        </div>

        {/* News Grid - Equal Size Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {newsArticles.map((article, index) => (
            <Card 
              key={article.id}
              className="overflow-hidden shadow-card hover:shadow-soft transition-all duration-300 group cursor-pointer h-full"
              onClick={() => handleReadMore(article)}
            >
              {/* Article Image */}
              <div className="relative overflow-hidden aspect-video">
                <img 
                  src={article.image} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                <div className="absolute top-3 left-3">
                  <Badge className={`${getCategoryColor(article.category)} font-medium`}>
                    <Tag className="w-3 h-3 mr-1" />
                    {article.category}
                  </Badge>
                </div>
              </div>

              {/* Article Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <User className="w-4 h-4" />
                  <span>{article.author}</span>
                  <span>•</span>
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(article.date)}</span>
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-4 line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                
                <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
                  {article.excerpt}
                </p>
                
                <div className="flex items-center text-primary hover:text-primary/80 group">
                  <span className="font-medium">Read More</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* View All News Button */}
        <div className="text-center">
          <Link 
            to="/news"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button"
            >
              View All News & Updates
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NewsPreviewSection;
