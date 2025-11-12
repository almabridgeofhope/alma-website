import { useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, User, ArrowLeft, Tag, Quote, ArrowRight } from "lucide-react";
import { getNewsArticles, NewsArticle } from "@/data/newsArticles";

const Article = () => {
  const { date } = useParams<{ date: string }>();
  const { t } = useLanguage();

  const newsArticles: NewsArticle[] = getNewsArticles(t);
  const navigate = useNavigate();
  const handleNavigate = useCallback(
    (targetDate: string) => {
      navigate(`/dev/news/${targetDate}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate]
  );

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
              to="/dev/news"
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

  const bodyQuote = article.body?.quote;
  const quoteText = bodyQuote?.text?.trim() || t("news.quote.text");
  const quoteAuthor = bodyQuote?.author?.trim() || t("news.quote.author");
  const shouldShowQuote = (article.body?.showQuote ?? true) && Boolean(quoteText);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-16">
        {/* Back Button */}
        <section className="pt-8 pb-4 bg-background">
          <div className="max-w-content mx-auto px-6">
            <Link 
              to="/dev/news"
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
                {article.body?.introduction && article.body.introduction.length > 0 && (
                  <div className="space-y-4">
                    {article.id === "4" ? (() => {
                      const inlineImage = article.additionalImages?.[0];
                      const firstTwoParagraphs = article.body?.introduction.slice(0, 2).filter(Boolean) ?? [];
                      const remainingParagraphs = article.body?.introduction.slice(2) ?? [];

                      return (
                        <>
                          <div className="text-lg leading-relaxed md:flex md:items-start md:gap-6">
                            <div className="space-y-4 md:flex-1">
                              {firstTwoParagraphs.map((paragraph, idx) => (
                                <p key={`intro-${idx}`} className="text-lg leading-relaxed">
                                  {paragraph}
                                </p>
                              ))}
                            </div>
                            {inlineImage && (
                              <div className="mt-4 md:mt-0 md:w-56 md:flex-shrink-0">
                                <div className="relative overflow-hidden rounded-lg shadow-soft">
                                  <img
                                    src={inlineImage}
                                    alt={`${article.title} illustration`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {remainingParagraphs.map((paragraph, idx) => (
                            <p key={`intro-rest-${idx}`} className="text-lg leading-relaxed">
                              {paragraph}
                            </p>
                          ))}
                        </>
                      );
                    })() : (
                      article.body.introduction.map((paragraph, index) => (
                        <p key={index} className="text-lg leading-relaxed">
                          {paragraph}
                        </p>
                      ))
                    )}
                  </div>
                )}

                {/* Quote Component */}
                {shouldShowQuote && (
                  <div className="my-12 p-8 bg-primary/5 border-l-4 border-primary rounded-r-lg">
                    <div className="flex items-start gap-4">
                      <Quote className="w-8 h-8 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <blockquote className="text-xl font-medium text-foreground italic leading-relaxed mb-4">
                          "{quoteText}"
                        </blockquote>
                        {quoteAuthor && (
                          <cite className="text-sm text-muted-foreground">
                            — {quoteAuthor}
                          </cite>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Highlight Title */}
                {article.body?.highlightTitle && (
                  <div className="my-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                      {article.body.highlightTitle}
                    </h2>
                  </div>
                )}

                {/* Dynamic Sections */}
                {article.body?.sections?.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="space-y-4">
                    <h3 className="text-2xl font-bold text-foreground">
                      {section.title}
                    </h3>

                    {section.paragraphs && section.paragraphs.length > 0 && (
                      <div className="space-y-4">
                        {section.paragraphs.map((paragraph, paragraphIndex) => (
                          <p key={paragraphIndex} className="leading-relaxed text-base">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    )}

                    {section.stats && section.stats.length > 0 && (
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {section.stats.map((stat, statIndex) => (
                          <Card
                            key={statIndex}
                            className="p-6 text-center bg-primary/5 border border-primary/10 shadow-none"
                          >
                            <div className="text-3xl font-bold text-primary mb-2">
                              {stat.value}
                            </div>
                            <p className="text-sm text-muted-foreground leading-snug">
                              {stat.label}
                            </p>
                          </Card>
                        ))}
                      </div>
                    )}

                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="space-y-4">
                        {section.bullets.map((point, bulletIndex) => (
                          <li key={bulletIndex} className="flex items-start gap-4">
                            <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                            <span className="leading-relaxed text-base">{point}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}

                {/* Additional Images */}
                {(() => {
                  const inlineImage =
                    article.id === "4" ? article.additionalImages?.[0] : undefined;
                  const galleryImages = inlineImage
                    ? article.additionalImages?.slice(1)
                    : article.additionalImages;

                  if (!galleryImages || galleryImages.length === 0) {
                    return null;
                  }

                  return (
                  <div className="mt-12 grid md:grid-cols-2 gap-6">
                    {galleryImages.map((image, index) => (
                      <div key={index} className="relative overflow-hidden rounded-lg aspect-video">
                        <img 
                          src={image} 
                          alt={`${article.title} - Image ${index + 2}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                  );
                })()}

                {(article.body?.conclusion?.length || article.body?.conclusionCTA) && (
                  <div className="bg-muted/30 p-6 rounded-lg space-y-4">
                    {article.body?.conclusion?.map((paragraph, index) => (
                      <p key={index} className="text-lg leading-relaxed font-medium">
                        {paragraph}
                      </p>
                    ))}
                    {article.body?.conclusionCTA && (
                      <div className="space-y-8">
                        {article.body.conclusionCTA.text && (
                          <p className="text-lg leading-relaxed font-medium">
                            {article.body.conclusionCTA.text}
                          </p>
                        )}
                        <Link
                          to={article.body.conclusionCTA.url}
                          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        >
                          <Button
                            size="lg"
                            className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                          >
                            {article.body.conclusionCTA.buttonLabel ??
                              article.body.conclusionCTA.text}
                          </Button>
                        </Link>
                      </div>
                    )}
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

        {/* Related Articles */}
        <section className="pt-8 pb-section bg-muted/30">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              {t("news.related_articles.title")}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {newsArticles
                .filter(relatedArticle => relatedArticle.id !== article.id)
                .map((relatedArticle) => (
                  <div
                    key={relatedArticle.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => handleNavigate(relatedArticle.date)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleNavigate(relatedArticle.date);
                      }
                    }}
                    className="overflow-hidden shadow-card hover:shadow-soft transition-all duration-300 group animate-fade-in bg-card rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    <div className="relative aspect-video">
                      <img
                        src={relatedArticle.image}
                        alt={relatedArticle.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <div className="mb-3">
                        <Badge className={getCategoryColor(relatedArticle.category)}>
                          <Tag className="w-3 h-3 mr-1" />
                          {relatedArticle.category}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-2">
                        {relatedArticle.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {relatedArticle.excerpt}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <User className="w-3 h-3" />
                        <span>{relatedArticle.author}</span>
                        <span>•</span>
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(relatedArticle.date)}</span>
                      </div>
                      <div className="flex items-center text-primary group-hover:text-primary/80">
                        <span className="text-sm font-medium">{t("news.read_more")}</span>
                        <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* Back to News Button */}
        <section className="pt-8 pb-section bg-muted/30">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Link 
              to="/dev/news"
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
