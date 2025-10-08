import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from "react";

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
    
    // Projects Page
    "projects.hero.title": "Our Projects",
    "projects.hero.subtitle": "Every project is a step towards a self-determined future. Together we create structures that last – from water to education to community.",
    "projects.active.title": "Current Projects",
    "projects.planned.title": "Further Planned Initiatives",
    "projects.impact.title": "Our Impact",
    "projects.impact.subtitle": "Help us create even more impact.",
    "projects.impact.donate": "Donate Now",
    "projects.timeline.planning": "Planning",
    "projects.timeline.building": "Building",
    "projects.timeline.implementation": "Implementation",
    "projects.timeline.impact": "Impact",
    "projects.goals": "Goals",
    "projects.impact_label": "Impact",
    "projects.status": "Status",
    "projects.community.title": "Community House",
    "projects.community.teaser": "The heart of our initiative",
    "projects.community.description": "The Community House is the heart of our initiative. It serves as a meeting point, training center and starting point for all programs – here space is created for education, cooperation and sustainable development.",
    "projects.community.goal1": "Construction of a central house with learning and community room",
    "projects.community.goal2": "Location for well & livestock project",
    "projects.community.goal3": "Setting up storage and office space",
    "projects.community.impact": "The central hub and foundation for all our initiatives. This community center serves as the planning headquarters, coordination point, and operational base from which all other projects are conducted, managed, and expanded.",
    "projects.community.status": "Building phase",
    "projects.community.button": "Learn more",
    "projects.well.title": "Well Project",
    "projects.well.teaser": "Access to clean water",
    "projects.well.description": "Clean water is the foundation for health and education. We are building a well near the Community House to ensure the basic supply of the village community.",
    "projects.well.goal1": "Supply of clean drinking water",
    "projects.well.goal2": "Reduction of water-related diseases",
    "projects.well.goal3": "Building local maintenance structures",
    "projects.well.impact": "Improved quality of life for over 150 people in the Wakiso region.",
    "projects.well.status": "Preparation phase – location check completed",
    "projects.well.button": "Support Project 💧",
    "projects.livestock.title": "Livestock & Agriculture",
    "projects.livestock.teaser": "Sustainable food security",
    "projects.livestock.description": "Community livestock farming and sustainable agriculture secure nutrition and income for many families.",
    "projects.livestock.goal1": "Building shared feed storage",
    "projects.livestock.goal2": "Improve veterinary care",
    "projects.livestock.goal3": "Training for sustainable animal husbandry",
    "projects.livestock.impact": "Long-term food security & economic independence.",
    "projects.livestock.status": "In preparation – cooperatives are forming",
    "projects.livestock.button": "Learn more 🐄",
    "projects.education.title": "Financial Literacy & Education",
    "projects.education.teaser": "The key to independence",
    "projects.education.description": "Financial education is the key to independence. We develop training and learning centers to strengthen young people and adults.",
    "projects.education.goal1": "Training on finance & budget planning",
    "projects.education.goal2": "Building local learning spaces",
    "projects.education.goal3": "Partnerships with schools",
    "projects.education.impact": "More than 100 young people should have access to practical financial education.",
    "projects.education.status": "In preparation – teaching materials created",
    "projects.education.button": "Support Education 📚",
    "projects.stats.projects": "Projects",
    "projects.stats.active": "Active in Construction",
    "projects.stats.people": "People Reached",
    "projects.stats.volunteers": "Engaged & Volunteers",
    
    // Team Page
    "team.hero.title": "Our Team",
    "team.hero.subtitle": "Building bridges together between Uganda and Germany",
    "team.intro.title": "International Cooperation",
    "team.intro.p1": "Alma Bridge of Hope is a joint project of dedicated people from Uganda and Germany. Our strength lies in the close cooperation between both countries: While our team in Uganda implements the projects on site and directly supports the local communities, our German team coordinates strategic development, fundraising and international partnerships.",
    "team.intro.p2": "This intercontinental cooperation enables us to promote sustainable development that is really designed by and with the people on the ground.",
    "team.uganda.title": "Team Uganda",
    "team.germany.title": "Team Germany",
    "team.peter.name": "Peter Ssenga",
    "team.peter.role": "Community Lead Uganda",
    "team.peter.description": "Peter coordinates all projects on site and works closely with local partners to enable sustainable development.",
    "team.fiona.name": "Fiona Nakazibwe",
    "team.fiona.role": "Education & Community Programs",
    "team.fiona.description": "Fiona develops and leads educational programs that help the local community become more independent.",
    "team.member.name": "Team Member",
    "team.member.agriculture.role": "Agriculture & Infrastructure Support",
    "team.member.agriculture.description": "Support for agricultural projects and sustainable infrastructure development in communities.",
    "team.clara.name": "Clara Thümecke",
    "team.clara.role": "Board & Project Development",
    "team.clara.description": "Clara leads strategic development and coordinates cooperation between Germany and Uganda.",
    "team.aaron.name": "Aaron",
    "team.aaron.role": "Financial Coordination & Partnerships",
    "team.aaron.description": "Aaron manages financial resources and builds partnerships with supporters and organizations.",
    "team.member.communication.role": "Public Relations & Communication",
    "team.member.communication.description": "Responsible for external communication and building awareness for our projects.",
    "team.member.fundraising.role": "Fundraising & Donation Acquisition",
    "team.member.fundraising.description": "Develops strategies for fundraising and maintains relationships with supporters.",
    "team.member.project.role": "Project Management",
    "team.member.project.description": "Coordinates project implementation and ensures smooth processes.",
    "team.member.accounting.role": "Accounting & Administration",
    "team.member.accounting.description": "Takes care of proper administration and documentation of all finances.",
    "team.member.volunteer.role": "Volunteer Coordination",
    "team.member.volunteer.description": "Engages volunteers and organizes voluntary support for events.",
    
    // Contact Page
    "contact.hero.title": "Contact",
    "contact.hero.subtitle": "We look forward to your message",
    "contact.form.title": "Send Message",
    "contact.form.name": "Name *",
    "contact.form.name_placeholder": "Your Name",
    "contact.form.email": "E-Mail *",
    "contact.form.email_placeholder": "your.email@example.com",
    "contact.form.subject": "Subject",
    "contact.form.subject_placeholder": "What is it about?",
    "contact.form.message": "Message *",
    "contact.form.message_placeholder": "Your message...",
    "contact.form.submit": "Send Message",
    "contact.info.email": "E-Mail",
    "contact.info.address": "Address",
    "contact.info.social": "Social Media",
    "contact.note.title": "Note:",
    "contact.note.text": "We are currently in the setup phase. Donation and volunteer opportunities will be available soon. Thank you for your interest and patience!",
    "contact.error.title": "Error",
    "contact.error.required": "Please fill in all required fields.",
    "contact.error.email": "Please enter a valid email address.",
    "contact.success.title": "Message Sent",
    "contact.success.description": "Thank you for your message. We will get back to you soon!",
    
    // Community Section
    "community.title": "The Community",
    "community.description1": "Our work is centered in Namaliri village, Njeru town council, Mukono District, Uganda. We partner with local communities to create sustainable development solutions that address the specific needs of this vibrant agricultural region.",
    "community.description2": "All projects are carefully consulted with community leaders and focus on supporting the most vulnerable members of the community. We believe that lasting change comes from within the community itself, guided by those who understand local needs best.",
    "community.description3": "Through close collaboration with village leaders, families, and local organizations, we ensure that every initiative addresses real needs and creates genuine impact for the people who call Namaliri village home.",
    "community.stats.people": "Community Members",
    "community.stats.projects": "Active Projects",
    "community.location.title": "Community Location",
    "community.location.coordinates": "Coordinates: 0°36'08.9\"N 32°51'03.0\"E",
    "community.location.region": "Namaliri Village, Njeru Town Council, Mukono District, Uganda",
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
    
    // Projects Page
    "projects.hero.title": "Unsere Projekte",
    "projects.hero.subtitle": "Jedes Projekt ist ein Schritt zu einer selbstbestimmten Zukunft. Gemeinsam schaffen wir Strukturen, die Bestand haben – von Wasser über Bildung bis Gemeinschaft.",
    "projects.active.title": "Aktuelle Projekte",
    "projects.planned.title": "Weitere geplante Initiativen",
    "projects.impact.title": "Unsere Wirkung",
    "projects.impact.subtitle": "Hilf uns, noch mehr Wirkung zu entfalten.",
    "projects.impact.donate": "Jetzt spenden",
    "projects.timeline.planning": "Planung",
    "projects.timeline.building": "Aufbau",
    "projects.timeline.implementation": "Umsetzung",
    "projects.timeline.impact": "Wirkung",
    "projects.goals": "Ziele",
    "projects.impact_label": "Impact",
    "projects.status": "Status",
    "projects.community.title": "Community House",
    "projects.community.teaser": "Das Herzstück unserer Initiative",
    "projects.community.description": "Das Community House ist das Herzstück unserer Initiative. Es dient als Treffpunkt, Schulungszentrum und Ausgangspunkt für alle Programme – hier entsteht Raum für Bildung, Zusammenarbeit und nachhaltige Entwicklung.",
    "projects.community.goal1": "Bau eines zentralen Hauses mit Lern- und Gemeinschaftsraum",
    "projects.community.goal2": "Standort für Brunnen & Viehzuchtprojekt",
    "projects.community.goal3": "Einrichtung von Lager- und Büroraum",
    "projects.community.impact": "Das zentrale Zentrum und die Grundlage für alle unsere Initiativen. Dieses Gemeindezentrum dient als Planungszentrale, Koordinationspunkt und operativer Stützpunkt, von dem aus alle anderen Projekte durchgeführt, verwaltet und erweitert werden.",
    "projects.community.status": "Aufbauphase",
    "projects.community.button": "Mehr erfahren",
    "projects.well.title": "Brunnenprojekt",
    "projects.well.teaser": "Zugang zu sauberem Wasser",
    "projects.well.description": "Sauberes Wasser ist die Grundlage für Gesundheit und Bildung. Wir errichten einen Brunnen in der Nähe des Community House, um die Grundversorgung der Dorfgemeinschaft sicherzustellen.",
    "projects.well.goal1": "Versorgung mit sauberem Trinkwasser",
    "projects.well.goal2": "Verringerung wasserbedingter Krankheiten",
    "projects.well.goal3": "Aufbau lokaler Wartungsstrukturen",
    "projects.well.impact": "Verbesserte Lebensqualität für über 150 Menschen in der Region Wakiso.",
    "projects.well.status": "Vorbereitungsphase – Standortprüfung abgeschlossen",
    "projects.well.button": "Projekt unterstützen 💧",
    "projects.livestock.title": "Viehversorgung & Landwirtschaft",
    "projects.livestock.teaser": "Nachhaltige Ernährungssicherheit",
    "projects.livestock.description": "Gemeinschaftliche Viehhaltung und nachhaltige Landwirtschaft sichern Ernährung und Einkommen für viele Familien.",
    "projects.livestock.goal1": "Aufbau gemeinsamer Futterlager",
    "projects.livestock.goal2": "Tierärztliche Versorgung verbessern",
    "projects.livestock.goal3": "Schulungen für nachhaltige Tierhaltung",
    "projects.livestock.impact": "Langfristige Ernährungssicherheit & wirtschaftliche Unabhängigkeit.",
    "projects.livestock.status": "In Vorbereitung – Kooperativen bilden sich",
    "projects.livestock.button": "Mehr erfahren 🐄",
    "projects.education.title": "Financial Literacy & Bildung",
    "projects.education.teaser": "Der Schlüssel zu Selbstständigkeit",
    "projects.education.description": "Finanzielle Bildung ist der Schlüssel zu Selbstständigkeit. Wir entwickeln Trainings und Lernzentren, um Jugendliche und Erwachsene zu stärken.",
    "projects.education.goal1": "Trainings zu Finanzen & Budgetplanung",
    "projects.education.goal2": "Aufbau lokaler Lernräume",
    "projects.education.goal3": "Partnerschaften mit Schulen",
    "projects.education.impact": "Mehr als 100 Jugendliche sollen Zugang zu praxisnaher Finanzbildung erhalten.",
    "projects.education.status": "In Vorbereitung – Lehrmaterialien erstellt",
    "projects.education.button": "Unterstütze Bildung 📚",
    "projects.stats.projects": "Projekte",
    "projects.stats.active": "Aktiv im Bau",
    "projects.stats.people": "Menschen erreicht",
    "projects.stats.volunteers": "Engagierte & Freiwillige",
    
    // Team Page
    "team.hero.title": "Unser Team",
    "team.hero.subtitle": "Gemeinsam Brücken bauen zwischen Uganda und Deutschland",
    "team.intro.title": "Internationale Zusammenarbeit",
    "team.intro.p1": "Alma Bridge of Hope ist ein gemeinsames Projekt von engagierten Menschen aus Uganda und Deutschland. Unsere Stärke liegt in der engen Zusammenarbeit zwischen beiden Ländern: Während unser Team in Uganda die Projekte vor Ort umsetzt und die lokalen Gemeinschaften direkt unterstützt, koordiniert unser deutsches Team die strategische Entwicklung, Mittelbeschaffung und internationale Partnerschaften.",
    "team.intro.p2": "Diese interkontinentale Kooperation ermöglicht es uns, nachhaltige Entwicklung zu fördern, die wirklich von und mit den Menschen vor Ort gestaltet wird.",
    "team.uganda.title": "Team Uganda",
    "team.germany.title": "Team Deutschland",
    "team.peter.name": "Peter Ssenga",
    "team.peter.role": "Community Lead Uganda",
    "team.peter.description": "Peter koordiniert alle Projekte vor Ort und arbeitet eng mit lokalen Partnern zusammen, um nachhaltige Entwicklung zu ermöglichen.",
    "team.fiona.name": "Fiona Nakazibwe",
    "team.fiona.role": "Education & Community Programs",
    "team.fiona.description": "Fiona entwickelt und leitet Bildungsprogramme, die der lokalen Gemeinschaft zu mehr Eigenständigkeit verhelfen.",
    "team.member.name": "Teammitglied",
    "team.member.agriculture.role": "Agriculture & Infrastructure Support",
    "team.member.agriculture.description": "Unterstützung bei landwirtschaftlichen Projekten und nachhaltiger Infrastrukturentwicklung in den Gemeinden.",
    "team.clara.name": "Clara Thümecke",
    "team.clara.role": "Vorstand & Projektentwicklung",
    "team.clara.description": "Clara leitet die strategische Entwicklung und koordiniert die Zusammenarbeit zwischen Deutschland und Uganda.",
    "team.aaron.name": "Aaron",
    "team.aaron.role": "Finanzkoordination & Partnerschaften",
    "team.aaron.description": "Aaron verwaltet die finanziellen Ressourcen und baut Partnerschaften mit Unterstützern und Organisationen auf.",
    "team.member.communication.role": "Öffentlichkeitsarbeit & Kommunikation",
    "team.member.communication.description": "Verantwortlich für die externe Kommunikation und das Aufbauen von Aufmerksamkeit für unsere Projekte.",
    "team.member.fundraising.role": "Fundraising & Spendenakquise",
    "team.member.fundraising.description": "Entwickelt Strategien zur Mittelbeschaffung und pflegt Beziehungen zu Förderern.",
    "team.member.project.role": "Projektmanagement",
    "team.member.project.description": "Koordiniert die Umsetzung der Projekte und sorgt für reibungslose Abläufe.",
    "team.member.accounting.role": "Buchhaltung & Verwaltung",
    "team.member.accounting.description": "Kümmert sich um die ordnungsgemäße Verwaltung und Dokumentation aller Finanzen.",
    "team.member.volunteer.role": "Ehrenamtliche Koordination",
    "team.member.volunteer.description": "Bindet Freiwillige ein und organisiert ehrenamtliche Unterstützung für Veranstaltungen.",
    
    // Contact Page
    "contact.hero.title": "Kontakt",
    "contact.hero.subtitle": "Wir freuen uns auf Ihre Nachricht",
    "contact.form.title": "Nachricht senden",
    "contact.form.name": "Name *",
    "contact.form.name_placeholder": "Ihr Name",
    "contact.form.email": "E-Mail *",
    "contact.form.email_placeholder": "ihre.email@beispiel.de",
    "contact.form.subject": "Betreff",
    "contact.form.subject_placeholder": "Worum geht es?",
    "contact.form.message": "Nachricht *",
    "contact.form.message_placeholder": "Ihre Nachricht...",
    "contact.form.submit": "Nachricht senden",
    "contact.info.email": "E-Mail",
    "contact.info.address": "Adresse",
    "contact.info.social": "Social Media",
    "contact.note.title": "Hinweis:",
    "contact.note.text": "Wir befinden uns derzeit in der Aufbauphase. Spenden- und Freiwilligenmöglichkeiten werden in Kürze verfügbar sein. Vielen Dank für Ihr Interesse und Ihre Geduld!",
    "contact.error.title": "Fehler",
    "contact.error.required": "Bitte füllen Sie alle Pflichtfelder aus.",
    "contact.error.email": "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    "contact.success.title": "Nachricht gesendet",
    "contact.success.description": "Vielen Dank für Ihre Nachricht. Wir melden uns bald bei Ihnen!",
    
    // Community Section
    "community.title": "Die Gemeinde",
    "community.description1": "Unsere Arbeit konzentriert sich auf das Dorf Namaliri, Njeru Stadtgemeinde, Mukono-Distrikt, Uganda. Wir arbeiten mit lokalen Gemeinschaften zusammen, um nachhaltige Entwicklungslösungen zu schaffen, die die spezifischen Bedürfnisse dieser lebendigen landwirtschaftlichen Region ansprechen.",
    "community.description2": "Alle Projekte werden sorgfältig mit Gemeindevorstehern beraten und konzentrieren sich auf die Unterstützung der am stärksten gefährdeten Mitglieder der Gemeinschaft. Wir glauben, dass dauerhafter Wandel aus der Gemeinschaft selbst kommt, geleitet von denen, die die lokalen Bedürfnisse am besten verstehen.",
    "community.description3": "Durch enge Zusammenarbeit mit Dorfvorstehern, Familien und lokalen Organisationen stellen wir sicher, dass jede Initiative echte Bedürfnisse anspricht und echte Wirkung für die Menschen schafft, die das Dorf Namaliri ihr Zuhause nennen.",
    "community.stats.people": "Gemeindemitglieder",
    "community.stats.projects": "Aktive Projekte",
    "community.location.title": "Standort der Gemeinde",
    "community.location.coordinates": "Koordinaten: 0°36'08,9\"N 32°51'03,0\"E",
    "community.location.region": "Namaliri Dorf, Njeru Stadtgemeinde, Mukono-Distrikt, Uganda",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Constants for better maintainability
