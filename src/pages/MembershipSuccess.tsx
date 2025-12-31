import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { stripeService, StripeSessionDetails } from "@/services/stripeService";
import { donationWebhookService } from "@/services/donationWebhookService";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Instagram,
  Loader2,
  Mail,
  MessageCircle,
  Sparkles,
} from "lucide-react";

const contactEmail = "info@almabridgeofhope.org";

const MembershipSuccess = () => {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const urlAmount = searchParams.get("amount");
  const urlType = searchParams.get("type");

  const [sessionDetails, setSessionDetails] = useState<StripeSessionDetails | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(!!sessionId);
  const [loadError, setLoadError] = useState<string | null>(null);
  const webhookProcessedRef = useRef<Set<string>>(new Set());
  const [webhookStatus, setWebhookStatus] = useState<"idle" | "pending" | "done" | "failed">("idle");

  const numericUrlAmount = urlAmount ? parseFloat(urlAmount) : null;

  const displayAmount = useMemo(() => {
    if (sessionDetails) {
      return sessionDetails.amount_total / 100;
    }
    if (!isNaN(Number(numericUrlAmount))) {
      return numericUrlAmount || null;
    }
    return null;
  }, [sessionDetails, numericUrlAmount]);

  const formattedAmount = useMemo(() => {
    if (displayAmount == null) return null;
    return new Intl.NumberFormat(language === "de" ? "de-DE" : "en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(displayAmount);
  }, [displayAmount, language]);

  const paymentMethodLabel = useMemo(() => {
    if (!sessionDetails) return null;
    const methodFromMeta = sessionDetails.metadata?.paymentMethodType;
    const methodFromSession = sessionDetails.payment_method_types?.[0];
    const method = methodFromMeta || methodFromSession || "";
    const isSepa = method.includes("sepa");
    if (isSepa) {
      return language === "de" ? "SEPA-Lastschrift" : "SEPA direct debit";
    }
    return language === "de" ? "Kartenzahlung" : "Card payment";
  }, [sessionDetails, language]);

  const donorEmail = useMemo(() => {
    if (sessionDetails?.customer_details?.email) return sessionDetails.customer_details.email;
    if (sessionDetails?.customer_email) return sessionDetails.customer_email;
    return null;
  }, [sessionDetails]);

  const sendWebhook = useCallback(
    async (details: StripeSessionDetails) => {
      if (webhookProcessedRef.current.has(details.id)) return;

      webhookProcessedRef.current.add(details.id);
      setWebhookStatus("pending");

      try {
        const isSepaPayment =
          details.metadata?.paymentMethodType === "sepa_debit" ||
          details.payment_method_types?.includes("sepa_debit") ||
          details.payment_method_types?.some((type) => type.includes("sepa"));

        const finalAmount = details.amount_total / 100;
        const customerEmail = details.customer_details?.email || details.customer_email || "";
        const customerName = details.customer_details?.name || "";
        const customerAddress = details.customer_details?.address;

        const donationData = {
          items: [
            {
              type: "general-donation" as const,
              name: language === "de" ? "Mitgliedschaft" : "Membership",
              unitPrice: finalAmount,
              quantity: 1,
              totalPrice: finalAmount,
            },
          ],
          totalAmount: finalAmount,
          donationType: "new-membership" as const,
          paymentMethod: isSepaPayment ? ("stripe-sepa" as const) : ("stripe-card" as const),
          donorEmail: customerEmail || undefined,
          donorName: customerName || undefined,
          timestamp: new Date().toISOString(),
          paymentId: details.id,
          paymentStatus: details.payment_status as "paid" | "unpaid" | "pending" | "failed",
          wantsReceipt: details.metadata?.wantsReceipt === "true",
          address: customerAddress
            ? {
                street: customerAddress.line1 || undefined,
                postalCode: customerAddress.postal_code || undefined,
                city: customerAddress.city || undefined,
                country: customerAddress.country || undefined,
              }
            : undefined,
          wantsNewsletter: details.metadata?.wantsNewsletter === "true",
          comment: details.metadata?.membership_comment || details.metadata?.comment,
        };

        const response = await donationWebhookService.sendDonation(donationData);
        setWebhookStatus(response.ok ? "done" : "failed");
      } catch (error) {
        console.error("Membership webhook failed:", error);
        setWebhookStatus("failed");
        webhookProcessedRef.current.delete(details.id);
      }
    },
    [language]
  );

  const loadSessionDetails = useCallback(async () => {
    if (!sessionId) return;
    setIsLoadingSession(true);
    setLoadError(null);

    try {
      const details = await stripeService.getSessionDetails(sessionId);
      setSessionDetails(details);
      await sendWebhook(details);
    } catch (error) {
      console.error("Failed to load membership session details:", error);
      setLoadError(
        language === "de"
          ? "Zahlung bestätigt, aber Details konnten nicht geladen werden."
          : "Payment confirmed, but we could not load the details."
      );
    } finally {
      setIsLoadingSession(false);
    }
  }, [sessionId, language, sendWebhook]);

  useEffect(() => {
    if (sessionId) {
      loadSessionDetails();
    } else {
      setIsLoadingSession(false);
    }
  }, [sessionId, loadSessionDetails]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-16">
        <section className="bg-gradient-to-b from-primary/5 via-background to-background py-12 md:py-16">
          <div className="max-w-content mx-auto px-6 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-8 shadow-card border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {t("membership.success.confirmed")}
                    </p>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                      {t("membership.success.title")}
                    </h1>
                    <p className="text-muted-foreground">{t("membership.success.subtitle")}</p>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <Card className="p-4 border border-primary/15 bg-white/60 backdrop-blur">
                    <p className="text-sm text-muted-foreground">{t("membership.success.payment.amount")}</p>
                    <p className="text-2xl font-semibold text-foreground mt-1">
                      {formattedAmount || t("membership.success.pending")}
                    </p>
                    {urlType === "monthly" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === "de" ? "monatlich" : "monthly"}
                      </p>
                    )}
                  </Card>
                  <Card className="p-4 border border-primary/15 bg-white/60 backdrop-blur">
                    <p className="text-sm text-muted-foreground">{t("membership.success.payment.method")}</p>
                    <p className="text-lg font-semibold text-foreground mt-1">
                      {paymentMethodLabel || t("membership.success.payment.methodFallback")}
                    </p>
                  </Card>
                  <Card className="p-4 border border-primary/15 bg-white/60 backdrop-blur">
                    <p className="text-sm text-muted-foreground">{t("membership.success.payment.email")}</p>
                    <p className="text-lg font-semibold text-foreground mt-1">
                      {donorEmail || t("membership.success.payment.emailFallback")}
                    </p>
                  </Card>
                </div>

                {(isLoadingSession || webhookStatus === "pending") && (
                  <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("membership.success.loading")}
                  </div>
                )}
                {loadError && (
                  <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {loadError}
                  </div>
                )}

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <a href="https://instagram.com/almabridgeofhope" target="_blank" rel="noreferrer">
                      <Instagram className="w-5 h-5 mr-2" />
                      {t("membership.success.actions.follow")}
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <a href={`mailto:${contactEmail}`}>
                      <Mail className="w-5 h-5 mr-2" />
                      {t("membership.success.actions.contact")}
                    </a>
                  </Button>
                  <Button asChild variant="ghost" size="lg">
                    <Link to="/projects">
                      {t("membership.success.actions.projects")}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </Card>

              <Card className="p-6 shadow-card border-border/60">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-foreground">
                      {t("membership.success.nextSteps.title")}
                    </h2>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <span>{t("membership.success.nextSteps.point1")}</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <span>{t("membership.success.nextSteps.point2")}</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <span>{t("membership.success.nextSteps.point3")}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-6 shadow-card border-primary/20 bg-white">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm uppercase tracking-[0.14em] text-muted-foreground">
                      {t("membership.success.support.label")}
                    </p>
                    <h3 className="text-lg font-semibold text-foreground">
                      {t("membership.success.support.title")}
                    </h3>
                    <p className="text-muted-foreground text-sm">{t("membership.success.support.subtitle")}</p>
                  </div>
                </div>
                <Button asChild className="mt-4 w-full">
                  <Link to="/projects">
                    {t("membership.success.support.cta")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </Card>

              <Card className="p-6 shadow-card border-border/70 bg-gradient-to-br from-secondary/10 to-background">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary/20 text-secondary-foreground flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
                      {t("membership.success.contact.label")}
                    </p>
                    <h3 className="text-lg font-semibold text-foreground">
                      {t("membership.success.contact.title")}
                    </h3>
                    <p className="text-muted-foreground text-sm">{t("membership.success.contact.subtitle")}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button asChild variant="default" className="flex-1 min-w-[160px]">
                    <a href={`mailto:${contactEmail}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      {t("membership.success.contact.mail")}
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="flex-1 min-w-[160px]">
                    <a href="https://instagram.com/almabridgeofhope" target="_blank" rel="noreferrer">
                      <Instagram className="w-4 h-4 mr-2" />
                      {t("membership.success.contact.social")}
                    </a>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MembershipSuccess;


