import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PreloadImage from "@/components/PreloadImage";
import NewsletterForm from "@/components/NewsletterForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  CheckCircle, 
  Heart, 
  Mail, 
  Home, 
  CheckCircle2
} from "lucide-react";
import heroImage from "@/assets/nature/nature_2.jpg";

const DonationSuccess = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showNewsletterForm, setShowNewsletterForm] = useState(false);
  
  // Get donation details from URL params
  const amount = searchParams.get("amount");
  const paymentId = searchParams.get("paymentId");
  const donationType = searchParams.get("type") || "one-time";
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Redirect if no amount (invalid access)
  useEffect(() => {
    if (!amount && !paymentId) {
      // If no donation info, redirect to donation page after a short delay
      const timer = setTimeout(() => {
        navigate("/donation");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [amount, paymentId, navigate]);

  const formatAmount = (amt: string | null) => {
    if (!amt) return "";
    const num = parseFloat(amt);
    if (isNaN(num)) return amt;
    return new Intl.NumberFormat(language === "de" ? "de-DE" : "en-US", {
      style: "currency",
      currency: "EUR",
    }).format(num);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section with Success Message */}
        <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
          <PreloadImage src={heroImage} />
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-hero" />
          
          <div className="relative z-10 text-center text-white max-w-4xl px-6 py-16">
            <div className="flex justify-center mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 backdrop-blur-sm border-4 border-green-400">
                <CheckCircle className="h-12 w-12 text-green-400" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t("donation.success.title")}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-8">
              {t("donation.success.subtitle")}
            </p>
            {amount && (
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <Heart className="h-5 w-5 text-red-400" />
                <span className="text-2xl font-bold">{formatAmount(amount)}</span>
              </div>
            )}
          </div>
        </section>

        {/* Confirmation Details */}
        <section className="py-12 bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="max-w-2xl mx-auto">
              <Card className="p-8 shadow-card">
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
                      <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    {t("donation.success.confirmation.title")}
                  </h2>
                  <p className="text-muted-foreground">
                    {t("donation.success.confirmation.message")}
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {amount && (
                    <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">{t("donation.success.confirmation.amount")}</span>
                      <span className="text-xl font-bold text-primary">{formatAmount(amount)}</span>
                    </div>
                  )}
                  {donationType && (
                    <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">{t("donation.success.confirmation.type")}</span>
                      <span className="font-semibold">
                        {donationType === "monthly" ? t("donation.form.monthly") : t("donation.form.onetime")}
                      </span>
                    </div>
                  )}
                  {paymentId && (
                    <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">{t("donation.success.confirmation.transactionId")}</span>
                      <span className="font-mono text-sm">{paymentId}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    {t("donation.success.confirmation.email")}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <section className="py-12 bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {t("donation.success.nextSteps.title")}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {t("donation.success.nextSteps.subtitle")}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card className="p-6 shadow-card">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {t("donation.success.nextSteps.newsletter.title")}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {t("donation.success.nextSteps.newsletter.desc")}
                      </p>
                      {!showNewsletterForm ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowNewsletterForm(true)}
                        >
                          {t("donation.success.nextSteps.newsletter.button")}
                        </Button>
                      ) : (
                        <div className="max-w-sm">
                          <NewsletterForm
                            placeholder={t("newsletter.placeholder")}
                            buttonLabel={t("newsletter.button")}
                            source="donation-success"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="p-6 shadow-card">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                      <Heart className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {t("donation.success.nextSteps.projects.title")}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {t("donation.success.nextSteps.projects.desc")}
                      </p>
                      <Button asChild variant="outline" size="sm">
                        <Link 
                          to="/projects"
                          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                          {t("donation.success.nextSteps.projects.button")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="outline">
                  <Link 
                    to="/donation"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    {t("donation.success.nextSteps.donateAgain")}
                  </Link>
                </Button>
                <Button asChild size="lg">
                  <Link 
                    to="/"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    <Home className="h-5 w-5 mr-2" />
                    {t("donation.success.nextSteps.home")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default DonationSuccess;

