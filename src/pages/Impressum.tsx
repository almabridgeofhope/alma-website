import { useLanguage } from "@/contexts/LanguageContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Impressum = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="prose prose-lg max-w-none">
            <h1 className="text-4xl font-bold text-foreground mb-8">
              {t("impressum.title")}
            </h1>
            
            <div className="space-y-8">
              {/* Organization Information */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  {t("impressum.organization.title")}
                </h2>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>{t("impressum.organization.name")}</strong></p>
                  <p>{t("impressum.organization.address")}</p>
                  <p>{t("impressum.organization.country")}</p>
                </div>
              </section>

              {/* Board Members */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  {t("impressum.board.title")}
                </h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("impressum.board.chairman")}</p>
                  <p>{t("impressum.board.vice_chairman")}</p>
                </div>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  {t("impressum.contact.title")}
                </h2>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>{t("impressum.contact.email")}:</strong> {t("impressum.contact.email_value")}</p>
                  <p><strong>{t("impressum.contact.website")}:</strong> {t("impressum.contact.website_value")}</p>
                </div>
              </section>

              {/* Registration */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  {t("impressum.registration.title")}
                </h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("impressum.registration.entry")}</p>
                  <p><strong>{t("impressum.registration.court")}:</strong> {t("impressum.registration.court_value")}</p>
                  <p><strong>{t("impressum.registration.number")}:</strong> {t("impressum.registration.number_value")}</p>
                </div>
              </section>

              {/* Tax Status */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  {t("impressum.tax.title")}
                </h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("impressum.tax.status")}</p>
                </div>
              </section>

              {/* Content Responsibility */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  {t("impressum.responsibility.title")}
                </h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("impressum.responsibility.person")}</p>
                </div>
              </section>

              {/* Disclaimer */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  {t("impressum.disclaimer.title")}
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>{t("impressum.disclaimer.content")}</p>
                  <p>{t("impressum.disclaimer.links")}</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Impressum;
