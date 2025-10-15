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
    "contact.email": "info@almabridgeofhope.org",
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
    "projects.community.goal1": "Construction of a central house with learning and office room",
    "projects.community.goal2": "Installation of solar panels on the roof for electricity supply",
    "projects.community.goal3": "Location for well & livestock project",
    "projects.community.impact": "The central hub and foundation for all our initiatives. This community center serves as the planning headquarters, coordination point, and operational base from which all other projects are conducted, managed, and expanded.",
    "projects.community.status": "Building phase",
    "projects.community.button": "Learn more",
    "projects.well.title": "Well Project",
    "projects.well.teaser": "Clean water for community and farm",
    "projects.well.description": "We are constructing a well to provide drinking water to the local community and support the farming operations.",
    "projects.well.goal1": "Provide clean drinking water to the local community",
    "projects.well.goal2": "Support farming operations with dedicated water supply",
    "projects.well.goal3": "Establish dual-tank system for community and agricultural use",
    "projects.well.impact": "Reliable water access for community health and sustainable farming operations, improving quality of life and agricultural productivity.",
    "projects.well.status": "Planning phase – engineering assessment completed, cost analysis in progress",
    "projects.well.button": "Support Project 💧",
    
    // Young Mobility Project
    "projects.mobility.title": "Young Mobility Project",
    "projects.mobility.teaser": "Empowering young adults through driving education and qualification",
    "projects.mobility.description": "We provide driving lessons and support young adults in obtaining their driver's license.",
    "projects.mobility.goal1": "Provide driving education to young adults in the community",
    "projects.mobility.goal2": "Support youth in obtaining driver's licenses for better employment opportunities",
    "projects.mobility.goal3": "Create sustainable transport solutions for the community",
    "projects.mobility.impact": "This project empowers young adults with valuable skills and qualifications, opening doors to better employment opportunities while providing essential transport services for the community.",
    "projects.mobility.status": "Planning phase - cost analysis and vehicle procurement",
    "projects.mobility.button": "Support Project 🚗",
    
    // Education Sponsorship Project
    "projects.sponsorship.title": "Education Sponsorship Project",
    "projects.sponsorship.teaser": "Making quality education accessible through sponsorship and transport",
    "projects.sponsorship.description": "We sponsor school education for children in the existing school and provide transport services. This project addresses the high cost of education and the distance to other schools, making quality education accessible to more children.",
    "projects.sponsorship.goal1": "Sponsor school education for children who cannot afford private school fees",
    "projects.sponsorship.goal2": "Provide safe transport to and from school",
    "projects.sponsorship.goal3": "Ensure access to quality education for all community children",
    "projects.sponsorship.impact": "This project removes financial barriers to education and provides safe transport, ensuring that all children in the community have access to quality schooling regardless of their family's financial situation.",
    "projects.sponsorship.status": "Planning phase - cost analysis and school partnership discussions",
    "projects.sponsorship.button": "Support Project 📚",
    "projects.livestock.title": "Livestock & Agriculture",
    "projects.livestock.teaser": "Empowering communities through sustainable farming",
    "projects.livestock.description": "Our community-centered farming initiative provides education, employment, and food security for vulnerable families. We work closely with community leaders to identify those most in need, offering hands-on training in animal husbandry and sustainable agriculture practices. All farm profits are reinvested as benefits in kind to support the most vulnerable members of our community.",
    "projects.livestock.goal1": "Create sustainable employment opportunities for vulnerable families",
    "projects.livestock.goal2": "Provide comprehensive farming education and skill development",
    "projects.livestock.goal3": "Ensure food security and community resilience through local agriculture",
    "projects.livestock.impact": "Vulnerable families gain valuable skills, stable income, and food security while strengthening the entire community's agricultural capacity and resilience.",
    "projects.livestock.status": "In preparation – planning and coordination with community",
    "projects.livestock.button": "Learn more 🐄",
    "projects.financial.title": "Financial Literacy & Education",
    "projects.financial.teaser": "The key to independence",
    "projects.financial.description": "Financial education is the key to independence. We develop training and learning centers to strengthen young people and adults.",
    "projects.financial.goal1": "Training on finance & budget planning",
    "projects.financial.goal2": "Building local learning spaces",
    "projects.financial.goal3": "Partnerships with schools",
    "projects.financial.impact": "More than 100 young people should have access to practical financial education.",
    "projects.financial.status": "In preparation – teaching materials created",
    "projects.financial.button": "Support Education 📚",
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
    "team.phionah.name": "Phionah Nagujja",
    "team.tony.name": "Tony Kalulu",
    "team.member.name": "Team Member",
    "team.clara.name": "Clara Thümecke",
    "team.aaron.name": "Aaron Hesser",
    "team.eileen.name": "Eileen Kadivar",
    "team.yuan.name": "Yuan Yi Darneil",
    "team.max.name": "Max Loth",
    "team.tanja.name": "Tanja Rothenanger",
    "team.hansen.name": "Hansen Ilomo",
    
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
        "contact.form.sending": "Sending...",
    "contact.info.email": "E-Mail",
    "contact.info.address": "Address",
    "contact.info.social": "Social Media",
    "contact.note.title": "Note:",
    "contact.note.text": "We are currently in the setup phase. Donation and volunteer opportunities will be available soon. Thank you for your interest and patience!",
    "contact.error.title": "Error",
    "contact.error.required": "Please fill in all required fields.",
    "contact.error.email": "Please enter a valid email address.",
    "contact.error.send": "Failed to send message. Please try again.",
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
    
    // Donation Page
    "donation.hero.title": "Your support brings hope.",
    "donation.hero.subtitle": "Every donation helps us empower communities in Uganda with access to water, education and sustainable livelihoods.",
    "donation.hero.button": "Donate now",
    "donation.mission.title": "Our Mission",
    "donation.mission.p1": "Alma Bridge of Hope e.V. is a non-profit organization based in Germany supporting community-led initiatives in Uganda.",
    "donation.mission.p2": "Our goal is to create self-sustaining communities through access to clean water, energy, education, and financial literacy.",
    "donation.form.title": "Make a Donation",
    "donation.form.type": "Donation Type",
    "donation.form.onetime": "One-time",
    "donation.form.monthly": "Monthly",
    "donation.form.amount": "Amount (€)",
    "donation.form.custom": "Or enter custom amount",
    "donation.form.payment": "Payment Method",
    "donation.form.paypal": "PayPal",
    "donation.form.sepa": "SEPA Bank Transfer",
    "donation.form.card": "Credit Card",
    "donation.form.donate": "Donate Now",
    "donation.form.donate_monthly": "Start Monthly Donation",
    "donation.form.firstName": "First Name *",
    "donation.form.lastName": "Last Name *",
    "donation.form.email": "Email Address *",
    "donation.form.street": "Street Address",
    "donation.form.postalCode": "Postal Code",
    "donation.form.city": "City",
    "donation.form.country": "Country",
    "donation.form.comment": "Comment / Message (optional)",
    "donation.form.comment_placeholder": "e.g., 'For water project'",
    "donation.form.wantsReceipt": "I would like to receive a donation receipt",
    "donation.form.privacyConsent": "I agree to the privacy policy and consent to the processing of my data for donation processing *",
    "donation.form.error.amount": "Please select or enter a valid donation amount.",
    "donation.form.error.firstName": "Please enter your first name.",
    "donation.form.error.lastName": "Please enter your last name.",
    "donation.form.error.email": "Please enter your email address.",
    "donation.form.error.emailInvalid": "Please enter a valid email address.",
    "donation.form.error.address": "Please enter your complete address for the donation receipt.",
    "donation.form.error.privacy": "Please accept the privacy policy to continue.",
    "donation.form.success": "Thank you for your donation! You will receive a confirmation email shortly.",
    "donation.form.personalInfo": "Personal Information",
    "donation.form.addressInfo": "Address Information",
    "donation.form.addressNote": "Required for tax-deductible donation receipt",
    "donation.trust.title": "Trust & Transparency",
    "donation.trust.registered": "Registered Non-Profit",
    "donation.trust.registered.desc": "Registered non-profit in Germany (gemeinnützig anerkannt)",
    "donation.trust.tax": "Tax Deductible",
    "donation.trust.tax.desc": "Donations are tax deductible",
    "donation.trust.transparency": "Full Transparency",
    "donation.trust.transparency.desc": "Regular reporting ensures full transparency",
    "donation.quote.text": "We believe in empowerment, not dependence.",
    "donation.quote.author": "– Peter, Alma Bridge of Hope Uganda",
    "donation.faq.title": "Frequently Asked Questions",
    "donation.faq.q1": "How can I donate?",
    "donation.faq.a1": "You can donate easily via PayPal, SEPA bank transfer, or credit card using our secure donation form above.",
    "donation.faq.q2": "Will I receive a donation receipt?",
    "donation.faq.a2": "Yes, you will receive a donation receipt at the end of the year for tax purposes. For immediate receipts, please contact us at info@almabridgeofhope.org.",
    "donation.faq.q3": "How is my donation used?",
    "donation.faq.a3": "Your donation directly supports our projects in Uganda, including water access, education, and sustainable livelihood programs. We maintain full transparency in our financial reporting.",
    "donation.faq.q4": "Can I cancel my monthly donation?",
    "donation.faq.a4": "Yes, you can cancel your monthly donation at any time by contacting us at info@almabridgeofhope.org or through your payment provider.",
    "donation.contact.title": "Questions about donating?",
    "donation.contact.subtitle": "Contact us for any questions about donations, tax receipts, or our work.",
    "donation.contact.email": "info@almabridgeofhope.org",
    "donation.contact.button": "Contact Us",
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
    "contact.email": "info@almabridgeofhope.org",
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
    "projects.community.goal1": "Bau eines zentralen Hauses mit Lern- und Büroraum",
    "projects.community.goal2": "Installation von Solaranlagen auf dem Dach für Stromversorgung",
    "projects.community.goal3": "Standort für Brunnen & Viehzuchtprojekt",
    "projects.community.impact": "Das zentrale Zentrum und die Grundlage für alle unsere Initiativen. Dieses Gemeindezentrum dient als Planungszentrale, Koordinationspunkt und operativer Stützpunkt, von dem aus alle anderen Projekte durchgeführt, verwaltet und erweitert werden.",
    "projects.community.status": "Aufbauphase",
    "projects.community.button": "Mehr erfahren",
    "projects.well.title": "Brunnenprojekt",
    "projects.well.teaser": "Sauberes Wasser für Gemeinde und Hof",
    "projects.well.description": "Wir errichten einen Brunnen, um Trinkwasser für die lokale Gemeinschaft bereitzustellen und die landwirtschaftlichen Betriebe zu unterstützen.",
    "projects.well.goal1": "Sauberes Trinkwasser für die lokale Gemeinschaft bereitstellen",
    "projects.well.goal2": "Landwirtschaftliche Betriebe mit eigenem Wasservorrat unterstützen",
    "projects.well.goal3": "Dual-Tank-System für Gemeinde- und landwirtschaftliche Nutzung einrichten",
    "projects.well.impact": "Zuverlässiger Wasserzugang für Gemeindegesundheit und nachhaltige landwirtschaftliche Betriebe, Verbesserung der Lebensqualität und landwirtschaftlichen Produktivität.",
    "projects.well.status": "Planungsphase – Ingenieursbewertung abgeschlossen, Kostenanalyse läuft",
    "projects.well.button": "Projekt unterstützen 💧",
    
    // Young Mobility Project
    "projects.mobility.title": "Jugend-Mobilitätsprojekt",
    "projects.mobility.teaser": "Jugendliche durch Fahrschulausbildung und Qualifikation stärken",
    "projects.mobility.description": "Wir bieten Fahrstunden und unterstützen junge Erwachsene beim Erwerb des Führerscheins.",
    "projects.mobility.goal1": "Fahrschulausbildung für junge Erwachsene in der Gemeinde anbieten",
    "projects.mobility.goal2": "Jugendliche beim Erwerb des Führerscheins für bessere Beschäftigungsmöglichkeiten unterstützen",
    "projects.mobility.goal3": "Nachhaltige Transportlösungen für die Gemeinde schaffen",
    "projects.mobility.impact": "Dieses Projekt befähigt junge Erwachsene mit wertvollen Fähigkeiten und Qualifikationen, öffnet Türen zu besseren Beschäftigungsmöglichkeiten und bietet gleichzeitig wichtige Transportdienste für die Gemeinde.",
    "projects.mobility.status": "Planungsphase - Kostenanalyse und Fahrzeugbeschaffung",
    "projects.mobility.button": "Projekt unterstützen 🚗",
    
    // Education Sponsorship Project
    "projects.sponsorship.title": "Bildungspatenschaftsprojekt",
    "projects.sponsorship.teaser": "Qualitätsbildung durch Patenschaften und Transport zugänglich machen",
    "projects.sponsorship.description": "Wir sponsern Schulbildung für Kinder in der bestehenden Schulen und bieten Transportdienste. Dieses Projekt macht Schulbildung für mehr Kinder zugänglich, indem wir die hohen Kosten der Schulbildung und die Entfernung zu anderen Schulen reduzieren.",
    "projects.sponsorship.goal1": "Schulbildung für Kinder sponsern, die sich die Schulgebühren nicht leisten können",
    "projects.sponsorship.goal2": "Sicheren Transport zur und von der Schule anbieten",
    "projects.sponsorship.goal3": "Zugang zu qualitätsvoller Bildung für alle Gemeindekinder sicherstellen",
    "projects.sponsorship.impact": "Dieses Projekt beseitigt finanzielle Barrieren zur Bildung und bietet sicheren Transport, um sicherzustellen, dass alle Kinder in der Gemeinde Zugang zu qualitätsvoller Schulbildung haben, unabhängig von der finanziellen Situation ihrer Familie.",
    "projects.sponsorship.status": "Planungsphase - Kostenanalyse und Schulpartnerschaftsgespräche",
    "projects.sponsorship.button": "Projekt unterstützen 📚",
    "projects.livestock.title": "Viehversorgung & Landwirtschaft",
    "projects.livestock.teaser": "Gemeinschaften durch nachhaltige Landwirtschaft stärken",
    "projects.livestock.description": "Unsere gemeindezentrierte Landwirtschaftsinitiative bietet Bildung, Beschäftigung und Ernährungssicherheit für gefährdete Familien. Wir arbeiten eng mit Gemeindevorstehern zusammen, um die Bedürftigsten zu identifizieren und praktische Schulungen in Tierhaltung und nachhaltigen Landwirtschaftspraktiken anzubieten. Alle Hofgewinne werden als Sachleistungen reinvestiert, um die gefährdetsten Mitglieder unserer Gemeinschaft zu unterstützen.",
    "projects.livestock.goal1": "Nachhaltige Beschäftigungsmöglichkeiten für gefährdete Familien schaffen",
    "projects.livestock.goal2": "Umfassende landwirtschaftliche Bildung und Kompetenzentwicklung bieten",
    "projects.livestock.goal3": "Ernährungssicherheit und Gemeinschaftsresilienz durch lokale Landwirtschaft gewährleisten",
    "projects.livestock.impact": "Gefährdete Familien erwerben wertvolle Fähigkeiten, stabiles Einkommen und Ernährungssicherheit und stärken gleichzeitig die landwirtschaftliche Kapazität und Resilienz der gesamten Gemeinschaft.",
    "projects.livestock.status": "In Vorbereitung – Planung und Absprache mit Gemeinde",
    "projects.livestock.button": "Mehr erfahren 🐄",
    "projects.financial.title": "Financial Literacy & Bildung",
    "projects.financial.teaser": "Der Schlüssel zu Selbstständigkeit",
    "projects.financial.description": "Finanzielle Bildung ist der Schlüssel zu Selbstständigkeit. Wir entwickeln Trainings und Lernzentren, um Jugendliche und Erwachsene zu stärken.",
    "projects.financial.goal1": "Trainings zu Finanzen & Budgetplanung",
    "projects.financial.goal2": "Aufbau lokaler Lernräume",
    "projects.financial.goal3": "Partnerschaften mit Schulen",
    "projects.financial.impact": "Mehr als 100 Jugendliche sollen Zugang zu praxisnaher Finanzbildung erhalten.",
    "projects.financial.status": "In Vorbereitung – Lehrmaterialien erstellt",
    "projects.financial.button": "Unterstütze Bildung 📚",
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
    "team.phionah.name": "Phionah Nagujja",
    "team.tony.name": "Tony Kalulu",
    "team.member.name": "Teammitglied",
    "team.clara.name": "Clara Thümecke",
    "team.aaron.name": "Aaron Hesser",
    "team.eileen.name": "Eileen Kadivar",
    "team.yuan.name": "Yuan Yi Darneil",
    "team.max.name": "Max Loth",
    "team.tanja.name": "Tanja Rothenanger",
    "team.hansen.name": "Hansen Ilomo",
    
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
        "contact.form.sending": "Wird gesendet...",
    "contact.info.email": "E-Mail",
    "contact.info.address": "Adresse",
    "contact.info.social": "Social Media",
    "contact.note.title": "Hinweis:",
    "contact.note.text": "Wir befinden uns derzeit in der Aufbauphase. Spenden- und Freiwilligenmöglichkeiten werden in Kürze verfügbar sein. Vielen Dank für Ihr Interesse und Ihre Geduld!",
    "contact.error.title": "Fehler",
    "contact.error.required": "Bitte füllen Sie alle Pflichtfelder aus.",
    "contact.error.email": "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    "contact.error.send": "Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
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
    
    // Donation Page
    "donation.hero.title": "Ihre Unterstützung bringt Hoffnung.",
    "donation.hero.subtitle": "Jede Spende hilft uns, Gemeinschaften in Uganda mit Zugang zu Wasser, Bildung und nachhaltigen Lebensgrundlagen zu stärken.",
    "donation.hero.button": "Jetzt spenden",
    "donation.mission.title": "Unsere Mission",
    "donation.mission.p1": "Alma Bridge of Hope e.V. ist eine gemeinnützige Organisation mit Sitz in Deutschland, die gemeindegesteuerte Initiativen in Uganda unterstützt.",
    "donation.mission.p2": "Unser Ziel ist es, selbsttragende Gemeinschaften durch Zugang zu sauberem Wasser, Energie, Bildung und finanzieller Bildung zu schaffen.",
    "donation.form.title": "Spende leisten",
    "donation.form.type": "Spendenart",
    "donation.form.onetime": "Einmalig",
    "donation.form.monthly": "Monatlich",
    "donation.form.amount": "Betrag (€)",
    "donation.form.custom": "Oder eigenen Betrag eingeben",
    "donation.form.payment": "Zahlungsmethode",
    "donation.form.paypal": "PayPal",
    "donation.form.sepa": "SEPA-Überweisung",
    "donation.form.card": "Kreditkarte",
    "donation.form.donate": "Jetzt spenden",
    "donation.form.donate_monthly": "Monatliche Spende starten",
    "donation.form.firstName": "Vorname *",
    "donation.form.lastName": "Nachname *",
    "donation.form.email": "E-Mail-Adresse *",
    "donation.form.street": "Straße und Hausnummer",
    "donation.form.postalCode": "Postleitzahl",
    "donation.form.city": "Stadt",
    "donation.form.country": "Land",
    "donation.form.comment": "Kommentar / Mitteilung (optional)",
    "donation.form.comment_placeholder": "z.B. 'Für Wasserprojekt'",
    "donation.form.wantsReceipt": "Ich möchte eine Spendenquittung erhalten",
    "donation.form.privacyConsent": "Ich stimme der Datenschutzerklärung zu und willige in die Verarbeitung meiner Daten zur Spendenabwicklung ein *",
    "donation.form.error.amount": "Bitte wählen oder geben Sie einen gültigen Spendenbetrag ein.",
    "donation.form.error.firstName": "Bitte geben Sie Ihren Vornamen ein.",
    "donation.form.error.lastName": "Bitte geben Sie Ihren Nachnamen ein.",
    "donation.form.error.email": "Bitte geben Sie Ihre E-Mail-Adresse ein.",
    "donation.form.error.emailInvalid": "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    "donation.form.error.address": "Bitte geben Sie Ihre vollständige Adresse für die Spendenquittung ein.",
    "donation.form.error.privacy": "Bitte akzeptieren Sie die Datenschutzerklärung, um fortzufahren.",
    "donation.form.success": "Vielen Dank für Ihre Spende! Sie erhalten in Kürze eine Bestätigungs-E-Mail.",
    "donation.form.personalInfo": "Persönliche Angaben",
    "donation.form.addressInfo": "Adressangaben",
    "donation.form.addressNote": "Erforderlich für steuerlich absetzbare Spendenquittung",
    "donation.trust.title": "Vertrauen & Transparenz",
    "donation.trust.registered": "Eingetragener Verein",
    "donation.trust.registered.desc": "Gemeinnützig anerkannt in Deutschland",
    "donation.trust.tax": "Steuerlich absetzbar",
    "donation.trust.tax.desc": "Spenden sind steuerlich absetzbar",
    "donation.trust.transparency": "Volle Transparenz",
    "donation.trust.transparency.desc": "Regelmäßige Berichterstattung gewährleistet volle Transparenz",
    "donation.quote.text": "Wir glauben an Hilfe zur Selbsthilfe, nicht an Abhängigkeit.",
    "donation.quote.author": "– Peter, Alma Bridge of Hope Uganda",
    "donation.faq.title": "Häufig gestellte Fragen",
    "donation.faq.q1": "Wie kann ich spenden?",
    "donation.faq.a1": "Sie können einfach über PayPal, SEPA-Überweisung oder Kreditkarte mit unserem sicheren Spendenformular oben spenden.",
    "donation.faq.q2": "Erhalte ich eine Spendenquittung?",
    "donation.faq.a2": "Ja, Sie erhalten am Jahresende eine Spendenquittung für steuerliche Zwecke. Für sofortige Quittungen kontaktieren Sie uns bitte unter info@almabridgeofhope.org.",
    "donation.faq.q3": "Wie wird meine Spende verwendet?",
    "donation.faq.a3": "Ihre Spende unterstützt direkt unsere Projekte in Uganda, einschließlich Wasserzugang, Bildung und nachhaltigen Lebensgrundlagen-Programmen. Wir gewährleisten volle Transparenz in unserer Finanzberichterstattung.",
    "donation.faq.q4": "Kann ich meine monatliche Spende kündigen?",
    "donation.faq.a4": "Ja, Sie können Ihre monatliche Spende jederzeit kündigen, indem Sie uns unter info@almabridgeofhope.org kontaktieren oder über Ihren Zahlungsanbieter.",
    "donation.contact.title": "Fragen zum Spenden?",
    "donation.contact.subtitle": "Kontaktieren Sie uns bei Fragen zu Spenden, Spendenquittungen oder unserer Arbeit.",
    "donation.contact.email": "info@almabridgeofhope.org",
    "donation.contact.button": "Kontakt aufnehmen",
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
