import { useCallback, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, User, ArrowLeft, Tag, Quote, ArrowRight, Euro, CheckCircle, Shield, BrickWall, Layers, Droplets, Sofa, Paintbrush, Zap, Toilet, Package, AlertCircle, Home, ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";
import { getNewsArticles, NewsArticle, isUnpublishedArticle } from "@/data/newsArticles";
import AgeDistributionChart from "@/components/AgeDistributionChart";
import GenderDistributionChart from "@/components/GenderDistributionChart";
import { useProjectCosts } from "@/hooks/useProjectCosts";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import MediaCarousel from "@/components/MediaCarousel";
import NewYearLetterLink from "@/components/NewYearLetterLink";
import { cn } from "@/lib/utils";

const Article = () => {
  const { date } = useParams<{ date: string }>();
  const { t, language } = useLanguage();
  const { getProjectCost } = useProjectCosts();

  const newsArticles: NewsArticle[] = getNewsArticles(t);
  const navigate = useNavigate();
  const [selectedDonationAmount, setSelectedDonationAmount] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxOpen(false);
      } else if (e.key === "ArrowLeft" && selectedImages.length > 1) {
        setSelectedImageIndex((prev) => (prev - 1 + selectedImages.length) % selectedImages.length);
      } else if (e.key === "ArrowRight" && selectedImages.length > 1) {
        setSelectedImageIndex((prev) => (prev + 1) % selectedImages.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, selectedImages.length]);

  const handleNavigate = useCallback(
    (targetDate: string) => {
      navigate(`/news/${targetDate}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate]
  );

  const handleDonationNavigate = useCallback(() => {
    const query = selectedDonationAmount ? `?amount=${selectedDonationAmount}` : "";
    navigate(`/donation${query}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [navigate, selectedDonationAmount]);

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

  const bodyQuote = article.body?.quote;
  const quoteText = bodyQuote?.text?.trim() || t("news.quote.text");
  const quoteAuthor = bodyQuote?.author?.trim() || t("news.quote.author");
  const shouldShowQuote = (article.body?.showQuote ?? true) && Boolean(quoteText);
  
  const bodyQuote2 = article.body?.quote2;
  const quote2Text = bodyQuote2?.text?.trim();
  const quote2Author = bodyQuote2?.author?.trim();
  const shouldShowQuote2 = Boolean(quote2Text);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-16">
        {/* Article Header */}
        <section className={`pt-section pb-section bg-background ${article.isLetter ? 'bg-gradient-to-b from-background to-muted/10' : ''}`}>
          <div className={`max-w-4xl mx-auto px-6 ${article.isLetter ? 'max-w-3xl' : ''}`}>
            <Link 
              to="/news"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("news.back_to_news")}
              </Button>
            </Link>

            <div className="mb-6 flex flex-wrap gap-3">
              <Badge className={getCategoryColor(article.category)}>
                <Tag className="w-3 h-3 mr-1" />
                {article.category}
              </Badge>
              {isUnpublishedArticle(article.date) && (
                <Badge className="bg-red-500 text-white font-medium border-2 border-red-600">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Unveröffentlicht
                </Badge>
              )}
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
        <section className="pb-section bg-background">
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
        <section className={`pb-section bg-background ${article.isLetter ? 'bg-gradient-to-b from-background to-muted/20' : ''}`}>
          <div className={`max-w-4xl mx-auto px-6 ${article.isLetter ? 'max-w-3xl' : ''}`}>
            <div className={`prose prose-lg max-w-none ${article.isLetter ? 'prose-slate' : ''}`}>
              {!article.isLetter && (
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  {article.excerpt}
                </p>
              )}

              {/* Photo-based article layout */}
              {article.isPhotoBased && article.photoGallery && (
                <div className="my-16 md:my-24">
                  {/* Community House Project Overview for article 11 */}
                  {article.id === "11" && (() => {
                    const projectCost = getProjectCost("Building the Community House");
                    const communityProject = {
                      title: t("projects.community.title"),
                      teaser: t("projects.community.teaser"),
                      description: t("projects.community.description"),
                      goals: [
                        t("projects.community.goal1"),
                        t("projects.community.goal2"),
                        t("projects.community.goal3"),
                      ],
                      impact: t("projects.community.impact"),
                    };

                    return (
                      <Card className="mb-12 md:mb-16 overflow-hidden shadow-card">
                        <div className="p-6 md:p-8">
                          {/* Header with Icon */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-primary/10 rounded-xl">
                              <Home className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                                {communityProject.title}
                              </h3>
                              <p className="text-sm text-muted-foreground italic">
                                {communityProject.teaser}
                              </p>
                            </div>
                          </div>
                          
                          {/* Description */}
                          <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                            {communityProject.description}
                          </p>

                          {/* Two Column Layout: Goals & Impact */}
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Goals */}
                            <div>
                              <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary rounded-full" />
                                {t("projects.goals")}
                              </h4>
                              <ul className="space-y-2">
                                {communityProject.goals.map((goal, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <span className="text-primary text-lg mt-0.5 flex-shrink-0">•</span>
                                    <span className="leading-relaxed">{goal}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Impact */}
                            <div>
                              <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary rounded-full" />
                                {t("projects.impact_label")}
                              </h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {communityProject.impact}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })()}

                  {/* Introduction text - highlighted, shown before gallery */}
                  {article.body?.introduction && article.body.introduction.length > 0 && (
                    <div className="mb-12 md:mb-16 space-y-6 max-w-3xl mx-auto">
                      <p className="text-2xl md:text-3xl font-light text-center leading-relaxed text-foreground">
                        {article.body.introduction[0]}
                      </p>
                      {article.body.introduction.length > 1 && (
                        <div className="space-y-4">
                          {article.body.introduction.slice(1).map((paragraph, index) => (
                            <p 
                              key={index + 1} 
                              className="text-lg md:text-xl leading-relaxed text-foreground"
                            >
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <MediaCarousel gallery={article.photoGallery} />
                </div>
              )}

              {/* Progress Bar and Phases for Community House - for photo-based articles after gallery */}
              {article.isPhotoBased && (article.id === "9" || article.id === "11") && (() => {
                const projectCost = getProjectCost("Building the Community House");
                if (!projectCost) return null;
                
                const formatCurrency = (amount: number, currency: string = "EUR") => {
                  try {
                    return new Intl.NumberFormat(language === "de" ? "de-DE" : "en-US", {
                      style: "currency",
                      currency,
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(amount);
                  } catch {
                    return `${amount.toFixed ? amount.toFixed(0) : amount} ${currency}`;
                  }
                };

                // Extract phases in order
                const itemsSortedByOrder = [...projectCost.items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                const phases: string[] = [];
                const seenPhases = new Set<string>();
                for (const item of itemsSortedByOrder) {
                  if (!seenPhases.has(item.phase)) {
                    seenPhases.add(item.phase);
                    phases.push(item.phase);
                  }
                }

                // Helper functions
                const getItemPhaseName = (item: any): string => {
                  if (language === "de" && item.phaseDe) {
                    return item.phaseDe;
                  }
                  return item.phase;
                };

                const getPhaseNameTranslated = (phase: string): string => {
                  const itemWithPhase = projectCost.items.find(item => item.phase === phase);
                  if (itemWithPhase) {
                    return getItemPhaseName(itemWithPhase);
                  }
                  return phase;
                };

                const getPhaseIcon = (phase: string) => {
                  const phaseLower = phase.toLowerCase();
                  if (phaseLower.includes('security')) return <Shield className="w-5 h-5" />;
                  if ((phaseLower.includes('outer') && phaseLower.includes('walls')) || 
                      (phaseLower.includes('outer') && phaseLower.includes('floor')) ||
                      (phaseLower.includes('walls') && phaseLower.includes('flooring'))) {
                    return <BrickWall className="w-5 h-5" />;
                  }
                  if (phaseLower.includes('foundation') && phaseLower.includes('sealing')) {
                    return <Layers className="w-5 h-5" />;
                  }
                  if (phaseLower.includes('water') && phaseLower.includes('system')) {
                    return <Droplets className="w-5 h-5" />;
                  }
                  if (phaseLower.includes('septic') || phaseLower.includes('soak')) {
                    return <Droplets className="w-5 h-5" />;
                  }
                  if (phaseLower.includes('interior') && phaseLower.includes('furniture')) {
                    return <Sofa className="w-5 h-5" />;
                  }
                  if (phaseLower.includes('innenwände') || 
                      (phaseLower.includes('interior') && phaseLower.includes('walls'))) {
                    return <Paintbrush className="w-5 h-5" />;
                  }
                  if (phaseLower.includes('electricity') && phaseLower.includes('lighting')) {
                    return <Zap className="w-5 h-5" />;
                  }
                  if (phaseLower.includes('bathroom') && phaseLower.includes('sanitary')) {
                    return <Toilet className="w-5 h-5" />;
                  }
                  return <Package className="w-5 h-5" />;
                };

                // Calculate phase progress
                const phaseGroups = phases.map(phase => {
                  const phaseItems = projectCost.items.filter(item => item.phase === phase);
                  const phaseBudget = phaseItems.reduce((sum, item) => sum + (item.totalCostEUR || 0), 0);
                  const phaseSpent = phaseItems.reduce((sum, item) => sum + (item.fundedCostEUR || 0), 0);
                  const phaseProgress = phaseBudget > 0 ? (phaseSpent / phaseBudget) * 100 : 0;
                  
                  return {
                    phase,
                    name: getPhaseNameTranslated(phase),
                    budget: phaseBudget,
                    spent: phaseSpent,
                    progress: Math.min(100, phaseProgress),
                    isCompleted: phaseProgress >= 100,
                    isPartiallyCompleted: phaseProgress > 0 && phaseProgress < 100,
                  };
                });

                return (
                  <div className="my-12 space-y-6">
                    <h3 className="text-2xl font-bold text-foreground">
                      {language === "de" ? "Bauphasen" : "Construction Phases"}
                    </h3>
                    {phaseGroups.map((phaseGroup, index) => {
                      const Icon = () => getPhaseIcon(phaseGroup.phase);
                      const phaseUrl = `/projects?section=community-house#${encodeURIComponent(phaseGroup.phase)}`;
                      return (
                        <Link
                          key={phaseGroup.phase}
                          to={phaseUrl}
                          className="block"
                        >
                          <Card
                            className={`p-4 transition-all cursor-pointer hover:shadow-md ${
                              phaseGroup.isCompleted
                                ? "bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-300"
                                : "bg-gradient-to-br from-gray-50 to-gray-100/50 border-2 border-gray-300"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                                phaseGroup.isCompleted
                                  ? "bg-green-500"
                                  : "bg-gray-400"
                              }`}>
                                {phaseGroup.isCompleted ? (
                                  <CheckCircle className="w-6 h-6 text-white" />
                                ) : (
                                  <div className="text-white">
                                    {getPhaseIcon(phaseGroup.phase)}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-semibold text-foreground">
                                    {phaseGroup.name}
                                  </h5>
                                  <span className={`text-sm font-semibold ${
                                    phaseGroup.isCompleted
                                      ? "text-green-700"
                                      : "text-gray-600"
                                  }`}>
                                    {phaseGroup.progress.toFixed(0)}%
                                  </span>
                                </div>
                                <Progress
                                  value={phaseGroup.progress}
                                  className={`h-2 ${
                                    phaseGroup.isCompleted
                                      ? "[&>div]:bg-green-500"
                                      : "[&>div]:bg-gray-400"
                                  }`}
                                />
                                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                                  <span>
                                    {formatCurrency(phaseGroup.spent, projectCost.currency)} / {formatCurrency(phaseGroup.budget, projectCost.currency)}
                                  </span>
                                  {phaseGroup.isCompleted && (
                                    <span className="text-green-700 font-medium">
                                      {language === "de" ? "Abgeschlossen" : "Completed"}
                                    </span>
                                  )}
                                  {!phaseGroup.isCompleted && (
                                    <span className="text-gray-600 font-medium">
                                      {language === "de" ? "Ausstehend" : "Pending"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Quote Component - shown after excerpt and before introduction */}
              {shouldShowQuote && article.id !== "9" && !article.isPhotoBased && (
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

              {/* Image Carousel for article 9 */}
              {article.id === "9" && article.additionalImages && article.additionalImages.length > 0 && (
                <div className="my-12">
                  <Carousel
                    opts={{
                      align: "start",
                      loop: true,
                    }}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-2 md:-ml-4">
                      {article.additionalImages.map((image, index) => (
                        <CarouselItem key={index} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                          <div className="p-1">
                            <Card className="overflow-hidden">
                              <div className="relative overflow-hidden rounded-lg aspect-video">
                                <img
                                  src={image}
                                  alt={`${article.title} - Image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </Card>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                </div>
              )}
              
              <div className={`text-base text-foreground leading-relaxed space-y-8 ${article.isLetter ? 'space-y-6' : ''}`}>
                {/* Introduction */}
                {article.body?.introduction && article.body.introduction.length > 0 && article.id !== "9" && !article.isPhotoBased && (
                  <div className={`space-y-4 ${article.isLetter ? 'space-y-3 mb-8' : ''}`}>
                    {article.isLetter ? (
                      <div className="space-y-3 text-lg leading-relaxed">
                        {article.body.introduction.map((paragraph, index) => (
                          <p key={index} className={index === 0 ? "font-medium" : ""}>
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    ) : article.id === "4" ? (() => {
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

                {/* Images for article 8 - shown after introduction - clickable with lightbox */}
                {article.id === "8" && article.additionalImages && article.additionalImages.length > 0 && (
                  <div className="my-12 grid md:grid-cols-2 gap-6">
                    {article.additionalImages.map((image, index) => (
                      <div
                        key={index}
                        className="relative group cursor-pointer overflow-hidden rounded-lg aspect-video bg-muted"
                        onClick={() => {
                          setSelectedImages(article.additionalImages || []);
                          setSelectedImageIndex(index);
                          setLightboxOpen(true);
                        }}
                      >
                        <img 
                          src={image} 
                          alt={`${article.title} - Image ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Overlay with zoom icon */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm rounded-full p-3">
                            <ZoomIn className="w-6 h-6 text-gray-900" />
                          </div>
                        </div>
                      </div>
                    ))}
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
                  <div key={sectionIndex} className={`space-y-4 ${article.isLetter ? 'mt-8 first:mt-0' : ''}`}>
                    <h3 className={`${article.isLetter ? 'text-xl font-semibold text-foreground mb-4' : 'text-2xl font-bold text-foreground'}`}>
                      {section.title}
                    </h3>

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

                    {section.paragraphs && section.paragraphs.length > 0 && (
                      <div className={`space-y-4 ${article.isLetter ? 'space-y-3' : ''}`}>
                        {section.paragraphs.map((paragraph, paragraphIndex) => (
                          <p key={paragraphIndex} className={`leading-relaxed ${article.isLetter ? 'text-base' : 'text-base'}`}>
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Photo Gallery for section */}
                    {section.photoGallery && (
                      <div className="my-8">
                        <MediaCarousel gallery={section.photoGallery} />
                      </div>
                    )}

                    {/* New Year Letter Link for article 12 outlook section */}
                    {article.id === "12" && section.title === t("news.article12.sections.outlook.title") && (
                      <NewYearLetterLink />
                    )}

                    {/* Charts for Population section in article 4 */}
                    {article.id === "4" && section.title === t("news.article4.sections.population.title") && (
                      <div className="grid md:grid-cols-2 gap-8 my-8">
                        <div className="bg-card border border-border rounded-lg px-6 pt-6 pb-2 shadow-sm">
                          <AgeDistributionChart />
                        </div>
                        <div className="bg-card border border-border rounded-lg px-6 pt-6 pb-2 shadow-sm">
                          <GenderDistributionChart />
                        </div>
                      </div>
                    )}

                    {section.subsections && section.subsections.length > 0 && (
                      <div className="space-y-6">
                        {section.subsections.map((subsection, subsectionIndex) => (
                          <div key={subsectionIndex} className="space-y-2">
                            <h4 className="text-xl font-semibold text-foreground">
                              {subsectionIndex + 1}. {subsection.title}
                            </h4>
                            {subsection.paragraphs && subsection.paragraphs.length > 0 && (
                              <div className="space-y-3 pl-6">
                                {subsection.paragraphs.map((paragraph, paragraphIndex) => (
                                  <p key={paragraphIndex} className="leading-relaxed text-base">
                                    {paragraph}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="space-y-4">
                        {section.bullets.map((point, bulletIndex) => {
                          const parts = point.split("|");
                          const title = parts[0];
                          const description = parts.slice(1).join("|");
                          return (
                            <li key={bulletIndex} className="flex items-start gap-4">
                              <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                              <div className="flex-1">
                                {description ? (
                                  <>
                                    <span className="leading-relaxed text-base font-semibold">{title}</span>
                                    <span className="leading-relaxed text-base block mt-1">{description}</span>
                                  </>
                                ) : (
                                  <span className="leading-relaxed text-base">{point}</span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {/* CTA for section */}
                    {section.cta && (
                      <div className="mt-8">
                        <Link to={section.cta.url}>
                          <Button className="w-full sm:w-auto">
                            {section.cta.buttonLabel || t("news.read_more")}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ))}

                {/* Additional Images */}
                {(() => {
                  // Skip images for article 8 and 9 as they're shown elsewhere
                  if (article.id === "8" || article.id === "9") {
                    return null;
                  }
                  
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

                {/* Progress Bar and Phases for Community House - at the end of article 9 (article 11 shows it after gallery) */}
                {article.id === "9" && (() => {
                  const projectCost = getProjectCost("Building the Community House");
                  if (!projectCost) return null;
                  
                  const formatCurrency = (amount: number, currency: string = "EUR") => {
                    try {
                      return new Intl.NumberFormat(language === "de" ? "de-DE" : "en-US", {
                        style: "currency",
                        currency,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(amount);
                    } catch {
                      return `${amount.toFixed ? amount.toFixed(0) : amount} ${currency}`;
                    }
                  };

                  // Extract phases in order
                  const itemsSortedByOrder = [...projectCost.items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                  const phases: string[] = [];
                  const seenPhases = new Set<string>();
                  for (const item of itemsSortedByOrder) {
                    if (!seenPhases.has(item.phase)) {
                      seenPhases.add(item.phase);
                      phases.push(item.phase);
                    }
                  }

                  // Helper functions
                  const getItemPhaseName = (item: any): string => {
                    if (language === "de" && item.phaseDe) {
                      return item.phaseDe;
                    }
                    return item.phase;
                  };

                  const getPhaseNameTranslated = (phase: string): string => {
                    const itemWithPhase = projectCost.items.find(item => item.phase === phase);
                    if (itemWithPhase) {
                      return getItemPhaseName(itemWithPhase);
                    }
                    return phase;
                  };

                  const getPhaseIcon = (phase: string) => {
                    const phaseLower = phase.toLowerCase();
                    if (phaseLower.includes('security')) return <Shield className="w-5 h-5" />;
                    if ((phaseLower.includes('outer') && phaseLower.includes('walls')) || 
                        (phaseLower.includes('outer') && phaseLower.includes('floor')) ||
                        (phaseLower.includes('walls') && phaseLower.includes('flooring'))) {
                      return <BrickWall className="w-5 h-5" />;
                    }
                    if (phaseLower.includes('foundation') && phaseLower.includes('sealing')) {
                      return <Layers className="w-5 h-5" />;
                    }
                    if (phaseLower.includes('water') && phaseLower.includes('system')) {
                      return <Droplets className="w-5 h-5" />;
                    }
                    if (phaseLower.includes('septic') || phaseLower.includes('soak')) {
                      return <Droplets className="w-5 h-5" />;
                    }
                    if (phaseLower.includes('interior') && phaseLower.includes('furniture')) {
                      return <Sofa className="w-5 h-5" />;
                    }
                    if (phaseLower.includes('innenwände') || 
                        (phaseLower.includes('interior') && phaseLower.includes('walls'))) {
                      return <Paintbrush className="w-5 h-5" />;
                    }
                    if (phaseLower.includes('electricity') && phaseLower.includes('lighting')) {
                      return <Zap className="w-5 h-5" />;
                    }
                    if (phaseLower.includes('bathroom') && phaseLower.includes('sanitary')) {
                      return <Toilet className="w-5 h-5" />;
                    }
                    return <Package className="w-5 h-5" />;
                  };

                  // Calculate phase progress
                  const phaseGroups = phases.map(phase => {
                    const phaseItems = projectCost.items.filter(item => item.phase === phase);
                    const phaseBudget = phaseItems.reduce((sum, item) => sum + (item.totalCostEUR || 0), 0);
                    const phaseSpent = phaseItems.reduce((sum, item) => sum + (item.fundedCostEUR || 0), 0);
                    const phaseProgress = phaseBudget > 0 ? (phaseSpent / phaseBudget) * 100 : 0;
                    
                    return {
                      phase,
                      name: getPhaseNameTranslated(phase),
                      budget: phaseBudget,
                      spent: phaseSpent,
                      progress: Math.min(100, phaseProgress),
                      isCompleted: phaseProgress >= 100,
                      isPartiallyCompleted: phaseProgress > 0 && phaseProgress < 100,
                    };
                  });

                  return (
                    <div className="my-12 space-y-6">
                      <h3 className="text-2xl font-bold text-foreground">
                        {language === "de" ? "Bauphasen" : "Construction Phases"}
                      </h3>
                      {phaseGroups.map((phaseGroup, index) => {
                        const Icon = () => getPhaseIcon(phaseGroup.phase);
                        const phaseUrl = `/projects?section=community-house#${encodeURIComponent(phaseGroup.phase)}`;
                        return (
                          <Link
                            key={phaseGroup.phase}
                            to={phaseUrl}
                            className="block"
                          >
                            <Card
                              className={`p-4 transition-all cursor-pointer hover:shadow-md ${
                                phaseGroup.isCompleted
                                  ? "bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-300"
                                  : "bg-gradient-to-br from-gray-50 to-gray-100/50 border-2 border-gray-300"
                              }`}
                            >
                            <div className="flex items-start gap-4">
                              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                                phaseGroup.isCompleted
                                  ? "bg-green-500"
                                  : "bg-gray-400"
                              }`}>
                                {phaseGroup.isCompleted ? (
                                  <CheckCircle className="w-6 h-6 text-white" />
                                ) : (
                                  <div className="text-white">
                                    {getPhaseIcon(phaseGroup.phase)}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-semibold text-foreground">
                                    {phaseGroup.name}
                                  </h5>
                                  <span className={`text-sm font-semibold ${
                                    phaseGroup.isCompleted
                                      ? "text-green-700"
                                      : "text-gray-600"
                                  }`}>
                                    {phaseGroup.progress.toFixed(0)}%
                                  </span>
                                </div>
                                <Progress
                                  value={phaseGroup.progress}
                                  className={`h-2 ${
                                    phaseGroup.isCompleted
                                      ? "[&>div]:bg-green-500"
                                      : "[&>div]:bg-gray-400"
                                  }`}
                                />
                                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                                  <span>
                                    {formatCurrency(phaseGroup.spent, projectCost.currency)} / {formatCurrency(phaseGroup.budget, projectCost.currency)}
                                  </span>
                                  {phaseGroup.isCompleted && (
                                    <span className="text-green-700 font-medium">
                                      {language === "de" ? "Abgeschlossen" : "Completed"}
                                    </span>
                                  )}
                                  {!phaseGroup.isCompleted && (
                                    <span className="text-gray-600 font-medium">
                                      {language === "de" ? "Ausstehend" : "Pending"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })()}

                {(article.body?.conclusion?.length || article.body?.conclusionCTA) && (
                  <div className={article.isLetter
                    ? "my-12 space-y-4 mt-16"
                    : article.id === "9" 
                    ? "my-12 space-y-6" 
                    : "bg-primary/5 border border-primary/20 rounded-xl p-6 shadow-soft space-y-5"
                  }>
                    {article.body?.conclusion?.map((paragraph, index) => (
                      <p
                        key={index}
                        className={article.isLetter
                          ? `text-base leading-relaxed text-foreground text-right ${index === 0 ? 'font-signature text-4xl md:text-3xl text-primary' : 'mt-2'}`
                          : article.id === "9" 
                          ? "text-lg leading-relaxed text-foreground"
                          : "text-lg leading-relaxed font-semibold text-foreground"
                        }
                      >
                        {paragraph}
                      </p>
                    ))}

                    {article.body?.conclusionCTA?.text && article.id !== "9" && (
                      <p className="text-lg leading-relaxed font-medium text-foreground">
                        {article.body.conclusionCTA.text}
                      </p>
                    )}

                    {article.body?.conclusionCTA && article.id === "9" ? (
                      // Alternative Design für Artikel 9: Inline-Link mit Pfeil
                      <div className="pt-4 border-t border-border">
                        <Link
                          to={article.body.conclusionCTA.url}
                          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                          className="group inline-flex items-center text-primary hover:text-primary/80 transition-colors"
                        >
                          <span className="text-lg font-medium">
                            {article.body.conclusionCTA.buttonLabel || article.body.conclusionCTA.text}
                          </span>
                          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    ) : article.body?.conclusionCTA ? (
                      // Standard Design für andere Artikel
                      <div className="flex justify-center">
                        <Link
                          to={article.body.conclusionCTA.url}
                          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        >
                          <Button
                            size="lg"
                            className="w-full sm:w-auto"
                          >
                            {article.body.conclusionCTA.buttonLabel ??
                              article.body.conclusionCTA.text}
                          </Button>
                        </Link>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Second Quote Component - shown before donation form */}
                {shouldShowQuote2 && (
                  <div className="my-12 p-8 bg-primary/5 border-l-4 border-primary rounded-r-lg">
                    <div className="flex items-start gap-4">
                      <Quote className="w-8 h-8 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <blockquote className="text-xl font-medium text-foreground italic leading-relaxed mb-4">
                          "{quote2Text}"
                        </blockquote>
                        {quote2Author && (
                          <cite className="text-sm text-muted-foreground">
                            — {quote2Author}
                          </cite>
                        )}
                      </div>
                    </div>
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
                        {[10, 25, 50, 100].map((amount) => {
                          const isSelected = selectedDonationAmount === amount;
                          return (
                            <Button
                              key={amount}
                              variant={isSelected ? "default" : "outline"}
                              className="h-12 text-lg"
                              onClick={() => setSelectedDonationAmount(amount)}
                            >
                              €{amount}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        size="lg"
                        className="w-full h-12 text-lg"
                        onClick={handleDonationNavigate}
                      >
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
        <section className="pb-section bg-muted/30">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              {t("news.related_articles.title")}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {newsArticles
                .filter(relatedArticle => relatedArticle.id !== article.id)
                .slice(0, 2)
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
                      {isUnpublishedArticle(relatedArticle.date) && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-red-500 text-white font-medium border-2 border-red-600">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Unveröffentlicht
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="mb-3 flex flex-wrap gap-2">
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
        <section className="pb-section bg-muted/30">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Link 
              to="/news"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Button size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("news.back_to_news")}
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />

      {/* Lightbox Modal for Images */}
      {lightboxOpen && selectedImages.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
            className="absolute top-6 right-6 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 transition-all duration-200 group"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
          </button>

          {/* Previous Button */}
          {selectedImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((prev) => (prev - 1 + selectedImages.length) % selectedImages.length);
              }}
              className="absolute left-6 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-4 transition-all duration-200 group"
              aria-label="Previous"
            >
              <ChevronLeft className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* Next Button */}
          {selectedImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((prev) => (prev + 1) % selectedImages.length);
              }}
              className="absolute right-6 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-4 transition-all duration-200 group"
              aria-label="Next"
            >
              <ChevronRight className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* Image Container */}
          <div
            className="w-full h-full flex items-center justify-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImages[selectedImageIndex]}
              alt={`Image ${selectedImageIndex + 1}`}
              className="max-w-[95vw] max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
              style={{ aspectRatio: 'auto' }}
            />
          </div>

          {/* Navigation Info */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white/60 text-xs text-center">
            <div>{language === "de" ? "Drücke ESC zum Schließen" : "Press ESC to close"}</div>
            {selectedImages.length > 1 && (
              <div className="mt-1">
                {selectedImageIndex + 1} / {selectedImages.length} • {language === "de" ? "Pfeiltasten zum Navigieren" : "Arrow keys to navigate"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Article;
