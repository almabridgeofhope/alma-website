import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PreloadImage from "@/components/PreloadImage";
import NewsletterForm from "@/components/NewsletterForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShoppingCart } from "@/contexts/ShoppingCartContext";
import { stripeService, StripeSessionDetails } from "@/services/stripeService";
import { paypalService, PayPalSubscriptionDetails } from "@/services/paypalService";
import { 
  CheckCircle, 
  Heart, 
  Mail, 
  Home, 
  CheckCircle2,
  Loader2,
  AlertCircle,
  Info,
  ExternalLink
} from "lucide-react";
import heroImage from "@/assets/nature/nature_2.webp";

const DonationSuccess = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { formatCurrency, clearCart } = useShoppingCart();
  const [showNewsletterForm, setShowNewsletterForm] = useState(false);
  
  // Get parameters from URL
  const sessionId = searchParams.get("session_id");
  const urlDonationType = searchParams.get("type");
  const estimatedAmount = searchParams.get("estimated_amount");
  
  // Legacy support: direct amount/paymentId (from old PayPal flow or fallback)
  const legacyAmount = searchParams.get("amount");
  const legacyPaymentId = searchParams.get("paymentId");
  
  // State for async session loading
  // Only set to true if we actually need to load details (Stripe session or PayPal monthly subscription)
  const [isLoadingSession, setIsLoadingSession] = useState(
    !!sessionId || (!!legacyPaymentId && urlDonationType === "monthly")
  );
  const [sessionDetails, setSessionDetails] = useState<StripeSessionDetails | null>(null);
  const [paypalSubscriptionDetails, setPaypalSubscriptionDetails] = useState<PayPalSubscriptionDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Determine donation type from session metadata, PayPal subscription, or URL parameter
  const donationType = sessionDetails?.metadata 
    ? (sessionDetails.metadata.donationType === "monthly" || 
       sessionDetails.metadata.donation_type === "monthly" || 
       sessionDetails.metadata.subscription_type === "monthly_donation")
      ? "monthly"
      : "one-time"
    : (paypalSubscriptionDetails ? "monthly" : (urlDonationType || "one-time"));
  
  // Final display values
  const displayAmount = sessionDetails 
    ? (sessionDetails.amount_total / 100) 
    : (legacyAmount ? parseFloat(legacyAmount) : (estimatedAmount ? parseFloat(estimatedAmount) : null));
  const displayPaymentId = sessionDetails?.id || legacyPaymentId || sessionId;
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Load session details asynchronously (OPTIMISTIC LOADING)
  const loadSessionDetails = useCallback(async () => {
    if (!sessionId) return;
    
    console.log("🔄 Loading Stripe session details asynchronously...");
    setIsLoadingSession(true);
    setLoadError(null);
    
    try {
      const details = await stripeService.getSessionDetails(sessionId);
      console.log("✅ Session details loaded:", details);
      setSessionDetails(details);

      // Check if this is a SEPA payment
      // SEPA payments can be detected from metadata or payment_method_types
      const isSEPAPayment = details.metadata?.paymentMethodType === 'sepa_debit' ||
                           details.payment_method_types?.includes('sepa_debit') ||
                           details.payment_method_types?.some(pmt => pmt.includes('sepa'));
      
      console.log("Payment method types:", details.payment_method_types);
      console.log("Is SEPA payment:", isSEPAPayment);
      console.log("Payment status:", details.payment_status);
      
      // Always log the payment, regardless of status
      // For SEPA payments, status can be "unpaid" initially because the bank needs to process it
      // This can take several days. We still log the donation immediately with status "unpaid".
      // For card payments, status should be "paid" immediately.
      if (details.payment_status !== 'paid') {
        if (isSEPAPayment) {
          console.log("ℹ️ SEPA payment detected with 'unpaid' status - this is normal. Payment will be processed by the bank in a few days.");
          // Don't set error - SEPA payments are valid even when unpaid
        } else {
          console.warn("⚠️ Payment status is not 'paid':", details.payment_status);
          // Still log it, but show a warning to the user
          setLoadError(language === "de" 
            ? "Zahlung wurde noch nicht abgeschlossen. Die Spende wird trotzdem protokolliert." 
            : "Payment not yet completed. The donation will still be logged.");
        }
      }
      
      // The donation itself is booked by the Stripe webhook in Supabase;
      // the page only has to empty the cart once the session is confirmed.
      clearCart();
      
    } catch (error) {
      console.error("❌ Failed to load session details:", error);
      setLoadError(language === "de" 
        ? "Details konnten nicht geladen werden. Die Zahlung war jedoch erfolgreich." 
        : "Could not load details. However, your payment was successful.");
      // Don't block the success page - payment was successful
    } finally {
      setIsLoadingSession(false);
    }
  }, [sessionId, language]);
  
  // Load PayPal subscription details if we have a PayPal payment ID and it's a monthly donation
  const loadPayPalSubscriptionDetails = useCallback(async () => {
    if (!legacyPaymentId || urlDonationType !== "monthly") return;
    
    // PayPal Subscription IDs start with "I-" (e.g., "I-BW452GLLEP1G")
    // If the ID doesn't match this format, it's likely an Order ID, not a Subscription ID
    const isSubscriptionIdFormat = legacyPaymentId.startsWith("I-");
    
    if (!isSubscriptionIdFormat) {
      console.log("ℹ️ PayPal Payment ID doesn't match Subscription ID format (should start with 'I-'). Using type parameter instead.");
      console.log("Payment ID:", legacyPaymentId, "- This appears to be an Order ID, not a Subscription ID.");
      // Don't try to load subscription details - just trust the type parameter
      setIsLoadingSession(false);
      return;
    }
    
    console.log("🔄 Loading PayPal subscription details...");
    setIsLoadingSession(true);
    setLoadError(null);
    
    try {
      const result = await paypalService.getSubscriptionDetails(legacyPaymentId);
      
      if (result.ok && result.subscription) {
        console.log("✅ PayPal subscription details loaded:", result.subscription);
        setPaypalSubscriptionDetails(result.subscription);
      } else {
        console.warn("⚠️ Could not load PayPal subscription details:", result.error || result.message);
        // Don't set error - payment was successful, we just can't verify subscription status
      }
    } catch (error) {
      console.error("❌ Failed to load PayPal subscription details:", error);
      // Don't block the success page - payment was successful
    } finally {
      setIsLoadingSession(false);
    }
  }, [legacyPaymentId, urlDonationType]);

  // Load session details on mount
  useEffect(() => {
    if (sessionId) {
      loadSessionDetails();
    } else if (legacyPaymentId && urlDonationType === "monthly") {
      // Try to load PayPal subscription details for monthly donations
      loadPayPalSubscriptionDetails();
    } else if (legacyPaymentId && !sessionId) {
      // For one-time PayPal payments, we don't need to load additional details
      // We already have legacyAmount and legacyPaymentId from URL params
      console.log("ℹ️ One-time PayPal payment detected. Using URL parameters (no additional loading needed).");
      setIsLoadingSession(false);
    }
  }, [sessionId, legacyPaymentId, urlDonationType, loadSessionDetails, loadPayPalSubscriptionDetails]);

  // Redirect if no valid parameters (invalid access)
  useEffect(() => {
    const hasValidParams = sessionId || legacyAmount || legacyPaymentId || estimatedAmount;
    console.log("🔍 DonationSuccess params check:", {
      sessionId,
      legacyAmount,
      legacyPaymentId,
      estimatedAmount,
      hasValidParams
    });
    if (!hasValidParams) {
      console.warn("⚠️ No valid donation parameters, redirecting to donation page in 3 seconds...");
      const timer = setTimeout(() => {
        console.log("⏰ Redirect timer fired, navigating to /donation");
        navigate("/donation");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [sessionId, legacyAmount, legacyPaymentId, estimatedAmount, navigate]);

  const formatAmount = (amt: number | null) => {
    if (amt === null || amt === undefined) return "";
    if (isNaN(amt)) return "";
    return new Intl.NumberFormat(language === "de" ? "de-DE" : "en-US", {
      style: "currency",
      currency: "EUR",
    }).format(amt);
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
              {donationType === "monthly" 
                ? t("donation.success.title.monthly")
                : t("donation.success.title")}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-8">
              {donationType === "monthly"
                ? t("donation.success.subtitle.monthly")
                : t("donation.success.subtitle")}
            </p>
            {displayAmount !== null && (
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <Heart className="h-5 w-5 text-red-400" />
                {isLoadingSession && !sessionDetails ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-2xl font-bold">{formatAmount(displayAmount)}</span>
                    <span className="text-sm opacity-75">({t("donation.success.loading")})</span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold">{formatAmount(displayAmount)}</span>
                )}
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
                  {/* Amount */}
                  {displayAmount !== null && (
                    <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">{t("donation.success.confirmation.amount")}</span>
                      {isLoadingSession && !sessionDetails ? (
                        <Skeleton className="h-7 w-24" />
                      ) : (
                        <span className="text-xl font-bold text-primary">{formatAmount(displayAmount)}</span>
                      )}
                    </div>
                  )}
                  
                  {/* Donation Type */}
                  {donationType && (
                    <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">{t("donation.success.confirmation.type")}</span>
                      <span className="font-semibold">
                        {donationType === "monthly" ? t("donation.form.monthly") : t("donation.form.onetime")}
                      </span>
                    </div>
                  )}
                  
                  {/* Transaction ID */}
                  {displayPaymentId && (
                    <div className="flex flex-col gap-2 p-4 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">{t("donation.success.confirmation.transactionId")}</span>
                      {isLoadingSession && !sessionDetails ? (
                        <Skeleton className="h-4 w-full" />
                      ) : (
                        <span className="font-mono text-xs break-all">{displayPaymentId}</span>
                      )}
                    </div>
                  )}
                  
                  {/* Customer Email (if available from session) */}
                  {sessionDetails?.customer_details?.email && (
                    <div className="flex flex-col gap-2 p-4 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">{t("donation.success.confirmation.email_address") || "Email"}</span>
                      <span className="text-sm">{sessionDetails.customer_details.email}</span>
                    </div>
                  )}
                </div>
                
                {/* Loading Error (non-critical) */}
                {loadError && (
                  <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-yellow-900 dark:text-yellow-100 font-medium">
                        {loadError}
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        {t("donation.success.confirmation.email")}
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    {t("donation.success.confirmation.email")}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Cancellation Info for Monthly Donations */}
        {donationType === "monthly" && (
          <section className="py-12 bg-muted/30">
            <div className="max-w-content mx-auto px-6">
              <div className="max-w-2xl mx-auto">
                <Card className="p-8 shadow-card">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
                      <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                        {t("donation.success.cancellation.title")}
                      </h2>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-background rounded-lg border border-border">
                          <div className="flex items-start gap-3">
                            <ExternalLink className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground mb-2">
                                {t("donation.success.cancellation.stripe")}
                              </h3>
                              <p className="text-sm text-muted-foreground whitespace-pre-line">
                                {t("donation.success.cancellation.stripeDesc").replace("{email}", t("donation.contact.email"))}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-background rounded-lg border border-border">
                          <div className="flex items-start gap-3">
                            <ExternalLink className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground mb-2">
                                {t("donation.success.cancellation.paypal")}
                              </h3>
                              <p className="text-sm text-muted-foreground whitespace-pre-line">
                                {t("donation.success.cancellation.paypalDesc")}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-900 dark:text-blue-100">
                            {t("donation.success.cancellation.help").replace("{email}", t("donation.contact.email"))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </section>
        )}

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
