import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "de";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.projects": "Projects",
    "nav.team": "Team",
    "nav.contact": "Contact",
    
    // Hero
    "hero.title": "Bridging Hope Across Continents",
    "hero.subtitle": "An international initiative supporting community development in rural Uganda",
    
    // Mission
    "mission.title": "Our Mission",
    "mission.p1": "Alma Bridge of Hope stands as a testament to the power of international collaboration. Our German-Ugandan partnership focuses on empowering underserved communities in rural Uganda through sustainable development initiatives.",
    "mission.p2": "We believe community-led development is the only way to create lasting change. Every project is designed with and for the people who will benefit from it, ensuring sustainability and true impact.",
    "mission.p3": "Through practical, local development projects, we're not just building infrastructure – we're building bridges of hope that connect communities across continents and create lasting positive change.",
    "mission.cta": "Get in touch or support our projects",
    "mission.contact": "Contact Us",
    "mission.donate": "Support Projects",
    
    // What We Do
    "whatwedo.title": "What We Do",
    "whatwedo.subtitle": "Our work focuses on three key areas that create lasting impact in rural Uganda",
    "whatwedo.utilities.title": "Basic Utilities",
    "whatwedo.utilities.desc": "Bringing clean water and renewable energy solutions to remote communities.",
    "whatwedo.infrastructure.title": "Infrastructure & Local Empowerment",
    "whatwedo.infrastructure.desc": "Building sustainable infrastructure while empowering local leadership.",
    "whatwedo.education.title": "Education & Training",
    "whatwedo.education.desc": "Supporting local education initiatives and skill-building programs.",
    "whatwedo.button": "View All Projects",
    
    // Team
    "team.title": "Meet Our Team",
    "team.subtitle": "Alma Bridge of Hope is a collaborative project bringing together dedicated people from Uganda and Germany. Our strength lies in the close partnership between both countries: while our team in Uganda implements projects on the ground and directly supports local communities, our German team coordinates strategic development, fundraising, and international partnerships.",
    "team.cta": "Our international cooperation enables us to promote sustainable development that is truly designed by and with the people on the ground.",
    "team.button": "Meet the Full Team",
    
    // Newsletter
    "newsletter.title": "Stay Connected",
    "newsletter.subtitle": "Receive monthly updates from the field – real stories, real progress.",
    "newsletter.placeholder": "Enter your email",
    "newsletter.button": "Subscribe",
    
    // Contact
    "contact.title": "Get In Touch",
    "contact.subtitle": "We'd love to hear from you. Reach out to learn more about our work or explore potential partnerships.",
    "contact.email": "contact@almabridge.org",
    "contact.button": "Contact Us",
    "contact.note": "Currently, we're focused on establishing our projects. Donation and volunteering opportunities will be available soon. Thank you for your patience and interest.",
    
    // Footer
    "footer.tagline": "Bridging hope across continents through sustainable community development.",
    "footer.nav.title": "Navigation",
    "footer.legal.title": "Legal",
    "footer.legal.impressum": "Impressum",
    "footer.legal.privacy": "Privacy Policy",
    "footer.copyright": "© 2024 Alma Bridge of Hope. All rights reserved.",
  },
  de: {
    // Navigation
    "nav.home": "Startseite",
    "nav.projects": "Projekte",
    "nav.team": "Team",
    "nav.contact": "Kontakt",
    
    // Hero
    "hero.title": "Brücken der Hoffnung zwischen Kontinenten",
    "hero.subtitle": "Eine internationale Initiative zur Unterstützung der Gemeindeentwicklung im ländlichen Uganda",
    
    // Mission
    "mission.title": "Unsere Mission",
    "mission.p1": "Alma Bridge of Hope ist ein Beweis für die Kraft internationaler Zusammenarbeit. Unsere deutsch-ugandische Partnerschaft konzentriert sich auf die Stärkung unterversorgter Gemeinden im ländlichen Uganda durch nachhaltige Entwicklungsinitiativen.",
    "mission.p2": "Wir glauben, dass von der Gemeinschaft geleitete Entwicklung der einzige Weg ist, um dauerhafte Veränderungen zu schaffen. Jedes Projekt wird mit und für die Menschen entwickelt, die davon profitieren werden, um Nachhaltigkeit und echte Wirkung zu gewährleisten.",
    "mission.p3": "Durch praktische, lokale Entwicklungsprojekte bauen wir nicht nur Infrastruktur – wir bauen Brücken der Hoffnung, die Gemeinschaften über Kontinente hinweg verbinden und dauerhafte positive Veränderungen schaffen.",
    "mission.cta": "Kontaktieren Sie uns oder unterstützen Sie unsere Projekte",
    "mission.contact": "Kontakt aufnehmen",
    "mission.donate": "Projekte unterstützen",
    
    // What We Do
    "whatwedo.title": "Was wir tun",
    "whatwedo.subtitle": "Unsere Arbeit konzentriert sich auf drei Schlüsselbereiche, die nachhaltige Wirkung im ländlichen Uganda schaffen",
    "whatwedo.utilities.title": "Grundversorgung",
    "whatwedo.utilities.desc": "Sauberes Wasser und erneuerbare Energielösungen für abgelegene Gemeinden.",
    "whatwedo.infrastructure.title": "Infrastruktur & lokale Stärkung",
    "whatwedo.infrastructure.desc": "Aufbau nachhaltiger Infrastruktur bei gleichzeitiger Stärkung lokaler Führung.",
    "whatwedo.education.title": "Bildung & Training",
    "whatwedo.education.desc": "Unterstützung lokaler Bildungsinitiativen und Programme zur Kompetenzentwicklung.",
    "whatwedo.button": "Alle Projekte ansehen",
    
    // Team
    "team.title": "Unser Team",
    "team.subtitle": "Alma Bridge of Hope ist ein gemeinsames Projekt von engagierten Menschen aus Uganda und Deutschland. Unsere Stärke liegt in der engen Zusammenarbeit zwischen beiden Ländern: Während unser Team in Uganda die Projekte vor Ort umsetzt und die lokalen Gemeinschaften direkt unterstützt, koordiniert unser deutsches Team die strategische Entwicklung, Mittelbeschaffung und internationale Partnerschaften.",
    "team.cta": "Diese interkontinentale Kooperation ermöglicht es uns, nachhaltige Entwicklung zu fördern, die wirklich von und mit den Menschen vor Ort gestaltet wird.",
    "team.button": "Das gesamte Team kennenlernen",
    
    // Newsletter
    "newsletter.title": "Bleiben Sie verbunden",
    "newsletter.subtitle": "Erhalten Sie monatliche Updates aus dem Feld – echte Geschichten, echter Fortschritt.",
    "newsletter.placeholder": "E-Mail-Adresse eingeben",
    "newsletter.button": "Abonnieren",
    
    // Contact
    "contact.title": "Kontakt aufnehmen",
    "contact.subtitle": "Wir freuen uns auf Ihre Nachricht. Kontaktieren Sie uns, um mehr über unsere Arbeit zu erfahren oder potenzielle Partnerschaften zu erkunden.",
    "contact.email": "contact@almabridge.org",
    "contact.button": "Kontaktieren Sie uns",
    "contact.note": "Derzeit konzentrieren wir uns auf die Einrichtung unserer Projekte. Spenden- und Freiwilligenmöglichkeiten werden bald verfügbar sein. Vielen Dank für Ihre Geduld und Ihr Interesse.",
    
    // Footer
    "footer.tagline": "Brücken der Hoffnung zwischen Kontinenten durch nachhaltige Gemeindeentwicklung.",
    "footer.nav.title": "Navigation",
    "footer.legal.title": "Rechtliches",
    "footer.legal.impressum": "Impressum",
    "footer.legal.privacy": "Datenschutz",
    "footer.copyright": "© 2024 Alma Bridge of Hope. Alle Rechte vorbehalten.",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
