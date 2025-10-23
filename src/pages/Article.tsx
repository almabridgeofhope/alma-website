import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, User, ArrowLeft, Tag, Quote } from "lucide-react";
import constructionHouseImage from "@/assets/project/construction_house.png";
import communityImage from "@/assets/community/community_2.png";
import headerConstructionImage from "@/assets/project/header_construction.jpeg";
import childrenImage from "@/assets/community/children.png";
import community3Image from "@/assets/community/community_3.png";
import teamImage from "@/assets/team/team.png";
import teamImage2 from "@/assets/team/team_2.jpg";

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

const Article = () => {
  const { date } = useParams<{ date: string }>();
  const { t } = useLanguage();

  // Sample news articles - same as in News.tsx
  const newsArticles: NewsArticle[] = [
    {
      id: "1",
      title: t("news.article1.title"),
      excerpt: t("news.article1.excerpt"),
      content: t("news.article1.content"),
      author: t("news.article1.author"),
      date: "2024-12-15",
      category: t("news.categories.project_update"),
      image: constructionHouseImage,
      additionalImages: [
        headerConstructionImage,
        communityImage
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
      image: communityImage,
      additionalImages: [
        childrenImage,
        community3Image
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
      image: teamImage2,
      additionalImages: [
        teamImage
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

  // The date parameter is already in YYYY-MM-DD format
  console.log('Article page - received date:', date);
  console.log('Available articles:', newsArticles.map(a => a.date));
  
  // Find the article by date
  const article = newsArticles.find(article => article.date === date);

  if (!article) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="pt-16">
          <div className="max-w-content mx-auto px-6 py-16 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {t("news.article_not_found.title")}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              {t("news.article_not_found.subtitle")}
            </p>
            <Link 
              to="/news"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("news.back_to_news")}
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-16">
        {/* Back Button */}
        <section className="pt-8 pb-4 bg-background">
          <div className="max-w-content mx-auto px-6">
            <Link 
              to="/news"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("news.back_to_news")}
              </Button>
            </Link>
          </div>
        </section>

        {/* Article Header */}
        <section className="pb-8 bg-background">
          <div className="max-w-4xl mx-auto px-6">
            <div className="mb-6">
              <Badge className={getCategoryColor(article.category)}>
                <Tag className="w-3 h-3 mr-1" />
                {article.category}
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {article.title}
            </h1>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{article.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(article.date)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Article Image */}
        <section className="pb-8 bg-background">
          <div className="max-w-4xl mx-auto px-6">
            <div className="relative overflow-hidden rounded-lg aspect-video">
              <img 
                src={article.image} 
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="pb-section bg-background">
          <div className="max-w-4xl mx-auto px-6">
            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                {article.excerpt}
              </p>
              
              <div className="text-base text-foreground leading-relaxed space-y-8">
                {/* Introduction */}
                <div>
                  <p className="text-lg leading-relaxed">
                    {t(`news.article${article.id}.sections.introduction`)}
                  </p>
                </div>

                {/* Quote Component */}
                <div className="my-12 p-8 bg-primary/5 border-l-4 border-primary rounded-r-lg">
                  <div className="flex items-start gap-4">
                    <Quote className="w-8 h-8 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <blockquote className="text-xl font-medium text-foreground italic leading-relaxed mb-4">
                        "{t("news.quote.text")}"
                      </blockquote>
                      <cite className="text-sm text-muted-foreground">
                        — {t("news.quote.author")}
                      </cite>
                    </div>
                  </div>
                </div>

                {/* Section Headline */}
                <div className="my-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    {article.id === "1" ? "Building the Future Together" : article.id === "2" ? "Community at the Heart" : "Growing Our Team"}
                  </h2>
                </div>

                {/* Progress/Impact Section */}
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    {article.id === "1" ? t("news.article1.sections.progress") : 
                     article.id === "2" ? t("news.article2.sections.participation") : 
                     t("news.article3.sections.growth")}
                  </h3>
                  <ul className="space-y-4">
                    {(article.id === "1" ? t("news.article1.sections.progress_points") : 
                      article.id === "2" ? t("news.article2.sections.participation_points") : 
                      t("news.article3.sections.growth_points")).split('|').map((point: string, index: number) => (
                      <li key={index} className="flex items-center gap-4">
                        <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0"></div>
                        <span className="leading-relaxed text-base">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Community Impact Section */}
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    {article.id === "1" ? t("news.article1.sections.community_impact") : 
                     article.id === "2" ? t("news.article2.sections.impact") : 
                     t("news.article3.sections.impact")}
                  </h3>
                  <ul className="space-y-4">
                    {(article.id === "1" ? t("news.article1.sections.community_points") : 
                      article.id === "2" ? t("news.article2.sections.impact_points") : 
                      t("news.article3.sections.impact_points")).split('|').map((point: string, index: number) => (
                      <li key={index} className="flex items-center gap-4">
                        <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0"></div>
                        <span className="leading-relaxed text-base">{point}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Additional Images */}
                  {article.additionalImages && article.additionalImages.length > 0 && (
                    <div className="mt-8 grid md:grid-cols-2 gap-6">
                      {article.additionalImages.map((image, index) => (
                        <div key={index} className="relative overflow-hidden rounded-lg aspect-video">
                          <img 
                            src={image} 
                            alt={`${article.title} - Image ${index + 2}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Next Steps/Success Factors Section */}
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    {article.id === "1" ? t("news.article1.sections.next_steps") : 
                     article.id === "2" ? t("news.article2.sections.success_factors") : 
                     t("news.article3.sections.future")}
                  </h3>
                  <ul className="space-y-4">
                    {(article.id === "1" ? t("news.article1.sections.next_steps_points") : 
                      article.id === "2" ? t("news.article2.sections.success_factors_points") : 
                      t("news.article3.sections.future_points")).split('|').map((point: string, index: number) => (
                      <li key={index} className="flex items-center gap-4">
                        <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0"></div>
                        <span className="leading-relaxed text-base">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Conclusion - only for articles 1 and 2 */}
                {article.id !== "3" && (
                  <div className="bg-muted/30 p-6 rounded-lg">
                    <p className="text-lg leading-relaxed font-medium">
                      {t(`news.article${article.id}.sections.conclusion`)}
                    </p>
                  </div>
                )}


                {/* Donation Form */}
                <Card className="my-12 border-primary/20">
                  <CardContent className="p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        {t("news.donation.title")}
                      </h3>
                      <p className="text-muted-foreground">
                        {t("news.donation.subtitle")}
                      </p>
                    </div>
                    <div className="max-w-md mx-auto">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <Button variant="outline" className="h-12 text-lg">
                          €25
                        </Button>
                        <Button variant="outline" className="h-12 text-lg">
                          €50
                        </Button>
                        <Button variant="outline" className="h-12 text-lg">
                          €100
                        </Button>
                        <Button variant="outline" className="h-12 text-lg">
                          €250
                        </Button>
                      </div>
                      <Button size="lg" className="w-full h-12 text-lg">
                        {t("news.donation.button")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Back to News Button */}
        <section className="pt-8 pb-section bg-muted/30">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Link 
              to="/news"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("news.back_to_news")}
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Article;
