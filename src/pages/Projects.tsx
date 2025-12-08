import { ReactNode, useEffect, MouseEvent, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ProjectItemsModal } from "@/components/ProjectItemsModal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Home, Droplets, Sprout, BookOpen, Car, Users, Sun, Droplet, Calendar as CalendarIcon, Package } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProjectCosts } from "@/hooks/useProjectCosts";
import { Link, useLocation, useNavigate } from "react-router-dom";
import OptimizedImage from "@/components/OptimizedImage";
import PreloadImage from "@/components/PreloadImage";
import heroImage from "@/assets/project/community_house/header_construction.webp";
import communityHouseImage from "@/assets/project/community_house/construction_house.webp";
import waterImage from "@/assets/project/well.webp";
import agricultureImage from "@/assets/project/goat_farm.webp";
import educationImage from "@/assets/project/pupils_2.webp";
import busImage from "@/assets/project/bus.webp";
import financialImage from "@/assets/project/education_5.webp";
import { ProjectCost } from "@/services/clientGoogleSheetsService";

type TimelinePhase = "planning" | "implementation" | "impact";

interface Project {
  title: string;
  icon: typeof Home;
  teaser: string;
  description: string;
  descriptionNode?: ReactNode;
  goals: string[];
  impact: string;
  statusText: string;
  progress: number;
  currentPhase: TimelinePhase;
  image: string;
  buttonText: string;
  priority: "active" | "planned";
  anchorId?: string;
}

