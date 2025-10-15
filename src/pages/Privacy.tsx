import { useLanguage } from "@/contexts/LanguageContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Privacy = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="prose prose-lg max-w-none">
            <h1 className="text-4xl font-bold text-foreground mb-8">
              {t("privacy.title")}
            </h1>
            
            <div className="space-y-8">
              {/* Introduction */}
              <section>
                <p className="text-muted-foreground leading-relaxed">
                  {t("privacy.intro")}
                </p>
              </section>

              {/* Responsible Party */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  {t("privacy.responsible.title")}
                </h2>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>{t("privacy.responsible.name")}</strong></p>
                  <p>{t("privacy.responsible.address")}</p>
                  <p>{t("privacy.responsible.country")}</p>
                  <p><strong>{t("privacy.responsible.email")}:</strong> {t("privacy.responsible.email_value")}</p>
                  <p>{t("privacy.responsible.board")}</p>
                </div>
              </section>

              {/* Website Visit */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  {t("privacy.website.title")}
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>{t("privacy.website.description")}</p>
                  <p>{t("privacy.website.collected")}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>{t("privacy.website.ip")}</li>
                    <li>{t("privacy.website.datetime")}</li>
                    <li>{t("privacy.website.filename")}</li>
                    <li>{t("privacy.website.browser")}</li>
                    <li>{t("privacy.website.os")}</li>
                  </ul>
                  <p>{t("privacy.website.purpose")}</p>
                  <p><strong>{t("privacy.website.legal_basis")}</strong> {t("privacy.website.legal_basis_text")}</p>
                </div>
              </section>

              {/* PayPal Donations */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  {t("privacy.paypal.title")}
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>{t("privacy.paypal.description")}</p>
                  <p>{t("privacy.paypal.data_transfer")}</p>
                  <p><strong>{t("privacy.paypal.legal_basis")}</strong> {t("privacy.paypal.legal_basis_text")}</p>
                  <p>{t("privacy.paypal.more_info")} <a href="https://www.paypal.com/de/webapps/mpp/ua/privacy-full" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{t("privacy.paypal.link_text")}</a>.</p>
                </div>
              </section>

              {/* Donor Data Processing */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  {t("privacy.donor_data.title")}
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>{t("privacy.donor_data.description")}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>{t("privacy.donor_data.name")}</li>
                    <li>{t("privacy.donor_data.email")}</li>
                    <li>{t("privacy.donor_data.address")}</li>
                    <li>{t("privacy.donor_data.amount")}</li>
                    <li>{t("privacy.donor_data.payment")}</li>
                  </ul>
                  <p>{t("privacy.donor_data.usage")}</p>
                  <p><strong>{t("privacy.donor_data.legal_basis")}</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>{t("privacy.donor_data.legal_basis_1")}</li>
                    <li>{t("privacy.donor_data.legal_basis_2")}</li>
                  </ul>
                </div>
              </section>

              {/* Data Storage and Management */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  {t("privacy.storage.title")}
                </h2>
                <div className="space-y-6 text-muted-foreground">
                  <p>{t("privacy.storage.description")}</p>
                  
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      a) {t("privacy.storage.notion.title")}
                    </h3>
                    <p>{t("privacy.storage.notion.description")}</p>
                    <p>{t("privacy.storage.notion.legal")}</p>
                    <p>{t("privacy.storage.notion.more_info")} <a href="https://www.notion.so/Privacy-Policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{t("privacy.storage.notion.link_text")}</a></p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      b) {t("privacy.storage.google.title")}
                    </h3>
                    <p>{t("privacy.storage.google.description")}</p>
                    <p>{t("privacy.storage.google.legal")}</p>
                    <p>{t("privacy.storage.google.more_info")} <a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{t("privacy.storage.google.link_text")}</a></p>
                  </div>

                  <p>{t("privacy.storage.access")}</p>
                </div>
              </section>

              {/* Storage Duration */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  {t("privacy.duration.title")}
                </h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("privacy.duration.description")}</p>
                </div>
              </section>

              {/* Your Rights */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  {t("privacy.rights.title")}
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>{t("privacy.rights.description")}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>{t("privacy.rights.access")}</li>
                    <li>{t("privacy.rights.correction")}</li>
                    <li>{t("privacy.rights.deletion")}</li>
                    <li>{t("privacy.rights.restriction")}</li>
                    <li>{t("privacy.rights.portability")}</li>
                    <li>{t("privacy.rights.objection")}</li>
                  </ul>
                  <p>{t("privacy.rights.withdrawal")}</p>
                </div>
              </section>

              {/* Complaint Right */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  {t("privacy.complaint.title")}
                </h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("privacy.complaint.description")}</p>
                  <p>{t("privacy.complaint.authority")}</p>
                  <p>{t("privacy.complaint.address")}</p>
                  <p><a href="https://www.baden-wuerttemberg.datenschutz.de" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{t("privacy.complaint.website")}</a></p>
                </div>
              </section>

              {/* Data Protection Contact */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  {t("privacy.contact.title")}
                </h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("privacy.contact.name")}</p>
                  <p>{t("privacy.contact.organization")}</p>
                  <p><strong>{t("privacy.contact.email")}:</strong> {t("privacy.contact.email_value")}</p>
                </div>
              </section>

              {/* Last Updated */}
              <section>
                <p className="text-sm text-muted-foreground mt-8">
                  {t("privacy.last_updated")}
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Privacy;
