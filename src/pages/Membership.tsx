import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PreloadImage from "@/components/PreloadImage";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { stripeService } from "@/services/stripeService";
import { donationWebhookService } from "@/services/donationWebhookService";
import heroImage from "@/assets/community/community_2.webp";
import { CheckCircle, Heart, Shield } from "lucide-react";

const presetAmounts = [10, 15, 25, 50];

const Membership = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [amount, setAmount] = useState<string>("15");
  const [paymentMethod, setPaymentMethod] = useState<"sepa" | "card" | "paypal">("sepa");
  const [requestWaiver, setRequestWaiver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    postalCode: "",
    city: "",
    country: language === "de" ? "Deutschland" : "Germany",
    comment: "",
    privacyAccepted: false,
  });
  const navigate = useNavigate();

  // Normalize language-specific defaults on change
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      country: prev.country || (language === "de" ? "Deutschland" : "Germany"),
    }));
  }, [language]);

  // Inform user about cancelled checkout
  useEffect(() => {
    if (searchParams.get("checkout") === "cancelled") {
      toast({
        title: t("membership.status.cancelled"),
        variant: "destructive",
      });
      const cleaned = new URLSearchParams(searchParams);
      cleaned.delete("checkout");
      setSearchParams(cleaned, { replace: true });
    }
  }, [searchParams, setSearchParams, toast, t]);

  const selectedAmount = useMemo(() => {
    const value = parseFloat(amount.replace(",", "."));
    return isNaN(value) ? 0 : value;
  }, [amount]);

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validate = () => {
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim()
    ) {
      return t("membership.validation.required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return t("membership.validation.email");
    }

    if (selectedAmount <= 0) {
      return t("membership.validation.amount");
    }

    if (!requestWaiver && selectedAmount < 10) {
      return t("membership.validation.minimum");
    }

    if (requestWaiver && !formData.comment.trim()) {
      return t("membership.validation.comment");
    }

    if (!formData.privacyAccepted) {
      return t("membership.validation.privacy");
    }

    return null;
  };

  const startCheckout = async () => {
    const baseUrl = window.location.origin;
    const paymentMethodTypes =
      paymentMethod === "sepa" ? ["sepa_debit"] : ["card"];

    if (paymentMethod === "paypal") {
      // Reuse donation flow for PayPal subscriptions
      const params = new URLSearchParams({
        amount: selectedAmount.toString(),
        type: "monthly",
        source: "membership",
        flow: "membership",
      });
      window.location.href = `${baseUrl}/donation?${params.toString()}`;
      return;
    }

    const metadata: Record<string, string> = {
      donationType: "monthly",
      subscription_type: "membership",
      membership: "true",
      membership_waiver: requestWaiver ? "true" : "false",
      membership_comment: formData.comment || "",
      donor_first_name: formData.firstName,
      donor_last_name: formData.lastName,
      donor_phone: formData.phone || "",
      comment: "new-membership",
      paymentMethodType: paymentMethod === "sepa" ? "sepa_debit" : "card",
    };

    const { url } = await stripeService.createCheckoutSession({
      amount: selectedAmount,
      currency: "eur",
      paymentMethodTypes: paymentMethodTypes as ("card" | "sepa_debit")[],
      metadata,
      customerEmail: formData.email,
      customerName: `${formData.firstName} ${formData.lastName}`,
      isSubscription: true,
      successUrl: `${baseUrl}/membership/success?session_id={CHECKOUT_SESSION_ID}&flow=membership&source=membership`,
      cancelUrl: `${baseUrl}/membership?checkout=cancelled`,
    });

    window.location.href = url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      toast({
        title: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    toast({
      title: t("membership.status.redirect"),
    });

    try {
      await startCheckout();
    } catch (err) {
      console.error("Membership checkout failed:", err);
      const message =
        err instanceof Error ? err.message : t("membership.status.error");
      setError(message);
      toast({
        title: t("membership.status.error"),
        description: message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-16">
        <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
          <PreloadImage src={heroImage} />
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

          <div className="relative z-10 text-left text-white max-w-4xl px-6 py-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {t("membership.hero.title")}
            </h1>
          </div>
        </section>

        <section className="py-section bg-background">
          <div className="max-w-content mx-auto px-6 grid lg:grid-cols-5 gap-10">
            <div className="space-y-6 lg:col-span-2">
                <Card className="p-6 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-foreground">
                    {t("membership.info.title")}
                  </h2>
                </div>
                <ul className="space-y-4 text-muted-foreground">
                  <li className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <span>{t("membership.info.point1")}</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <span>{t("membership.info.point2")}</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <span>{t("membership.info.point3")}</span>
                  </li>
                </ul>
              </Card>
            </div>

            <Card className="p-8 shadow-card lg:col-span-3">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {t("membership.form.title")}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t("membership.form.description")}
              </p>

              {error && (
                <div className="mb-4 p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive">
                  {error}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">
                      {t("membership.form.firstName")}
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">
                      {t("membership.form.lastName")}
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      required
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">{t("membership.form.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">{t("membership.form.phone")}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="street">{t("membership.form.street")}</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => handleInputChange("street", e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">
                      {t("membership.form.postalCode")}
                    </Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) =>
                        handleInputChange("postalCode", e.target.value)
                      }
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">{t("membership.form.city")}</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">{t("membership.form.country")}</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                {!requestWaiver && (
                  <div>
                    <Label>{t("membership.form.amount")}</Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                      {presetAmounts.map((preset) => (
                        <Button
                          key={preset}
                          type="button"
                          variant={selectedAmount === preset ? "default" : "outline"}
                          onClick={() => setAmount(preset.toString())}
                        >
                          €{preset}
                        </Button>
                      ))}
                    </div>
                    <Input
                      type="number"
                      min={1}
                      step="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="mt-3"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("membership.form.amount.help")}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="waiver"
                      checked={requestWaiver}
                      onCheckedChange={(checked) =>
                        setRequestWaiver(checked === true)
                      }
                    />
                    <Label htmlFor="waiver" className="leading-snug">
                      {t("membership.form.waiver.label")}
                    </Label>
                  </div>

                  {requestWaiver && (
                    <div>
                      <Label htmlFor="comment">
                        {t("membership.form.comment")}
                      </Label>
                      <Textarea
                        id="comment"
                        value={formData.comment}
                        onChange={(e) => handleInputChange("comment", e.target.value)}
                        className="mt-2"
                        placeholder={t("membership.form.commentPlaceholder")}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {t("membership.form.payment")}
                  </h3>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value: "sepa" | "card" | "paypal") =>
                      setPaymentMethod(value)
                    }
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
                  >
                    <Label
                      htmlFor="sepa"
                      className={`border rounded-lg p-4 cursor-pointer hover-border-primary/50 hover:border-primary/50 ${
                        paymentMethod === "sepa" ? "border-primary" : "border-border"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="sepa" id="sepa" className="mt-1" />
                        <div>
                          <div className="font-medium leading-snug break-words hyphens-auto">
                            {t("membership.form.payment.sepa")}
                          </div>
                        </div>
                      </div>
                    </Label>

                    <Label
                      htmlFor="card"
                      className={`border rounded-lg p-4 cursor-pointer hover-border-primary/50 hover:border-primary/50 ${
                        paymentMethod === "card" ? "border-primary" : "border-border"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="card" id="card" className="mt-1" />
                        <div>
                          <div className="font-medium leading-snug break-words hyphens-auto">
                            {t("membership.form.payment.card")}
                          </div>
                        </div>
                      </div>
                    </Label>

                    <Label
                      htmlFor="paypal"
                      className={`border rounded-lg p-4 cursor-pointer hover-border-primary/50 hover:border-primary/50 ${
                        paymentMethod === "paypal" ? "border-primary" : "border-border"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="paypal" id="paypal" className="mt-1" />
                        <div>
                          <div className="font-medium leading-snug break-words hyphens-auto">
                            {t("membership.form.payment.paypal")}
                          </div>
                        </div>
                      </div>
                    </Label>
                  </RadioGroup>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="privacy"
                    checked={formData.privacyAccepted}
                    onCheckedChange={(checked) =>
                      handleInputChange("privacyAccepted", checked === true)
                    }
                  />
                  <Label htmlFor="privacy" className="leading-snug">
                    {t("membership.form.privacy")}{" "}
                    <a
                      href="/privacy"
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t("footer.legal.privacy")}
                    </a>
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t("membership.status.redirect") : t("membership.form.submit")}
                </Button>
              </form>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Membership;

