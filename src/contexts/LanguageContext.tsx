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
    "nav.about": "About Us",
    "nav.news": "News",
    "nav.contact": "Contact",
    
    // Hero
    "hero.title": "Bridges of Hope Across Continents",
    "hero.subtitle": "Empowering sustainable community development in rural Uganda",
    
    // Mission
    "mission.title": "Our Mission",
    "mission.p1": "Alma Bridge of Hope is a non-profit organization dedicated to sustainable development in rural Uganda. Through a close German–Ugandan partnership, we work with underserved communities to improve their living conditions for the long term.",
    "mission.p2": "We believe real change comes from within the community. That’s why we develop every project together with the local people – creating solutions that are effective and sustainable.",
    "mission.p3": "Through practical, community-based initiatives, we do not only build infrastructure – we build bridges of hope that connect communities across continents and create lasting positive change.",
    "mission.contact": "Contact Us",
    "mission.donate": "Support Projects",
    
    // What We Do
    "whatwedo.title": "What We Do",
    "whatwedo.subtitle": "Our work focuses on three key areas that promote lasting change in rural Uganda.",
    "whatwedo.utilities.title": "Basic Utilities",
    "whatwedo.utilities.desc": "Bringing clean water and renewable energy solutions to remote communities.",
    "whatwedo.infrastructure.title": "Infrastructure & Local Empowerment",
    "whatwedo.infrastructure.desc": "Building sustainable infrastructure through active community participation.",
    "whatwedo.education.title": "Education & Training",
    "whatwedo.education.desc": "Supporting educational initiatives and training programs that build practical skills.",
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
    "footer.copyright": "© 2025 Alma Bridge of Hope. All rights reserved.",
    
    // Projects Page
    "projects.hero.title": "Our Projects",
    "projects.hero.subtitle": "Every project is a step toward a self-reliant future. Together, we build lasting foundations – from access to clean water and education to strengthening community life.",
    "projects.active.title": "Current Projects",
    "projects.planned.title": "Further Planned Initiatives",
    "projects.impact.title": "Our Impact",
    "projects.impact.subtitle": "Help us create even more impact.",
    "projects.impact.donate": "Donate Now",
    "projects.impact.tag1": "Local Growth",
    "projects.impact.fact1": "Local labor sourced from the community, ensuring income and skills stay within Namaliri.",
    "projects.impact.tag2": "Sustainable Energy",
    "projects.impact.fact2": "Solar power and rainwater systems to make the site self-sufficient and provide a consistent energy supply.",
    "projects.impact.tag3": "Water Access",
    "projects.impact.fact3": "People gain access to clean water through the new well and tank system.",
    "projects.timeline.planning": "Planning",
    "projects.timeline.building": "Building",
    "projects.timeline.implementation": "Implementation",
    "projects.timeline.impact": "Impact",
    "projects.goals": "Goals",
    "projects.impact_label": "Impact",
    "projects.status": "Status",
    "projects.community.title": "Community House",
    "projects.community.teaser": "The heart of our initiative",
    "projects.community.description": "We are building a Community House that will serve as a meeting point, training center, and base for all our programs. It will provide space for learning, collaboration, and sustainable development.",
    "projects.community.goal1": "Construct a central building with classrooms and office space",
    "projects.community.goal2": "Install solar panels on the roof for a reliable power supply",
    "projects.community.goal3": "Locate the well and livestock projects close to the Community House site",
    "projects.community.impact": "The Community House will become the central hub from which all other projects are coordinated, implemented, and further developed.",
    "projects.community.status": "Building phase",
    "projects.community.button": "Learn more",
    "projects.well.title": "Well Project",
    "projects.well.teaser": "Clean water for the community and local agriculture",
    "projects.well.description": "We are building a well to ensure reliable access to drinking water for the local community while supporting local farms.",
    "projects.well.goal1": "Provide clean drinking water for the community",
    "projects.well.goal2": "Supply farms with their own water source",
    "projects.well.goal3": "Install a dual-tank system for community and agricultural use",
    "projects.well.impact": "The well ensures reliable water access, improves community health, and supports sustainable farming practices.",
    "projects.well.status": "Planning phase – engineering assessment completed, cost analysis in progress",
    "projects.well.button": "Support Project 💧",
    
    // Young Mobility Project
    "projects.mobility.title": "Young Mobility Project",
    "projects.mobility.teaser": "Driving education for young adults",
    "projects.mobility.description": "We offer driving lessons and support young adults in obtaining their driver’s licenses.",
    "projects.mobility.goal1": "Provide driving lessons and support in obtaining a driver’s license",
    "projects.mobility.goal2": "Improve job opportunities for young people",
    "projects.mobility.goal3": "Provide sustainable transport solutions for the community",
    "projects.mobility.impact": "The project equips young adults with practical skills, opens doors to new career opportunities, and improves local transport options.",
    "projects.mobility.status": "Planning phase - cost analysis and vehicle procurement",
    "projects.mobility.button": "Support Project 🚗",
    
    // Education Sponsorship Project
    "projects.sponsorship.title": "Education Sponsorship Project",
    "projects.sponsorship.teaser": "Making education accessible through sponsorship and transport",
    "projects.sponsorship.description": "We sponsor children’s education at local schools and provide safe transport, as many face unsafe or difficult routes. This makes education accessible to more children by removing financial and logistical barriers.",
    "projects.sponsorship.goal1": "Provide education for children who cannot afford school fees",
    "projects.sponsorship.goal2": "Provide safe transport to and from school",
    "projects.sponsorship.goal3": "Ensure access to quality education for all community children",
    "projects.sponsorship.impact": "This project removes financial barriers to education and provides safe transport, ensuring that all children in the community have access to quality schooling regardless of their family's financial situation.",
    "projects.sponsorship.status": "Planning phase - cost analysis and school partnership discussions",
    "projects.sponsorship.button": "Support Project 📚",
    "projects.livestock.title": "Livestock & Agriculture",
    "projects.livestock.teaser": "Empowering communities through sustainable farming",
    "projects.livestock.description": "Our community-based agriculture initiative provides education, employment, and food security for vulnerable families. Working closely with community leaders, we identify those most in need and provide hands-on training in livestock management and sustainable farming practices. All farm profits are reinvested to support the community’s most vulnerable members.",
    "projects.livestock.goal1": "Create sustainable employment opportunities for vulnerable families",
    "projects.livestock.goal2": "Provide practical agricultural training",
    "projects.livestock.goal3": "Strengthen food security and community resilience through local farming",
    "projects.livestock.impact": "Vulnerable families gain valuable skills, steady income, and food security, while local agriculture and the community are strengthened.",
    "projects.livestock.status": "In preparation – planning and coordination with community",
    "projects.livestock.button": "Learn more 🐄",
    "projects.financial.title": "Financial Literacy & Education",
    "projects.financial.teaser": "The key to independence",
    "projects.financial.description": "Financial literacy is the key to self-reliance. We develop training programs to help young people and adults manage their finances independently.",
    "projects.financial.goal1": "Provide practical financial education for over 100 young people in the community",
    "projects.financial.goal2": "Set up local learning spaces",
    "projects.financial.goal3": "Build partnerships with schools",
    "projects.financial.impact": "Financial awareness and independent decision-making skills are strengthened across the community.",
    "projects.financial.status": "In preparation – teaching materials created",
    "projects.financial.button": "Support Education 📚",
    "projects.stats.projects": "Projects",
    "projects.stats.active": "Active in Construction",
    "projects.stats.people": "People Reached",
    "projects.stats.volunteers": "Engaged & Volunteers",
    
    // Team Page
    "team.hero.subtitle": "Building bridges together between Uganda and Germany",
    "team.intro.title": "International Cooperation",
    "team.intro.p1": "Alma Bridge of Hope is a joint project of dedicated people from Uganda and Germany. Our strength lies in the close cooperation between both countries: While our team in Uganda implements the projects on site and directly supports the local communities, our German team coordinates strategic development, fundraising and international partnerships.",
    "team.intro.p2": "This intercontinental cooperation enables us to promote sustainable development that is really designed by and with the people on the ground.",
    "team.uganda.title": "Team Uganda",
    "team.germany.title": "Team Germany",
    "team.peter.name": "Peter Ssenga",
    "team.phionah.name": "Phionah Nagujja",
    "team.tony.name": "Tony Kalulu",
    "team.clara.name": "Clara Thümecke",
    "team.aaron.name": "Aaron Hesser",
    "team.eileen.name": "Eileen Kadivar",
    "team.yuan.name": "Yuan Yi Danneil",
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
    "community.description1": "Our work focuses on the village of Namaliri in Njeru Town Council, Mukono District, Uganda. Together with the local community, we implement sustainable development projects tailored to the specific needs of this agricultural region.",
    "community.description2": "All our projects are carefully planned in consultation with community leaders and focus especially on supporting the most vulnerable members of the community. We believe that lasting change begins within the community – led by those who know local needs best.",
    "community.description3": "Through close collaboration with village leaders, families, and local organizations, we ensure that every initiative meets real needs and creates lasting, tangible impact for the people who call Namaliri village home.",
    "community.stats.people": "Community Members",
    "community.stats.water_source": "Distance to nearest water source",
    "community.stats.education": "Children go to school regularly",
    "community.location.title": "Community Location",
    "community.location.title_2": "Community Center Location",
    "community.location.region": "Namaliri Village, Njeru Town Council, Mukono District, Uganda",
    
    // Impressum
    "impressum.title": "Legal Notice",
    "impressum.organization.title": "Organization",
    "impressum.organization.name": "Alma Bridge of Hope e.V.",
    "impressum.organization.address": "Ferchensee 8, 83562 Rechtmehring",
    "impressum.organization.country": "Germany",
    "impressum.board.title": "Represented by the Board",
    "impressum.board.chairman": "Aaron Hesser (1st Chairman)",
    "impressum.board.vice_chairman": "Clara Thümecke (2nd Vice Chairman)",
    "impressum.contact.title": "Contact",
    "impressum.contact.email": "E-Mail",
    "impressum.contact.email_value": "info@almabridgeofhope.org",
    "impressum.contact.website": "Website",
    "impressum.contact.website_value": "https://almabridgeofhope.org",
    "impressum.registration.title": "Registration",
    "impressum.registration.entry": "Registered in the association register.",
    "impressum.registration.court": "Register Court",
    "impressum.registration.court_value": "Amtsgericht Traunstein",
    "impressum.registration.number": "Registration Number",
    "impressum.registration.number_value": "VR [Number to be entered once available]",
    "impressum.tax.title": "Tax Status",
    "impressum.tax.status": "Alma Bridge of Hope e.V. is recognized as non-profit according to § 60a AO (Tax Office Mühldorf am Inn).",
    "impressum.responsibility.title": "Content Responsibility",
    "impressum.responsibility.person": "Clara Thümecke",
    "impressum.disclaimer.title": "Disclaimer",
    "impressum.disclaimer.content": "Despite careful content control, we assume no liability for the content of external links.",
    "impressum.disclaimer.links": "The operators of the linked pages are solely responsible for the content of the linked pages.",
    
    // Privacy Policy
    "privacy.title": "Privacy Policy",
    "privacy.intro": "We are pleased about your interest in Alma Bridge of Hope e.V. The protection of your personal data is important to us. Below we inform you about the processing of personal data on our website and in the context of our donation management.",
    "privacy.responsible.title": "Responsible Party",
    "privacy.responsible.name": "Alma Bridge of Hope e.V.",
    "privacy.responsible.address": "Ferchensee 8, 83562 Rechtmehring",
    "privacy.responsible.country": "Germany",
    "privacy.responsible.email": "E-Mail",
    "privacy.responsible.email_value": "info@almabridgeofhope.org",
    "privacy.responsible.board": "Represented by the Board: Aaron Hesser, Clara Thümecke",
    "privacy.website.title": "Website Visit",
    "privacy.website.description": "When you visit our website (hosted via GitHub Pages), information is automatically transmitted to the hosting provider's server by the browser used on your device. This information is temporarily stored in so-called log files.",
    "privacy.website.collected": "The following data is collected in particular:",
    "privacy.website.ip": "IP address of the requesting computer",
    "privacy.website.datetime": "Date and time of access",
    "privacy.website.filename": "Name and URL of the accessed file",
    "privacy.website.browser": "Browser type and browser version",
    "privacy.website.os": "Operating system used",
    "privacy.website.purpose": "This data is technically necessary to display the website and ensure stability and security. No evaluation for marketing purposes takes place.",
    "privacy.website.legal_basis": "Legal basis:",
    "privacy.website.legal_basis_text": "Art. 6 para. 1 lit. f GDPR (legitimate interest).",
    "privacy.paypal.title": "Donation Processing via PayPal",
    "privacy.paypal.description": "For processing donation payments, we use PayPal (PayPal Europe S.à r.l. et Cie, S.C.A., Luxembourg).",
    "privacy.paypal.data_transfer": "When you donate via the PayPal button, personal data (e.g., name, email, payment information) is transmitted to PayPal.",
    "privacy.paypal.legal_basis": "Legal basis:",
    "privacy.paypal.legal_basis_text": "Art. 6 para. 1 lit. b GDPR (contract fulfillment).",
    "privacy.paypal.more_info": "Further information can be found in PayPal's privacy policy",
    "privacy.paypal.link_text": "here",
    "privacy.donor_data.title": "Processing of Donor Data",
    "privacy.donor_data.description": "When you make a donation, we collect the following personal data:",
    "privacy.donor_data.name": "First and last name",
    "privacy.donor_data.email": "Email address",
    "privacy.donor_data.address": "Address (for donation receipt)",
    "privacy.donor_data.amount": "Donation amount and date",
    "privacy.donor_data.payment": "Payment method (e.g., PayPal, bank transfer)",
    "privacy.donor_data.usage": "This data is used exclusively for donation management, accounting, and issuing donation receipts.",
    "privacy.donor_data.legal_basis": "Legal basis:",
    "privacy.donor_data.legal_basis_1": "Art. 6 para. 1 lit. b GDPR (contract fulfillment – processing the donation)",
    "privacy.donor_data.legal_basis_2": "Art. 6 para. 1 lit. c GDPR (fulfillment of tax retention obligations)",
    "privacy.storage.title": "Data Storage and Management",
    "privacy.storage.description": "For managing our donor data and documents, we use the following cloud-based tools:",
    "privacy.storage.notion.title": "Notion (Notion Labs Inc., USA)",
    "privacy.storage.notion.description": "We store and manage contact data of our donors in Notion.",
    "privacy.storage.notion.legal": "Notion processes data on our behalf based on a data processing agreement (Data Processing Addendum) with standard contractual clauses according to Art. 46 GDPR.",
    "privacy.storage.notion.more_info": "Further information:",
    "privacy.storage.notion.link_text": "https://www.notion.so/Privacy-Policy",
    "privacy.storage.google.title": "Google Drive (Google Ireland Ltd.)",
    "privacy.storage.google.description": "Donation receipts and donation confirmations are stored in our Google Drive account.",
    "privacy.storage.google.legal": "Data processing takes place within the EU or based on standard contractual clauses for data transfers to third countries.",
    "privacy.storage.google.more_info": "Further information:",
    "privacy.storage.google.link_text": "https://policies.google.com/privacy",
    "privacy.storage.access": "We ensure that only authorized association members have access to this data.",
    "privacy.duration.title": "Storage Duration",
    "privacy.duration.description": "We store personal data only as long as necessary for fulfilling our statutory purposes, tax retention periods (usually 10 years), or legal proof obligations. After that, the data is deleted or anonymized.",
    "privacy.rights.title": "Your Rights",
    "privacy.rights.description": "You have the right:",
    "privacy.rights.access": "to information about your stored data (Art. 15 GDPR)",
    "privacy.rights.correction": "to rectification (Art. 16 GDPR)",
    "privacy.rights.deletion": "to erasure (Art. 17 GDPR)",
    "privacy.rights.restriction": "to restriction of processing (Art. 18 GDPR)",
    "privacy.rights.portability": "to data portability (Art. 20 GDPR)",
    "privacy.rights.objection": "to object to processing (Art. 21 GDPR)",
    "privacy.rights.withdrawal": "You can revoke any consent given at any time with effect for the future.",
    "privacy.complaint.title": "Right to Complain",
    "privacy.complaint.description": "You have the right to complain to a data protection supervisory authority, e.g., at:",
    "privacy.complaint.authority": "State Commissioner for Data Protection and Freedom of Information Bavaria (Bayerisches Landesamt für Datenschutzaufsicht)",
    "privacy.complaint.address": "Ferchensee 8, 83562 Rechtmehring",
    "privacy.complaint.website": "https://www.datenschutz-bayern.de",
    "privacy.contact.title": "Data Protection Contact",
    "privacy.contact.name": "Clara Thümecke",
    "privacy.contact.organization": "Alma Bridge of Hope e.V.",
    "privacy.contact.email": "E-Mail",
    "privacy.contact.email_value": "info@almabridgeofhope.org",
    "privacy.last_updated": "Last updated: November 2025",
    
    // Donation Page
    "donation.hero.title": "Your support brings hope",
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
    "donation.form.error.payment": "Payment failed. Please try again.",
    "donation.form.success": "Thank you for your donation! You will receive a confirmation email shortly.",
    "donation.form.paypalNote": "You will be redirected to PayPal to complete your payment securely.",
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
    "donation.quote.author": "– Aaron Hesser, Alma Bridge of Hope",
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
    
    // Donation Warning
    "donation.warning.title": "Testing Mode",
    "donation.warning.message": "This donation system is currently in testing mode and not fully set up yet. No actual payments will be processed. This is for demonstration purposes only.",
    "donation.warning.continue": "I understand, continue",
    "donation.warning.cancel": "Cancel",
    
    // News Page
    "news.hero.title": "News & Updates",
    "news.hero.subtitle": "Stay informed about our latest developments, community stories, and project progress.",
    "news.all_news.title": "All News",
    "news.all_news.subtitle": "Regular updates from our work in Uganda and Germany",
    "news.date_format": "en-US",
    "news.categories.project_update": "Project Update",
    "news.categories.community": "Community",
    "news.categories.organization": "Organization",
    "news.newsletter.title": "Stay Updated",
    "news.newsletter.subtitle": "Get the latest news and updates delivered to your inbox",
    "news.newsletter.button": "Subscribe to Newsletter",
    "news.back_to_news": "Back to News",
    "news.article_not_found.title": "Article Not Found",
    "news.article_not_found.subtitle": "The article you're looking for doesn't exist or has been removed.",
    "news.article1.title": "Community House Construction Reaches Major Milestone in Namaliri Village",
    "news.article1.excerpt": "Significant progress has been made on our Community House project, with the foundation now complete and walls beginning to take shape. This central hub will serve as the heart of all our programs in rural Uganda.",
    "news.article1.content": "The Community House project has reached a major milestone with the completion of the foundation and the beginning of wall construction. This central hub will serve as the heart of all our programs in Namaliri village, providing a space for education, community meetings, and sustainable development initiatives.",
    "news.article1.author": "Peter Ssenga",
    "news.article1.sections.progress": "Construction Progress Highlights:",
    "news.article1.sections.progress_points": "Foundation completed with reinforced concrete structure|Wall construction 40% complete using locally sourced materials|Solar panel installation framework prepared|Water connection infrastructure planned and approved",
    "news.article1.sections.community_impact": "Community Impact:",
    "news.article1.sections.community_points": "Over 150 community members actively participating in construction|Local employment opportunities created for 25+ residents|Skills training programs running alongside construction|Community meetings held weekly to ensure project alignment with local needs",
    "news.article1.sections.next_steps": "What's Next:",
    "news.article1.sections.next_steps_points": "Complete wall construction by end of February|Install solar panels for sustainable energy|Begin interior work on classrooms and office spaces|Prepare for official opening ceremony in March",
    "news.article1.sections.conclusion": "This Community House represents more than just a building—it's a symbol of hope and collaboration. As construction progresses, we're witnessing the power of community-driven development and the strong partnership between our German and Ugandan teams. Together, we're building not just infrastructure, but lasting relationships that will support sustainable development for years to come.",
    "news.article2.title": "Community Engagement Program Exceeds Expectations in Namaliri Village",
    "news.article2.excerpt": "Our community engagement initiatives have brought together over 150 local residents to participate in project planning and implementation, creating a strong foundation for sustainable development.",
    "news.article2.content": "The community engagement program has exceeded expectations, with strong participation from local leaders and families in shaping our development projects. This collaborative approach ensures that all initiatives truly serve the community's needs.",
    "news.article2.author": "Phionah Nagujja",
    "news.article2.sections.participation": "Community Participation Highlights:",
    "news.article2.sections.participation_points": "150+ community members actively involved in project planning|Weekly community meetings with 80%+ attendance|Local leaders taking leadership roles in project committees|Youth groups organizing community clean-up initiatives",
    "news.article2.sections.impact": "Measurable Impact:",
    "news.article2.sections.impact_points": "95% of community members report feeling heard and valued|Local decision-making processes strengthened|Traditional knowledge integrated with modern development approaches|Women's participation increased by 60% in community meetings",
    "news.article2.sections.success_factors": "Key Success Factors:",
    "news.article2.sections.success_factors_points": "Regular communication in local languages|Flexible meeting times to accommodate farming schedules|Recognition and celebration of community contributions|Transparent project planning and budget discussions",
    "news.article3.title": "New Team Members Join German Office",
    "news.article3.excerpt": "We're excited to welcome new volunteers to our German team, strengthening our capacity for fundraising and project coordination.",
    "news.article3.content": "Our German team has grown with the addition of dedicated volunteers who bring valuable skills in project management and community outreach.",
    "news.article3.author": "Clara Thümecke",
    "news.article3.sections.growth": "Team Growth Highlights:",
    "news.article3.sections.growth_points": "Three new volunteers joined our German office|Enhanced fundraising capabilities with specialized skills|Improved project coordination and management|Expanded community outreach and partnership development",
    "news.article3.sections.impact": "Organizational Impact:",
    "news.article3.sections.impact_points": "Increased capacity for strategic planning and development|Enhanced communication between German and Ugandan teams|Improved donor relations and fundraising efforts|Strengthened project monitoring and evaluation processes",
    "news.article3.sections.future": "Looking Ahead:",
    "news.article3.sections.future_points": "Continued team expansion planned for 2025|Enhanced training programs for new volunteers|Improved coordination with local partners in Uganda|Strengthened international collaboration and knowledge sharing",
    "news.quote.text": "Building bridges of hope across continents through sustainable community development.",
    "news.quote.author": "Alma Bridge of Hope Team",
    "news.donation.title": "Support Our Mission",
    "news.donation.subtitle": "Help us continue building bridges of hope in Uganda",
    "news.donation.button": "Donate Now",
    "news.related_articles.title": "Related Articles",
    "news.read_more": "Read More",
    
    // 404 Page
    "404.title": "Page Not Found",
    "404.subtitle": "The page you're looking for doesn't exist or has been moved.",
    "404.description": "Don't worry, it happens to the best of us. Let's get you back on track.",
    "404.button_home": "Go Home",
    "404.button_projects": "View Projects",
    "404.button_contact": "Contact Us",
    "404.helpful_links": "News",
    "404.suggestions": "Here are some recent articles you might find interesting:",
  },
  de: {
    // Navigation
    "nav.home": "Startseite",
    "nav.projects": "Projekte",
    "nav.about": "Über uns",
    "nav.news": "Nachrichten",
    "nav.contact": "Kontakt",
    
    // Hero
    "hero.title": "Brücken der Hoffnung zwischen Kontinenten",
    "hero.subtitle": "Wir fördern die nachhaltige Entwicklung von Gemeinden im ländlichen Uganda",
    
    // Mission
    "mission.title": "Unsere Mission",
    "mission.p1": "Alma Bridge of Hope ist ein gemeinnütziger Verein, der sich für nachhaltige Entwicklungsarbeit im ländlichen Uganda einsetzt. In enger deutsch-ugandischer Partnerschaft unterstützen wir unterversorgte Gemeinden dabei, ihre Lebensbedingungen langfristig zu verbessern.",
    "mission.p2": "Wir glauben, dass echte Veränderung aus der Gemeinde selbst entsteht. Deshalb entwickeln wir alle Projekte gemeinsam mit den Menschen vor Ort, um Lösungen zu schaffen, die wirken und nachhaltig Bestand haben.",
    "mission.p3": "Mit unseren praktischen, lokalen Entwicklungsprojekten fördern wir nicht nur den Aufbau von Infrastruktur, sondern bauen Brücken der Hoffnung – Verbindungen zwischen Kontinenten, die Menschen zusammenbringen und dauerhafte positive Veränderungen ermöglichen.",
    "mission.contact": "Kontakt aufnehmen",
    "mission.donate": "Projekte unterstützen",
    
    // What We Do
    "whatwedo.title": "Was wir tun",
    "whatwedo.subtitle": "Unsere Arbeit konzentriert sich auf drei zentrale Bereiche, mit denen wir nachhaltige Veränderungen im ländlichen Uganda fördern.",
    "whatwedo.utilities.title": "Grundversorgung",
    "whatwedo.utilities.desc": "Zugang zu sauberem Wasser und erneuerbaren Energielösungen für abgelegene Gemeinden schaffen.",
    "whatwedo.infrastructure.title": "Infrastruktur & lokale Stärkung",
    "whatwedo.infrastructure.desc": "Aufbau nachhaltiger Infrastruktur durch Einbezug der Gemeinden vor Ort.",
    "whatwedo.education.title": "Bildung & Training",
    "whatwedo.education.desc": "Unterstützung von Bildungsinitiativen und Programmen, die praktische Fähigkeiten vermitteln.",
    "whatwedo.button": "Alle Projekte ansehen",
    
    // Team
    "team.title": "Über uns",
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
    "footer.copyright": "© 2025 Alma Bridge of Hope. Alle Rechte vorbehalten.",
    
    // Projects Page
    "projects.hero.title": "Unsere Projekte",
    "projects.hero.subtitle": "Jedes Projekt ist ein Schritt zu einer selbstbestimmten Zukunft. Gemeinsam schaffen wir Strukturen, die langfristig Bestand haben – von Wasser über Bildung bis hin zur Stärkung der Gemeinschaft.",
    "projects.active.title": "Aktuelle Projekte",
    "projects.planned.title": "Weitere geplante Initiativen",
    "projects.impact.title": "Unsere Wirkung",
    "projects.impact.subtitle": "Hilf uns, noch mehr Wirkung zu entfalten.",
    "projects.impact.donate": "Jetzt spenden",
    "projects.impact.tag1": "Lokales Wachstum",
    "projects.impact.fact1": "Arbeitskräfte aus der Gemeinde, die Einkommen und Fähigkeiten in Namaliri sichern.",
    "projects.impact.tag2": "Nachhaltige Energie",
    "projects.impact.fact2": "Solar- und Regenwassersystem, um den Standort autark zu machen und konsequente Energieversorgung zu gewährleisten.",
    "projects.impact.tag3": "Wasserzugang",
    "projects.impact.fact3": "Menschen erhalten Zugang zu sauberem Wasser durch das neue Brunnen- und Tanksystem.",
    "projects.timeline.planning": "Planung",
    "projects.timeline.building": "Aufbau",
    "projects.timeline.implementation": "Umsetzung",
    "projects.timeline.impact": "Wirkung",
    "projects.goals": "Ziele",
    "projects.impact_label": "Impact",
    "projects.status": "Status",
    "projects.community.title": "Community House",
    "projects.community.teaser": "Das Herzstück unserer Initiative",
    "projects.community.description": "Wir errichten ein Community House, das als Treffpunkt, Schulungszentrum und Ausgangspunkt für alle Programme dient. Hier entsteht Raum für Bildung, Zusammenarbeit und nachhaltige Entwicklung.",
    "projects.community.goal1": "Ein zentrales Haus mit Lern- und Büroräumen errichten",
    "projects.community.goal2": "Solaranlagen auf dem Dach installieren, um eine verlässliche Stromversorgung sicherzustellen",
    "projects.community.goal3": "Brunnen- und Viehzuchtprojekte in unmittelbarer Nähe des Community House ansiedeln",
    "projects.community.impact": "Das Community House wird zum zentralen Dreh- und Angelpunkt, von dem aus alle weiteren Projekte koordiniert, umgesetzt und weiterentwickelt werden.",
    "projects.community.status": "Aufbauphase",
    "projects.community.button": "Mehr erfahren",
    "projects.well.title": "Brunnenprojekt",
    "projects.well.teaser": "Sauberes Wasser für Gemeinde und Landwirtschaft",
    "projects.well.description": "Wir errichten einen Brunnen, um Trinkwasser für die lokale Gemeinschaft bereitzustellen und die landwirtschaftlichen Betriebe zu unterstützen.",
    "projects.well.goal1": "Sauberes Trinkwasser für die lokale Gemeinschaft bereitstellen",
    "projects.well.goal2": "Landwirtschaftliche Betriebe mit eigenem Wasservorrat versorgen",
    "projects.well.goal3": "Dual-Tank-System für Gemeinde- und landwirtschaftliche Nutzung einrichten",
    "projects.well.impact": "Der Brunnen sorgt für zuverlässigen Wasserzugang, stärkt die Gesundheit der Gemeinde und unterstützt nachhaltige landwirtschaftliche Betriebe.",
    "projects.well.status": "Planungsphase – Ingenieursbewertung abgeschlossen, Kostenanalyse läuft",
    "projects.well.button": "Projekt unterstützen 💧",
    
    // Young Mobility Project
    "projects.mobility.title": "Jugend-Mobilitätsprojekt",
    "projects.mobility.teaser": "Fahrschulausbildung für Jugendliche",
    "projects.mobility.description": "Wir bieten Fahrstunden an und unterstützen junge Erwachsene beim Erwerb des Führerscheins.",
    "projects.mobility.goal1": "Fahrausbildung anbieten und Führerscheinerwerb ermöglichen",
    "projects.mobility.goal2": "Beschäftigungsperspektiven für junge Menschen verbessern",
    "projects.mobility.goal3": "Nachhaltige Transportlösungen für die Gemeinde schaffen",
    "projects.mobility.impact": "Das Projekt vermittelt jungen Erwachsenen wertvolle Fähigkeiten, eröffnet neue berufliche Chancen und verbessert die Transportmöglichkeiten in der Gemeinde.",
    "projects.mobility.status": "Planungsphase - Kostenanalyse und Fahrzeugbeschaffung",
    "projects.mobility.button": "Projekt unterstützen 🚗",
    
    // Education Sponsorship Project
    "projects.sponsorship.title": "Bildungspatenschaftsprojekt",
    "projects.sponsorship.teaser": "Bildung durch Patenschaften und Transport zugänglich machen",
    "projects.sponsorship.description": "Wir sponsern die Schulbildung von Kindern an örtlichen Schulen und stellen sichere Transportmöglichkeiten bereit, da der Schulweg für viele unsicher ist. So wird Bildung für mehr Kinder möglich, indem finanzielle Hürden und lange Wege überwunden werden.",
    "projects.sponsorship.goal1": "Schulbildung für Kinder anbieten, die sich die Gebühren sonst nicht leisten könnten",
    "projects.sponsorship.goal2": "Sicherer Transport zur und von der Schule bereitstellen",
    "projects.sponsorship.goal3": "Zugang zu qualitätsvoller Bildung für alle Gemeindekinder sicherstellen",
    "projects.sponsorship.impact": "Dieses Projekt beseitigt finanzielle Barrieren zur Bildung und bietet sicheren Transport, um sicherzustellen, dass alle Kinder in der Gemeinde Zugang zu qualitätsvoller Schulbildung haben, unabhängig von der finanziellen Situation ihrer Familie.",
    "projects.sponsorship.status": "Planungsphase - Kostenanalyse und Schulpartnerschaftsgespräche",
    "projects.sponsorship.button": "Projekt unterstützen 📚",
    "projects.livestock.title": "Viehversorgung & Landwirtschaft",
    "projects.livestock.teaser": "Gemeinschaften durch nachhaltige Landwirtschaft stärken",
    "projects.livestock.description": "Unsere gemeindebasierte Landwirtschaftsinitiative schafft Bildung, Beschäftigung und Ernährungssicherheit für gefährdete Familien. Gemeinsam mit den Gemeindevorstehern identifizieren wir die Bedürftigsten und bieten praxisnahe Schulungen in Tierhaltung und nachhaltigen Anbaumethoden an. Alle Erträge werden reinvestiert, um die am stärksten gefährdeten Mitglieder der Gemeinschaft zu unterstützen.",
    "projects.livestock.goal1": "Nachhaltige Beschäftigungsmöglichkeiten für gefährdete Familien schaffen",
    "projects.livestock.goal2": "Umfassende landwirtschaftliche Bildung bieten",
    "projects.livestock.goal3": "Ernährungssicherheit und Resilienz der Gemeinschaft durch lokale Landwirtschaft stärken",
    "projects.livestock.impact": "Gefährdete Familien erwerben wertvolle Fähigkeiten, stabiles Einkommen und Ernährungssicherheit. Gleichzeitig werden Landwirtschaft und Gemeinschaft nachhaltig gestärkt.",
    "projects.livestock.status": "In Vorbereitung – Planung und Absprache mit Gemeinde",
    "projects.livestock.button": "Mehr erfahren 🐄",
    "projects.financial.title": "Financial Literacy & Bildung",
    "projects.financial.teaser": "Der Schlüssel zu Selbstständigkeit",
    "projects.financial.description": "Finanzielle Bildung ist der Schlüssel zu Selbstständigkeit. Wir entwickeln Schulungsprogramme, um Jugendliche und Erwachsene in der eigenständigen Finanzplanung zu unterstützen.",
    "projects.financial.goal1": "Über 100 Jugendliche der Gemeinde praxisnah in Finanzbildung schulen",
    "projects.financial.goal2": "Lokale Lernräume aufbauen",
    "projects.financial.goal3": "Partnerschaften mit Schulen etablieren",
    "projects.financial.impact": "Finanzbewusstsein und selbstständiges Handeln werden in der Gemeinde gestärkt.",
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
    "team.clara.name": "Clara Thümecke",
    "team.aaron.name": "Aaron Hesser",
    "team.eileen.name": "Eileen Kadivar",
    "team.yuan.name": "Yuan Yi Danneil",
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
    "community.description1": "Unsere Arbeit konzentriert sich auf das Dorf Namaliri in der Stadtgemeinde Njeru im Mukono-Distrikt, Uganda. Gemeinsam mit der Dorfgemeinschaft setzen wir nachhaltige Entwicklungsprojekte um, die auf die spezifischen Bedürfnisse dieser landwirtschaftlich geprägten Region zugeschnitten sind.",
    "community.description2": "Alle Projekte werden in enger Abstimmung mit den Gemeindevorstehern geplant und richten sich insbesondere an die am stärksten gefährdeten Mitglieder der Gemeinschaft. Wir sind überzeugt, dass nachhaltiger Wandel aus der Gemeinschaft selbst entsteht – angeleitet von denjenigen, die die lokalen Bedürfnisse am besten kennen.",
    "community.description3": "Durch die enge Zusammenarbeit mit Dorfvorstehern, Familien und lokalen Organisationen stellen wir sicher, dass jede Initiative reale Bedürfnisse anspricht und nachhaltige, greifbare Wirkung für die Menschen erzielt, die Namaliri ihr Zuhause nennen.",
    "community.stats.people": "Gemeindemitglieder",
    "community.stats.water_source": "Entfernung zur nächsten Wasserquelle",
    "community.stats.education": "der Kinder gehen regelmäßig zur Schule",
    "community.location.title": "Standort der Gemeinde",
    "community.location.title_2": "Standort des Community Centers",
    "community.location.region": "Namaliri Dorf, Njeru Stadtgemeinde, Mukono-Distrikt, Uganda",
    
    // Impressum
    "impressum.title": "Impressum",
    "impressum.organization.title": "Verein",
    "impressum.organization.name": "Alma Bridge of Hope e.V.",
    "impressum.organization.address": "Ferchensee 8, 83562 Rechtmehring",
    "impressum.organization.country": "Deutschland",
    "impressum.board.title": "Vertreten durch den Vorstand",
    "impressum.board.chairman": "Aaron Hesser (1. Vorsitzender)",
    "impressum.board.vice_chairman": "Clara Thümecke (2. Vorsitzende)",
    "impressum.contact.title": "Kontakt",
    "impressum.contact.email": "E-Mail",
    "impressum.contact.email_value": "info@almabridgeofhope.org",
    "impressum.contact.website": "Website",
    "impressum.contact.website_value": "https://almabridgeofhope.org",
    "impressum.registration.title": "Registereintrag",
    "impressum.registration.entry": "Eingetragen im Vereinsregister.",
    "impressum.registration.court": "Registergericht",
    "impressum.registration.court_value": "Amtsgericht Traunstein",
    "impressum.registration.number": "Registernummer",
    "impressum.registration.number_value": "VR [Nummer eintragen, sobald vorhanden]",
    "impressum.tax.title": "Gemeinnützigkeit",
    "impressum.tax.status": "Alma Bridge of Hope e.V. ist nach § 60a AO als gemeinnützig anerkannt (Finanzamt Mühldorf am Inn).",
    "impressum.responsibility.title": "Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV",
    "impressum.responsibility.person": "Clara Thümecke",
    "impressum.disclaimer.title": "Haftungsausschluss",
    "impressum.disclaimer.content": "Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links.",
    "impressum.disclaimer.links": "Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.",
    
    // Privacy Policy
    "privacy.title": "Datenschutzerklärung",
    "privacy.intro": "Wir freuen uns über Ihr Interesse an Alma Bridge of Hope e.V. Der Schutz Ihrer personenbezogenen Daten ist uns ein wichtiges Anliegen. Nachfolgend informieren wir Sie über die Verarbeitung personenbezogener Daten auf unserer Website sowie im Rahmen unserer Spendenverwaltung.",
    "privacy.responsible.title": "Verantwortliche Stelle",
    "privacy.responsible.name": "Alma Bridge of Hope e.V.",
    "privacy.responsible.address": "Ferchensee 8, 83562 Rechtmehring",
    "privacy.responsible.country": "Deutschland",
    "privacy.responsible.email": "E-Mail",
    "privacy.responsible.email_value": "info@almabridgeofhope.org",
    "privacy.responsible.board": "Vertreten durch den Vorstand: Aaron Hesser, Clara Thümecke",
    "privacy.website.title": "Besuch der Website",
    "privacy.website.description": "Beim Aufrufen unserer Website (gehostet über GitHub Pages) werden durch den auf Ihrem Endgerät zum Einsatz kommenden Browser automatisch Informationen an den Server des Hosting-Anbieters übermittelt. Diese werden temporär in sogenannten Logfiles gespeichert.",
    "privacy.website.collected": "Erfasst werden insbesondere:",
    "privacy.website.ip": "IP-Adresse des anfragenden Rechners",
    "privacy.website.datetime": "Datum und Uhrzeit des Zugriffs",
    "privacy.website.filename": "Name und URL der abgerufenen Datei",
    "privacy.website.browser": "Browsertyp und Browserversion",
    "privacy.website.os": "verwendetes Betriebssystem",
    "privacy.website.purpose": "Diese Daten sind technisch erforderlich, um die Website anzuzeigen und die Stabilität und Sicherheit zu gewährleisten. Eine Auswertung zu Marketingzwecken findet nicht statt.",
    "privacy.website.legal_basis": "Rechtsgrundlage:",
    "privacy.website.legal_basis_text": "Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).",
    "privacy.paypal.title": "Spendenabwicklung über PayPal",
    "privacy.paypal.description": "Zur Abwicklung von Spendenzahlungen nutzen wir PayPal (PayPal Europe S.à r.l. et Cie, S.C.A., Luxemburg).",
    "privacy.paypal.data_transfer": "Wenn Sie über den PayPal-Button spenden, werden personenbezogene Daten (z. B. Name, E-Mail, Zahlungsinformationen) an PayPal übermittelt.",
    "privacy.paypal.legal_basis": "Rechtsgrundlage:",
    "privacy.paypal.legal_basis_text": "Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).",
    "privacy.paypal.more_info": "Weitere Informationen finden Sie in der Datenschutzerklärung von PayPal",
    "privacy.paypal.link_text": "hier",
    "privacy.donor_data.title": "Verarbeitung von Spenderdaten",
    "privacy.donor_data.description": "Wenn Sie eine Spende tätigen, erfassen wir folgende personenbezogene Daten:",
    "privacy.donor_data.name": "Name und Vorname",
    "privacy.donor_data.email": "E-Mail-Adresse",
    "privacy.donor_data.address": "ggf. Anschrift (für Spendenquittung)",
    "privacy.donor_data.amount": "Spendenbetrag und Datum",
    "privacy.donor_data.payment": "Zahlungsart (z. B. PayPal, Überweisung)",
    "privacy.donor_data.usage": "Diese Daten werden ausschließlich zur Spendenverwaltung, Buchhaltung und Ausstellung von Zuwendungsbestätigungen verwendet.",
    "privacy.donor_data.legal_basis": "Rechtsgrundlage:",
    "privacy.donor_data.legal_basis_1": "Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung – Abwicklung der Spende)",
    "privacy.donor_data.legal_basis_2": "Art. 6 Abs. 1 lit. c DSGVO (Erfüllung steuerlicher Aufbewahrungspflichten)",
    "privacy.storage.title": "Speicherung und Verwaltung der Daten",
    "privacy.storage.description": "Zur Verwaltung unserer Spenderdaten und Dokumente nutzen wir folgende cloudbasierte Tools:",
    "privacy.storage.notion.title": "Notion (Notion Labs Inc., USA)",
    "privacy.storage.notion.description": "Wir speichern und verwalten Kontaktdaten unserer Spender in Notion.",
    "privacy.storage.notion.legal": "Notion verarbeitet Daten in unserem Auftrag auf Grundlage eines Auftragsverarbeitungsvertrags (Data Processing Addendum) mit Standardvertragsklauseln nach Art. 46 DSGVO.",
    "privacy.storage.notion.more_info": "Weitere Informationen:",
    "privacy.storage.notion.link_text": "https://www.notion.so/Privacy-Policy",
    "privacy.storage.google.title": "Google Drive (Google Ireland Ltd.)",
    "privacy.storage.google.description": "Spendenbelege und Zuwendungsbestätigungen werden in unserem Google-Drive-Konto gespeichert.",
    "privacy.storage.google.legal": "Die Datenverarbeitung erfolgt innerhalb der EU bzw. auf Basis der Standardvertragsklauseln für Datenübermittlungen in Drittländer.",
    "privacy.storage.google.more_info": "Weitere Informationen:",
    "privacy.storage.google.link_text": "https://policies.google.com/privacy",
    "privacy.storage.access": "Wir achten darauf, dass nur autorisierte Vereinsmitglieder Zugriff auf diese Daten haben.",
    "privacy.duration.title": "Speicherdauer",
    "privacy.duration.description": "Wir speichern personenbezogene Daten nur so lange, wie dies für die Erfüllung unserer satzungsmäßigen Zwecke, steuerrechtliche Aufbewahrungsfristen (i. d. R. 10 Jahre) oder rechtliche Nachweispflichten erforderlich ist. Danach werden die Daten gelöscht oder anonymisiert.",
    "privacy.rights.title": "Ihre Rechte",
    "privacy.rights.description": "Sie haben das Recht:",
    "privacy.rights.access": "auf Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)",
    "privacy.rights.correction": "auf Berichtigung (Art. 16 DSGVO)",
    "privacy.rights.deletion": "auf Löschung (Art. 17 DSGVO)",
    "privacy.rights.restriction": "auf Einschränkung der Verarbeitung (Art. 18 DSGVO)",
    "privacy.rights.portability": "auf Datenübertragbarkeit (Art. 20 DSGVO)",
    "privacy.rights.objection": "auf Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)",
    "privacy.rights.withdrawal": "Sie können erteilte Einwilligungen jederzeit mit Wirkung für die Zukunft widerrufen.",
    "privacy.complaint.title": "Beschwerderecht",
    "privacy.complaint.description": "Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren, z. B. bei:",
    "privacy.complaint.authority": "Landesbeauftragter für Datenschutz und Informationsfreiheit Bayern (Bayerisches Landesamt für Datenschutzaufsicht)",
    "privacy.complaint.address": "Ferchensee 8, 83562 Rechtmehring",
    "privacy.complaint.website": "https://www.datenschutz-bayern.de",
    "privacy.contact.title": "Ansprechpartner für Datenschutz",
    "privacy.contact.name": "Clara Thümecke",
    "privacy.contact.organization": "Alma Bridge of Hope e.V.",
    "privacy.contact.email": "E-Mail",
    "privacy.contact.email_value": "info@almabridgeofhope.org",
    "privacy.last_updated": "Stand: November 2025",
    
    // Donation Page
    "donation.hero.title": "Ihre Unterstützung bringt Hoffnung",
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
    "donation.form.error.payment": "Zahlung fehlgeschlagen. Bitte versuchen Sie es erneut.",
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
    "donation.quote.author": "– Aaron Hesser, Alma Bridge of Hope",
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
    
    // Donation Warning
    "donation.warning.title": "Testmodus",
    "donation.warning.message": "Dieses Spendensystem befindet sich derzeit im Testmodus und ist noch nicht vollständig eingerichtet. Es werden keine tatsächlichen Zahlungen verarbeitet. Dies dient nur zu Demonstrationszwecken.",
    "donation.warning.continue": "Ich verstehe, fortfahren",
    "donation.warning.cancel": "Abbrechen",
    
    // News Page
    "news.hero.title": "Nachrichten & Updates",
    "news.hero.subtitle": "Bleiben Sie über unsere neuesten Entwicklungen, Gemeindegeschichten und Projektfortschritte informiert.",
    "news.all_news.title": "Alle Nachrichten",
    "news.all_news.subtitle": "Regelmäßige Updates aus unserer Arbeit in Uganda und Deutschland",
    "news.date_format": "de-DE",
    "news.categories.project_update": "Projekt-Update",
    "news.categories.community": "Gemeinde",
    "news.categories.organization": "Organisation",
    "news.newsletter.title": "Bleiben Sie informiert",
    "news.newsletter.subtitle": "Erhalten Sie die neuesten Nachrichten und Updates direkt in Ihr Postfach",
    "news.newsletter.button": "Newsletter abonnieren",
    "news.back_to_news": "Zurück zu den Nachrichten",
    "news.article_not_found.title": "Artikel nicht gefunden",
    "news.article_not_found.subtitle": "Der gesuchte Artikel existiert nicht oder wurde entfernt.",
    "news.article1.title": "Community House Bau erreicht wichtigen Meilenstein im Dorf Namaliri",
    "news.article1.excerpt": "Signifikante Fortschritte wurden beim Community House Projekt erzielt, das Fundament ist nun fertig und die Wände beginnen Gestalt anzunehmen. Dieser zentrale Hub wird das Herzstück aller unserer Programme im ländlichen Uganda sein.",
    "news.article1.content": "Das Community House Projekt hat einen wichtigen Meilenstein erreicht mit der Fertigstellung des Fundaments und dem Beginn des Wandbaus. Dieser zentrale Hub wird das Herzstück aller unserer Programme im Dorf Namaliri sein und Raum für Bildung, Gemeindetreffen und nachhaltige Entwicklungsinitiativen bieten.",
    "news.article1.author": "Peter Ssenga",
    "news.article1.sections.progress": "Baufortschritt-Highlights:",
    "news.article1.sections.progress_points": "Fundament mit Stahlbetonstruktur fertiggestellt|Wandbau zu 40% abgeschlossen mit lokal bezogenen Materialien|Rahmen für Solarpanel-Installation vorbereitet|Wasseranschluss-Infrastruktur geplant und genehmigt",
    "news.article1.sections.community_impact": "Gemeindewirkung:",
    "news.article1.sections.community_points": "Über 150 Gemeindemitglieder beteiligen sich aktiv am Bau|Lokale Beschäftigungsmöglichkeiten für 25+ Einwohner geschaffen|Qualifizierungsprogramme laufen parallel zum Bau|Wöchentliche Gemeindetreffen zur Sicherstellung der Projektausrichtung an lokalen Bedürfnissen",
    "news.article1.sections.next_steps": "Nächste Schritte:",
    "news.article1.sections.next_steps_points": "Wandbau bis Ende Februar abschließen|Solarpanels für nachhaltige Energie installieren|Innenarbeiten an Klassenzimmern und Büroräumen beginnen|Vorbereitung der offiziellen Eröffnungszeremonie im März",
    "news.article1.sections.conclusion": "Dieses Community House steht für mehr als nur ein Gebäude—es ist ein Symbol der Hoffnung und Zusammenarbeit. Während der Bau voranschreitet, erleben wir die Kraft der gemeinschaftsgetriebenen Entwicklung und die starke Partnerschaft zwischen unseren deutschen und ugandischen Teams. Gemeinsam bauen wir nicht nur Infrastruktur, sondern nachhaltige Beziehungen, die die Entwicklung für Jahre unterstützen werden.",
    "news.article2.title": "Gemeindebeteiligungsprogramm übertrifft Erwartungen im Dorf Namaliri",
    "news.article2.excerpt": "Unsere Gemeindebeteiligungsinitiativen haben über 150 lokale Bewohner zusammengebracht, um an der Projektplanung und -umsetzung teilzunehmen und eine starke Grundlage für nachhaltige Entwicklung zu schaffen.",
    "news.article2.content": "Das Gemeindebeteiligungsprogramm hat die Erwartungen übertroffen, mit starker Teilnahme von lokalen Führungskräften und Familien bei der Gestaltung unserer Entwicklungsprojekte. Dieser kollaborative Ansatz stellt sicher, dass alle Initiativen wirklich den Bedürfnissen der Gemeinde dienen.",
    "news.article2.author": "Phionah Nagujja",
    "news.article2.sections": {
      "introduction": "Gemeindebeteiligung liegt im Herzen nachhaltiger Entwicklung. Im Dorf Namaliri haben wir eine unglaubliche Reaktion auf unseren partizipativen Ansatz erlebt, bei dem Gemeindemitglieder die Verantwortung für Entwicklungsinitiativen übernehmen.",
      "participation": "Gemeindebeteiligung-Highlights:",
      "participation_points": [
        "150+ Gemeindemitglieder aktiv in der Projektplanung beteiligt",
        "Wöchentliche Gemeindetreffen mit 80%+ Teilnahme",
        "Lokale Führungskräfte übernehmen Leitungsrollen in Projektausschüssen",
        "Jugendgruppen organisieren Gemeindesäuberungsinitiativen"
      ],
      "impact": "Messbare Wirkung:",
      "impact_points": [
        "95% der Gemeindemitglieder fühlen sich gehört und geschätzt",
        "Lokale Entscheidungsprozesse gestärkt",
        "Traditionelles Wissen mit modernen Entwicklungsansätzen integriert",
        "Frauenbeteiligung in Gemeindetreffen um 60% gestiegen"
      ],
      "success_factors": "Schlüsselfaktoren für den Erfolg:",
      "success_factors_points": [
        "Regelmäßige Kommunikation in lokalen Sprachen",
        "Flexible Treffenzeiten zur Anpassung an landwirtschaftliche Zeitpläne",
        "Anerkennung und Feier der Gemeindebeiträge",
        "Transparente Projektplanung und Budgetdiskussionen"
      ],
      "conclusion": "Dieses Maß an Gemeindebeteiligung zeigt die Kraft partizipativer Entwicklung und schafft eine starke Grundlage für alle zukünftigen Projekte im Dorf Namaliri."
    },
    "news.article3.title": "Neue Teammitglieder im deutschen Büro",
    "news.article3.excerpt": "Wir freuen uns, neue Freiwillige in unserem deutschen Team begrüßen zu können, was unsere Kapazitäten für Fundraising und Projektkoordination stärkt.",
    "news.article3.content": "Unser deutsches Team ist mit der Hinzufügung engagierter Freiwilliger gewachsen, die wertvolle Fähigkeiten im Projektmanagement und der Gemeindearbeit mitbringen.",
    "news.article3.author": "Clara Thümecke",
    "news.article3.sections.growth": "Teamwachstum-Highlights:",
    "news.article3.sections.growth_points": "Drei neue Freiwillige sind unserem deutschen Büro beigetreten|Verbesserte Fundraising-Fähigkeiten mit spezialisierten Fähigkeiten|Verbesserte Projektkoordination und -management|Erweiterte Gemeindearbeit und Partnerschaftsentwicklung",
    "news.article3.sections.impact": "Organisatorische Wirkung:",
    "news.article3.sections.impact_points": "Erhöhte Kapazität für strategische Planung und Entwicklung|Verbesserte Kommunikation zwischen deutschen und ugandischen Teams|Verbesserte Spenderbeziehungen und Fundraising-Bemühungen|Gestärkte Projektüberwachung und Evaluationsprozesse",
    "news.article3.sections.future": "Blick nach vorn:",
    "news.article3.sections.future_points": "Fortgesetzte Teamerweiterung für 2025 geplant|Verbesserte Schulungsprogramme für neue Freiwillige|Verbesserte Koordination mit lokalen Partnern in Uganda|Gestärkte internationale Zusammenarbeit und Wissensaustausch",
    "news.related_articles.title": "Verwandte Artikel",
    "news.read_more": "Weiterlesen",
    
    // 404 Page
    "404.title": "Seite nicht gefunden",
    "404.subtitle": "Die gesuchte Seite existiert nicht oder wurde verschoben.",
    "404.description": "Keine Sorge, das passiert den Besten. Lassen Sie uns Sie wieder auf den richtigen Weg bringen.",
    "404.button_home": "Zur Startseite",
    "404.button_projects": "Projekte ansehen",
    "404.button_contact": "Kontakt aufnehmen",
    "404.helpful_links": "Nachrichten",
    "404.suggestions": "Hier sind einige aktuelle Artikel, die Sie interessieren könnten:",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Constants for better maintainability
const LANGUAGE_STORAGE_KEY = "alma-language";
const DEFAULT_LANGUAGE: Language = "de";

// Helper function to safely get language from localStorage
const getStoredLanguage = (): Language => {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    // Force German as default for new users
    if (!stored) {
      return DEFAULT_LANGUAGE;
    }
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

// Helper function to clear language from localStorage (for testing)
const clearStoredLanguage = (): void => {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear language from localStorage:", error);
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