const Projects = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { error: costsError, getProjectCost, refreshCosts, loading: costsLoading } = useProjectCosts();
  const [activeCostProject, setActiveCostProject] = useState<ProjectCost | null>(null);

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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(
        language === "de" ? "de-DE" : "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      );
    } catch {
      return dateString;
    }
  };
  
  const timelinePhases = [
    { id: "planning", icon: "🌱", label: t("projects.timeline.planning") },
    { id: "implementation", icon: "💧", label: t("projects.timeline.implementation") },
    { id: "impact", icon: "🌾", label: t("projects.timeline.impact") },
  ];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get("section");
    const hash = decodeURIComponent(location.hash.replace('#', ''));
    
    // Don't open modal if it's already closed (user clicked close)
    // Only open if hash exists and modal is not already open
    if (!activeCostProject && hash && hash !== 'all') {
      // If we have both section and hash, open modal immediately and scroll together
      if (section) {
        // Open modal immediately
        const allProjects = [...activeProjects, ...plannedProjects];
        for (const project of allProjects) {
          const projectCost = getProjectCost(project.title);
          if (projectCost) {
            const hasPhase = projectCost.items.some(item => item.phase === hash);
            if (hasPhase) {
              setActiveCostProject(projectCost);
              break;
            }
          }
        }
        
        // Scroll to section instantly (no animation) so modal appears in correct position
        const target = document.getElementById(section);
        if (target) {
          // Use instant scroll first, then smooth if needed
          target.scrollIntoView({ behavior: "auto", block: "start" });
        }
      } else {
        // Only hash, no section - find project and section, then open modal
        const allProjects = [...activeProjects, ...plannedProjects];
        for (const project of allProjects) {
          const projectCost = getProjectCost(project.title);
          if (projectCost) {
            const hasPhase = projectCost.items.some(item => item.phase === hash);
            if (hasPhase) {
              setActiveCostProject(projectCost);
              // Scroll to section if anchorId exists
              if (project.anchorId) {
                const target = document.getElementById(project.anchorId);
                if (target) {
                  target.scrollIntoView({ behavior: "auto", block: "start" });
                }
              }
              break;
            }
          }
        }
      }
    } else if (section && !hash) {
      // Only section, no hash - normal scroll
      const target = document.getElementById(section);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [location, getProjectCost, activeCostProject]);

  const mobilityDescription = t("projects.mobility.description");
  const anchorClasses = "text-primary underline underline-offset-4";
  const schoolAccessUrl = "/projects?section=school-access";
  const youngMobilityUrl = "/projects?section=young-mobility";
  const anchorHref = `/${schoolAccessUrl}`;
  const mobilityAnchorHref = `/${youngMobilityUrl}`;
  const germanTarget = t("projects.mobility.target.de");
  const englishTarget = t("projects.mobility.target.en");

  const handleAnchorClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(schoolAccessUrl);
  };

  const handleMobilityAnchorClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(youngMobilityUrl);
  };

  let mobilityDescriptionNode: ReactNode | undefined;
  let sponsorshipDescriptionNode: ReactNode | undefined;

  if (language === "de" && mobilityDescription.includes(germanTarget)) {
    const [before, after] = mobilityDescription.split(germanTarget);
    mobilityDescriptionNode = (
      <>
        {before}
        <a
          href={anchorHref}
          className={anchorClasses}
          onClick={handleAnchorClick}
        >
          {germanTarget}
        </a>
        {after}
      </>
    );
  } else if (language === "en" && mobilityDescription.includes(englishTarget)) {
    const [before, after] = mobilityDescription.split(englishTarget);
    mobilityDescriptionNode = (
      <>
        {before}
        <a
          href={anchorHref}
          className={anchorClasses}
          onClick={handleAnchorClick}
        >
          {englishTarget}
        </a>
        {after}
      </>
    );
  }

  const sponsorshipDescription = t("projects.sponsorship.description");
  const germanMobilityTarget = t("projects.sponsorship.target");
  const englishMobilityTarget = t("projects.sponsorship.target");

  if (language === "de" && sponsorshipDescription.includes(germanMobilityTarget)) {
    const [before, after] = sponsorshipDescription.split(germanMobilityTarget);
    sponsorshipDescriptionNode = (
      <>
        {before}
        <a
          href={mobilityAnchorHref}
          className={anchorClasses}
          onClick={handleMobilityAnchorClick}
        >
          {germanMobilityTarget}
        </a>
        {after}
      </>
    );
  } else if (language === "en" && sponsorshipDescription.includes(englishMobilityTarget)) {
    const [before, after] = sponsorshipDescription.split(englishMobilityTarget);
    sponsorshipDescriptionNode = (
      <>
        {before}
        <a
          href={mobilityAnchorHref}
          className={anchorClasses}
          onClick={handleMobilityAnchorClick}
        >
          {englishMobilityTarget}
        </a>
        {after}
      </>
    );
  }

  const activeProjects: Project[] = [
    {
      title: t("projects.community.title"),
      icon: Home,
      teaser: t("projects.community.teaser"),
      description: t("projects.community.description"),
      goals: [
        t("projects.community.goal1"),
        t("projects.community.goal2"),
        t("projects.community.goal3"),
      ],
      impact: t("projects.community.impact"),
      statusText: t("projects.community.status"),
      progress: 65,
      currentPhase: "implementation",
      image: communityHouseImage,
      buttonText: t("projects.community.button"),
      priority: "active",
      anchorId: "community-house",
    },
    {
      title: t("projects.well.title"),
      icon: Droplets,
      teaser: t("projects.well.teaser"),
      description: t("projects.well.description"),
      goals: [
        t("projects.well.goal1"),
        t("projects.well.goal2"),
        t("projects.well.goal3"),
      ],
      impact: t("projects.well.impact"),
      statusText: t("projects.well.status"),
      progress: 15,
      currentPhase: "planning",
      image: waterImage,
      buttonText: t("projects.well.button"),
      priority: "active",
    },
  ];

  const plannedProjects: Project[] = [
    {
      title: t("projects.livestock.title"),
      icon: Sprout,
      teaser: t("projects.livestock.teaser"),
      description: t("projects.livestock.description"),
      goals: [
        t("projects.livestock.goal1"),
        t("projects.livestock.goal2"),
        t("projects.livestock.goal3"),
      ],
      impact: t("projects.livestock.impact"),
      statusText: t("projects.livestock.status"),
      progress: 10,
      currentPhase: "planning",
      image: agricultureImage,
      buttonText: t("projects.livestock.button"),
      priority: "planned",
    },
    {
      title: t("projects.mobility.title"),
      icon: Car,
      teaser: t("projects.mobility.teaser"),
      description: mobilityDescription,
      descriptionNode: mobilityDescriptionNode,
      goals: [
        t("projects.mobility.goal1"),
        t("projects.mobility.goal2"),
        t("projects.mobility.goal3"),
      ],
      impact: t("projects.mobility.impact"),
      statusText: t("projects.mobility.status"),
      progress: 5,
      currentPhase: "planning",
      image: busImage,
      buttonText: t("projects.mobility.button"),
      priority: "planned",
      anchorId: "young-mobility",
    },
    {
      title: t("projects.sponsorship.title"),
      icon: BookOpen,
      teaser: t("projects.sponsorship.teaser"),
      description: sponsorshipDescription,
      descriptionNode: sponsorshipDescriptionNode,
      goals: [
        t("projects.sponsorship.goal1"),
        t("projects.sponsorship.goal2"),
      ],
      impact: t("projects.sponsorship.impact"),
      statusText: t("projects.sponsorship.status"),
      progress: 5,
      currentPhase: "planning",
      image: educationImage,
      buttonText: t("projects.sponsorship.button"),
      priority: "planned",
      anchorId: "school-access",
    },
    {
      title: t("projects.financial.title"),
      icon: BookOpen,
      teaser: t("projects.financial.teaser"),
      description: t("projects.financial.description"),
      goals: [
        t("projects.financial.goal1"),
        t("projects.financial.goal2"),
        t("projects.financial.goal3"),
      ],
      impact: t("projects.financial.impact"),
      statusText: t("projects.financial.status"),
      progress: 5,
      currentPhase: "planning",
      image: financialImage,
      buttonText: t("projects.financial.button"),
      priority: "planned",
    }
  ];

  const renderProjectCard = (project: Project, index: number) => {
    const Icon = project.icon;
    const isEven = index % 2 === 0;
    const projectCost = getProjectCost(project.title);
    const currentPhaseIndex = timelinePhases.findIndex(p => p.id === project.currentPhase);
    const spentPercentage = projectCost
      ? projectCost.totalBudget > 0
        ? Math.min(100, (projectCost.spentAmount / projectCost.totalBudget) * 100)
        : 0
      : null;
    const displayProgressValue = spentPercentage ?? project.progress;
    const statusProgressLabel = spentPercentage !== null ? `${Math.round(spentPercentage)}%` : `${project.progress}%`;
    const detailedProgressLabel = spentPercentage !== null ? `${spentPercentage.toFixed(1)}%` : statusProgressLabel;
    const costTitle = t("projects.cost.title");
    const fundedLabel = t("projects.cost.funded");
    const remainingLabel = t("projects.cost.remaining");
    const costProgressLabel = t("projects.cost.progress");
    const detailsLabel = t("projects.cost.details");
    
    return (
      <div 
        key={index}
        id={project.anchorId}
        className="animate-fade-in"
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <Card className={`overflow-hidden shadow-card hover:shadow-soft transition-all duration-500 group ${
          project.priority === "active" ? "bg-primary-light/30" : "bg-card"
        }`}>
          <div className={`grid md:grid-cols-2 gap-0 ${!isEven ? 'md:grid-flow-dense' : ''}`}>
            {/* Image Section */}
            <div 
              className={`relative overflow-hidden h-full min-h-[350px] md:min-h-[450px] ${!isEven ? 'md:col-start-2' : ''}`}
            >
              <OptimizedImage
                src={project.image} 
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                containerClassName="h-full"
                lazy={true}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-800/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-x-0 bottom-0">
                <div className="bg-gradient-to-t from-slate-800/85 via-slate-700/65 to-transparent px-4 sm:px-6 py-3 sm:py-4 text-white backdrop-blur-[2px] pointer-events-auto">
                  <div className="flex flex-col gap-2 sm:gap-3 z-10 relative">
                    <div className="flex flex-wrap items-center gap-2">
                      {timelinePhases.map((phase, phaseIndex) => {
                        const isActive = phaseIndex === currentPhaseIndex;
                        const isPast = phaseIndex < currentPhaseIndex;
                        const tooltipTitle = t(`projects.timeline.${phase.id}`);
                        const activeDescription = isActive ? project.statusText?.trim() ?? "" : "";
                        const badge = (
                          <span
                            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-semibold uppercase tracking-wide transition-colors ${
                              isActive
                                ? "bg-white text-slate-900 shadow-lg"
                                : isPast
                                ? "bg-white/40 text-white"
                                : "bg-white/20 text-white/70"
                            }`}
                            role="status"
                            aria-label={
                              activeDescription
                                ? `${tooltipTitle} – ${activeDescription}`
                                : tooltipTitle
                            }
                          >
                            <span className="text-base leading-none">{phase.icon}</span>
                            <span className="leading-tight">{phase.label}</span>
                          </span>
                        );

                        if (!activeDescription) {
                          return (
                            <div key={phase.id} className="flex items-center">
                              {badge}
                            </div>
                          );
                        }

                        return (
                          <Tooltip key={phase.id} delayDuration={100}>
                            <TooltipTrigger asChild>{badge}</TooltipTrigger>
                            <TooltipContent side="top" sideOffset={12} align="center" className="max-w-xs text-left">
                              <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
                                {tooltipTitle}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {activeDescription}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>

                    <div className="relative">
                      {costsLoading ? (
                        // Show empty cost container skeleton while loading
                        <div className="min-h-[100px]">
                          <div className="rounded-2xl border border-white/20 bg-white/85 px-4 sm:px-5 py-3 text-slate-900 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-white/75 transition-colors animate-pulse">
                            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                              <div className="flex-1 min-w-[140px]">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">
                                  {costTitle}
                                </p>
                                <div className="h-5 bg-gray-200 rounded mt-1 w-24" />
                              </div>
                              <div className="flex-1 min-w-[120px]">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">
                                  {fundedLabel}
                                </p>
                                <div className="h-5 bg-gray-200 rounded mt-1 w-20" />
                              </div>
                              <div className="flex-1 min-w-[120px]">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">
                                  {remainingLabel}
                                </p>
                                <div className="h-5 bg-gray-200 rounded mt-1 w-20" />
                              </div>
                            </div>
                            <div className="mt-3 flex flex-col gap-2">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <span>{costProgressLabel}</span>
                                <div className="h-4 bg-gray-200 rounded w-12" />
                              </div>
                              <div className="h-2 rounded-full bg-gray-200" />
                              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] sm:text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="w-3.5 h-3.5" />
                                  <div className="h-4 bg-gray-200 rounded w-20" />
                                </div>
                                <div className="h-6 bg-gray-200 rounded-full w-24" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : projectCost ? (
                        <div className="min-h-[100px]">
                          <div 
                            className="rounded-2xl border border-white/20 bg-white/85 px-4 sm:px-5 py-3 text-slate-900 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-white/75 transition-colors cursor-pointer hover:bg-white/95"
                            onClick={(e) => {
                              // Don't trigger if clicking on the button itself
                              if ((e.target as HTMLElement).closest('button')) {
                                return;
                              }
                              setActiveCostProject(projectCost);
                            }}
                          >
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                          <div className="flex-1 min-w-[140px]">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">
                              {costTitle}
                            </p>
                            <p className="text-sm sm:text-base font-bold">
                              {formatCurrency(projectCost.totalBudget, projectCost.currency)}
                            </p>
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">
                              {fundedLabel}
                            </p>
                            <p className="text-sm sm:text-base font-semibold text-emerald-600">
                              {formatCurrency(projectCost.spentAmount, projectCost.currency)}
                            </p>
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">
                              {remainingLabel}
                            </p>
                            <p className="text-sm sm:text-base font-semibold text-orange-600">
                              {formatCurrency(projectCost.remainingAmount, projectCost.currency)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-col gap-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <span>{costProgressLabel}</span>
                            <span className="text-slate-900">{detailedProgressLabel}</span>
                          </div>
                          <Progress
                            value={spentPercentage ?? 0}
                            className="h-2 rounded-full bg-primary/15 [&>div]:rounded-full [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:via-primary/90 [&>div]:to-primary/70"
                          />
                          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] sm:text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              <span>{formatDate(projectCost.lastUpdated)}</span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => setActiveCostProject(projectCost)}
                              className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm hover:bg-primary/90 focus-visible:ring-white/50"
                            >
                              <Package className="w-3 h-3" />
                              {detailsLabel}
                            </Button>
                          </div>
                        </div>
                          </div>
                        </div>
                      ) : (
                        <div className="sm:min-w-[200px]">
                          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-white">
                            <span className="uppercase tracking-wide text-white/100">
                              {t("projects.progress_label")}
                            </span>
                            <span className="text-white">{statusProgressLabel}</span>
                          </div>
                          <Progress value={displayProgressValue} className="mt-2 h-1.5 bg-white/25" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4 sm:p-5 md:p-6 lg:p-8 flex flex-col justify-between">
              <div>
                {/* Header with Icon */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors duration-300">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                      {project.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground italic">
                      {project.teaser}
                    </p>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-sm sm:text-base text-muted-foreground mb-4 leading-relaxed">
                  {project.descriptionNode ?? project.description}
                </p>

                {/* Two Column Layout: Goals & Impact */}
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-3">
                  {/* Goals */}
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary rounded-full" />
                      {t("projects.goals")}
                    </h4>
                    <ul className="space-y-1.5">
                      {project.goals.map((goal, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                          <span className="text-primary text-sm sm:text-lg mt-0.5 flex-shrink-0">•</span>
                          <span className="leading-relaxed">{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Impact */}
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary rounded-full" />
                      {t("projects.impact_label")}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {project.impact}
                    </p>
                  </div>
                </div>
                {!projectCost && costsError && (
                  <Card className="p-3 sm:p-4 bg-red-50 border border-red-200 text-sm text-red-600">
                    {t("projects.cost.error").replace("{error}", costsError)}
                  </Card>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
          <PreloadImage src={heroImage} />
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-hero" />
          
          <div className="relative z-10 text-center text-white max-w-4xl px-6">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t("projects.hero.title")}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              {t("projects.hero.subtitle")}
            </p>
          </div>
        </section>

        {/* Introduction Section */}
        <section className="pt-section pb-8 bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 text-center">
                {t("projects.intro.title")}
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p>{t("projects.intro.p1")}</p>
                <p>{t("projects.intro.p2")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Active Projects Section */}
        <section className="pt-8 pb-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {t("projects.active.title")}
              </h2>
            </div>
            
            <div className="space-y-16">
              {activeProjects.map((project, index) => renderProjectCard(project, index))}
            </div>
          </div>
        </section>

        {/* Planned Projects Section */}
        <section className="pt-section pb-section bg-muted/30">
          <div className="max-w-content mx-auto px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {t("projects.planned.title")}
              </h2>
            </div>
            
            <div className="space-y-16">
              {plannedProjects.map((project, index) => renderProjectCard(project, index + activeProjects.length))}
            </div>

          </div>
        </section>

        {/* Impact Section */}
        <section className="pt-section pb-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                {t("projects.impact.title")}
              </h2>
            </div>

            {/* Impact Facts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="p-6 text-center bg-gradient-to-br from-primary-light/20 to-primary-light/10 border-primary/20 hover:shadow-lg transition-shadow">
                <span className="inline-block px-3 py-1 text-xs font-semibold text-primary bg-primary/10 rounded-full mb-4 uppercase tracking-wide">
                  {t("projects.impact.tag1")}
                </span>
                <Users className="w-12 h-12 text-primary mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-bold text-primary mb-3">100%</div>
                <p className="text-base text-foreground leading-relaxed">
                  {t("projects.impact.fact1")}
                </p>
              </Card>
              <Card className="p-6 text-center bg-gradient-to-br from-primary-light/20 to-primary-light/10 border-primary/20 hover:shadow-lg transition-shadow">
                <span className="inline-block px-3 py-1 text-xs font-semibold text-primary bg-primary/10 rounded-full mb-4 uppercase tracking-wide">
                  {t("projects.impact.tag2")}
                </span>
                <Sun className="w-12 h-12 text-primary mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-bold text-primary mb-3">1st</div>
                <p className="text-base text-foreground leading-relaxed">
                  {t("projects.impact.fact2")}
                </p>
              </Card>
              <Card className="p-6 text-center bg-gradient-to-br from-primary-light/20 to-primary-light/10 border-primary/20 hover:shadow-lg transition-shadow">
                <span className="inline-block px-3 py-1 text-xs font-semibold text-primary bg-primary/10 rounded-full mb-4 uppercase tracking-wide">
                  {t("projects.impact.tag3")}
                </span>
                <Droplet className="w-12 h-12 text-primary mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-bold text-primary mb-3">1,000+</div>
                <p className="text-base text-foreground leading-relaxed">
                  {t("projects.impact.fact3")}
                </p>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-xl text-foreground mb-6">
                {t("projects.impact.subtitle")}
              </p>
              <Link 
                to="/donation"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <Button size="lg">
                  {t("projects.impact.donate")}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {activeCostProject && (
        <ProjectItemsModal
          projectCost={activeCostProject}
          isOpen={!!activeCostProject}
          onClose={() => {
            setActiveCostProject(null);
            refreshCosts();
            // Remove hash from URL when closing modal to prevent it from reopening
            const params = new URLSearchParams(location.search);
            const newSearch = params.toString();
            navigate(`${location.pathname}${newSearch ? '?' + newSearch : ''}`, { replace: true });
          }}
          onItemToggle={(itemId, purchased) => {
            if (!activeCostProject) {
              return;
            }
            const updatedItems = activeCostProject.items.map(item =>
              item.itemId === itemId ? { ...item, purchased } : item
            );
            const purchasedItems = updatedItems.filter(item => item.purchased).length;
            const spentAmount = updatedItems
              .filter(item => item.purchased)
              .reduce((sum, item) => sum + (item.unitCostEUR || 0), 0);
            const remainingAmount = activeCostProject.totalBudget - spentAmount;
            console.log('Item toggled:', itemId, purchased, {
              ...activeCostProject,
              items: updatedItems,
              purchasedItems,
              spentAmount,
              remainingAmount,
            });
          }}
          onItemCostUpdate={(itemId, cost) => {
            if (!activeCostProject) {
              return;
            }
            const updatedItems = activeCostProject.items.map(item =>
              item.itemId === itemId ? { ...item, unitCostEUR: cost } : item
            );
            const totalBudget = updatedItems.reduce((sum, item) => sum + (item.unitCostEUR || 0), 0);
            const spentAmount = updatedItems
              .filter(item => item.purchased)
              .reduce((sum, item) => sum + (item.unitCostEUR || 0), 0);
            const remainingAmount = totalBudget - spentAmount;
            console.log('Item cost updated:', itemId, cost, {
              ...activeCostProject,
              items: updatedItems,
              totalBudget,
              spentAmount,
              remainingAmount,
            });
          }}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default Projects;
