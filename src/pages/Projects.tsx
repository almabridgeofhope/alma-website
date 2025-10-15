import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Home, Droplets, Sprout, BookOpen, Car } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImage from "@/assets/project/header_construction.jpeg";
import communityHouseImage from "@/assets/project/construction_house.png";
import waterImage from "@/assets/project/well.jpg";
import agricultureImage from "@/assets/project/goat_farm.webp";
import educationImage from "@/assets/project/pupils_2.jpg";
import busImage from "@/assets/project/bus.png";
import financialImage from "@/assets/project/education_5.jpg";

type TimelinePhase = "planning" | "building" | "implementation" | "impact";

interface Project {
  title: string;
  icon: typeof Home;
  teaser: string;
  description: string;
  goals: string[];
  impact: string;
  statusText: string;
  statusIcon: string;
  progress: number;
  currentPhase: TimelinePhase;
  image: string;
  buttonText: string;
  priority: "active" | "planned";
}

const Projects = () => {
  const { t } = useLanguage();
  
  const timelinePhases = [
    { id: "planning", icon: "🌱", label: t("projects.timeline.planning") },
    { id: "building", icon: "🔧", label: t("projects.timeline.building") },
    { id: "implementation", icon: "💧", label: t("projects.timeline.implementation") },
    { id: "impact", icon: "🌾", label: t("projects.timeline.impact") },
  ];

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
      statusIcon: "🟢",
      progress: 65,
      currentPhase: "building",
      image: communityHouseImage,
      buttonText: t("projects.community.button"),
      priority: "active",
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
      statusIcon: "🟢",
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
      statusIcon: "🟡",
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
      description: t("projects.mobility.description"),
      goals: [
        t("projects.mobility.goal1"),
        t("projects.mobility.goal2"),
        t("projects.mobility.goal3"),
      ],
      impact: t("projects.mobility.impact"),
      statusText: t("projects.mobility.status"),
      statusIcon: "⚪",
      progress: 5,
      currentPhase: "planning",
      image: busImage,
      buttonText: t("projects.mobility.button"),
      priority: "planned",
    },
    {
      title: t("projects.sponsorship.title"),
      icon: BookOpen,
      teaser: t("projects.sponsorship.teaser"),
      description: t("projects.sponsorship.description"),
      goals: [
        t("projects.sponsorship.goal1"),
        t("projects.sponsorship.goal2"),
        t("projects.sponsorship.goal3"),
      ],
      impact: t("projects.sponsorship.impact"),
      statusText: t("projects.sponsorship.status"),
      statusIcon: "⚪",
      progress: 5,
      currentPhase: "planning",
      image: educationImage,
      buttonText: t("projects.sponsorship.button"),
      priority: "planned",
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
      statusIcon: "⚪",
      progress: 5,
      currentPhase: "planning",
      image: financialImage,
      buttonText: t("projects.financial.button"),
      priority: "planned",
    }
  ];

  const renderTimeline = (currentPhase: TimelinePhase) => (
    <div className="mb-6">
      {/* Timeline Icons and Connecting Lines */}
      <div className="flex justify-between items-center relative">
        {/* Absolute connecting lines */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center">
          {timelinePhases.slice(0, -1).map((_, index) => {
            const isPast = timelinePhases.findIndex(p => p.id === currentPhase) > index;
            return (
              <div 
                key={`line-${index}`} 
                className={`h-1 flex-1 mx-6 transition-all duration-300 ${
                  isPast ? "bg-blue-200" : "bg-gray-200"
                }`}
              />
            );
          })}
        </div>

        {/* Icons */}
        {timelinePhases.map((phase, index) => {
          const isActive = phase.id === currentPhase;
          const isPast = timelinePhases.findIndex(p => p.id === currentPhase) > index;
          
          return (
            <div key={phase.id} className="flex flex-col items-center relative z-10">
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-300 ${
                  isActive 
                    ? "bg-red-200 text-red-700 shadow-lg scale-110" 
                    : isPast
                    ? "bg-blue-200 text-blue-700"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {phase.icon}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Timeline Labels - Match exact positioning of icons */}
      <div className="flex justify-between mt-2">
        {timelinePhases.map((phase, index) => {
          const isActive = phase.id === currentPhase;
          return (
            <div key={`label-${phase.id}`} className="flex justify-center">
              <span 
                className={`text-xs sm:text-sm font-medium ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {phase.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderProjectCard = (project: Project, index: number) => {
    const Icon = project.icon;
    const isEven = index % 2 === 0;
    
    return (
      <div 
        key={index}
        className="animate-fade-in"
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <Card className={`overflow-hidden shadow-card hover:shadow-soft transition-all duration-500 group ${
          project.priority === "active" ? "bg-primary-light/30" : "bg-card"
        }`}>
          <div className={`grid md:grid-cols-2 gap-0 ${!isEven ? 'md:grid-flow-dense' : ''}`}>
            {/* Image Section */}
            <div className={`relative overflow-hidden ${!isEven ? 'md:col-start-2' : ''}`}>
              <img 
                src={project.image} 
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Content Section */}
            <div className="p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col justify-between">
              <div>
                {/* Header with Icon */}
                <div className="flex items-center gap-3 mb-4">
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
                <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">
                  {project.description}
                </p>

                {/* Two Column Layout: Goals & Impact */}
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                  {/* Goals */}
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary rounded-full" />
                      {t("projects.goals")}
                    </h4>
                    <ul className="space-y-2">
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
                    <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary rounded-full" />
                      {t("projects.impact_label")}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {project.impact}
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                {renderTimeline(project.currentPhase)}

                {/* Status Card with Progress */}
                <div className="p-3 sm:p-4 bg-background rounded-lg border border-border mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                      {t("projects.status")}: {project.statusText}
                    </h4>
                    <span className="text-xs sm:text-sm font-bold text-primary">
                      {project.progress}%
                    </span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
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

        {/* Active Projects Section */}
        <section className="py-section bg-background">
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
        <section className="py-section bg-muted/30">
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
        <section className="py-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                {t("projects.impact.title")}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div className="text-center p-6 bg-primary-light rounded-lg">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">6</div>
                <div className="text-sm md:text-base text-muted-foreground">{t("projects.stats.projects")}</div>
              </div>
              <div className="text-center p-6 bg-primary-light rounded-lg">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">2</div>
                <div className="text-sm md:text-base text-muted-foreground">{t("projects.stats.active")}</div>
              </div>
              <div className="text-center p-6 bg-primary-light rounded-lg">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">150+</div>
                <div className="text-sm md:text-base text-muted-foreground">{t("projects.stats.people")}</div>
              </div>
              <div className="text-center p-6 bg-primary-light rounded-lg">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">30+</div>
                <div className="text-sm md:text-base text-muted-foreground">{t("projects.stats.volunteers")}</div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xl text-foreground mb-6">
                {t("projects.impact.subtitle")}
              </p>
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button text-lg px-8 py-6"
              >
                {t("projects.impact.donate")}
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Projects;