const LANGUAGE_STORAGE_KEY = "alma-language";
const DEFAULT_LANGUAGE: Language = "en";

// Helper function to safely get language from localStorage
const getStoredLanguage = (): Language => {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "de") {
      return stored as Language;
    }
  } catch (error) {
    console.warn("Failed to read language from localStorage:", error);
  }
  
  return DEFAULT_LANGUAGE;
};

// Helper function to safely set language in localStorage
const setStoredLanguage = (language: Language): void => {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.warn("Failed to save language to localStorage:", error);
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(getStoredLanguage);

  // Memoized function to update language and persist to localStorage
  const handleSetLanguage = useCallback((newLanguage: Language) => {
    setLanguage(newLanguage);
    setStoredLanguage(newLanguage);
  }, []);

  // Memoized translation function
  const t = useCallback((key: string): string => {
    const translation = translations[language][key as keyof typeof translations.en];
    if (!translation) {
      console.warn(`Translation missing for key: ${key} in language: ${language}`);
      return key;
    }
    return translation;
  }, [language]);

  // Sync with localStorage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LANGUAGE_STORAGE_KEY && e.newValue) {
        const newLanguage = e.newValue as Language;
        if (newLanguage === "en" || newLanguage === "de") {
          setLanguage(newLanguage);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    language,
    setLanguage: handleSetLanguage,
    t,
  }), [language, handleSetLanguage, t]);

  return (
    <LanguageContext.Provider value={contextValue}>
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
