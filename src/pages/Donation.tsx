import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Heart, Shield, CheckCircle, Mail, CreditCard, Banknote } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImage from "@/assets/nature/nature_2.jpg";
import communityImage from "@/assets/community/community_3.png";

const Donation = () => {
  const { t } = useLanguage();
  const [donationType, setDonationType] = useState<"one-time" | "monthly">("one-time");
  const [amount, setAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "sepa" | "card">("paypal");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    postalCode: "",
    city: "",
    country: "",
    comment: "",
    wantsReceipt: false,
    privacyConsent: false,
  });

  const predefinedAmounts = [10, 25, 50];

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount.toString());
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setAmount("");
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const finalAmount = amount || customAmount;
    
    // Required fields validation
    if (!finalAmount || parseFloat(finalAmount) <= 0) {
      alert(t("donation.form.error.amount"));
      return false;
    }
    
    if (!formData.firstName.trim()) {
      alert(t("donation.form.error.firstName"));
      return false;
    }
    
    if (!formData.lastName.trim()) {
      alert(t("donation.form.error.lastName"));
      return false;
    }
    
    if (!formData.email.trim()) {
      alert(t("donation.form.error.email"));
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert(t("donation.form.error.emailInvalid"));
      return false;
    }
    
    // Address validation if receipt is requested
    if (formData.wantsReceipt) {
      if (!formData.street.trim() || !formData.postalCode.trim() || !formData.city.trim() || !formData.country.trim()) {
        alert(t("donation.form.error.address"));
        return false;
      }
    }
    
    if (!formData.privacyConsent) {
      alert(t("donation.form.error.privacy"));
      return false;
    }
    
    return true;
  };

  const handleDonate = () => {
    if (!validateForm()) {
      return;
    }

    const finalAmount = amount || customAmount;
    
    // Here you would integrate with your payment processor
    console.log("Donation details:", {
      type: donationType,
      amount: finalAmount,
      paymentMethod,
      formData,
    });

    // For now, show a success message
    alert(t("donation.form.success"));
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-16">
        {/* 1. Hero Section */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-hero" />
          
          <div className="relative z-10 text-center text-white max-w-4xl px-6">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t("donation.hero.title")}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-8">
              {t("donation.hero.subtitle")}
            </p>
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button text-lg px-8 py-6"
              onClick={() => document.getElementById('donation-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Heart className="mr-2 h-5 w-5" />
              {t("donation.hero.button")}
            </Button>
          </div>
        </section>

        {/* 2. Mission Statement */}
        <section className="py-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                {t("donation.mission.title")}
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p>{t("donation.mission.p1")}</p>
                <p>{t("donation.mission.p2")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Donation Form */}
        <section id="donation-form" className="py-section bg-muted/30">
          <div className="max-w-content mx-auto px-6">
            <div className="max-w-2xl mx-auto">
              <Card className="p-8 shadow-card">
                <div className="text-center mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    {t("donation.form.title")}
                  </h2>
                </div>
                
                <div className="space-y-6">
                  {/* Donation Type */}
                  <div>
                    <Label className="text-base font-semibold">{t("donation.form.type")}</Label>
                    <RadioGroup 
                      value={donationType} 
                      onValueChange={(value: "one-time" | "monthly") => setDonationType(value)}
                      className="flex gap-6 mt-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="one-time" id="one-time" />
                        <Label htmlFor="one-time">{t("donation.form.onetime")}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monthly" id="monthly" />
                        <Label htmlFor="monthly">{t("donation.form.monthly")}</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Amount Selection */}
                  <div>
                    <Label className="text-base font-semibold">{t("donation.form.amount")}</Label>
                    <div className="grid grid-cols-3 gap-3 mt-3 mb-4">
                      {predefinedAmounts.map((amountValue) => (
                        <Button
                          key={amountValue}
                          variant={amount === amountValue.toString() ? "default" : "outline"}
                          onClick={() => handleAmountSelect(amountValue)}
                          className="h-12"
                        >
                          €{amountValue}
                        </Button>
                      ))}
                    </div>
                    <div>
                      <Label htmlFor="custom-amount" className="text-sm text-muted-foreground">
                        {t("donation.form.custom")}
                      </Label>
                      <Input
                        id="custom-amount"
                        type="number"
                        placeholder="Enter amount"
                        value={customAmount}
                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                        className="mt-2"
                        min="1"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <Label className="text-base font-semibold">{t("donation.form.payment")}</Label>
                    <RadioGroup 
                      value={paymentMethod} 
                      onValueChange={(value: "paypal" | "sepa" | "card") => setPaymentMethod(value)}
                      className="space-y-3 mt-3"
                    >
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="flex items-center gap-2 cursor-pointer">
                          <CreditCard className="h-4 w-4" />
                          {t("donation.form.paypal")}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value="sepa" id="sepa" />
                        <Label htmlFor="sepa" className="flex items-center gap-2 cursor-pointer">
                          <Banknote className="h-4 w-4" />
                          {t("donation.form.sepa")}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                          <CreditCard className="h-4 w-4" />
                          {t("donation.form.card")}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">{t("donation.form.personalInfo")}</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">{t("donation.form.firstName")}</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          className="mt-2"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">{t("donation.form.lastName")}</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          className="mt-2"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="email">{t("donation.form.email")}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="mt-2"
                        required
                      />
                    </div>
                  </div>

                  {/* Receipt Checkbox */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="wantsReceipt"
                        checked={formData.wantsReceipt}
                        onCheckedChange={(checked) => handleInputChange("wantsReceipt", checked as boolean)}
                      />
                      <Label htmlFor="wantsReceipt" className="text-sm">
                        {t("donation.form.wantsReceipt")}
                      </Label>
                    </div>
                  </div>

                  {/* Address Fields - Only show if receipt is requested */}
                  {formData.wantsReceipt && (
                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                      <h3 className="text-lg font-semibold text-foreground">{t("donation.form.addressInfo")}</h3>
                      <p className="text-sm text-muted-foreground">{t("donation.form.addressNote")}</p>
                      
                      <div>
                        <Label htmlFor="street">{t("donation.form.street")} *</Label>
                        <Input
                          id="street"
                          value={formData.street}
                          onChange={(e) => handleInputChange("street", e.target.value)}
                          className="mt-2"
                          required={formData.wantsReceipt}
                        />
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="postalCode">{t("donation.form.postalCode")} *</Label>
                          <Input
                            id="postalCode"
                            value={formData.postalCode}
                            onChange={(e) => handleInputChange("postalCode", e.target.value)}
                            className="mt-2"
                            required={formData.wantsReceipt}
                          />
                        </div>
                        <div>
                          <Label htmlFor="city">{t("donation.form.city")} *</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => handleInputChange("city", e.target.value)}
                            className="mt-2"
                            required={formData.wantsReceipt}
                          />
                        </div>
                        <div>
                          <Label htmlFor="country">{t("donation.form.country")} *</Label>
                          <Input
                            id="country"
                            value={formData.country}
                            onChange={(e) => handleInputChange("country", e.target.value)}
                            className="mt-2"
                            required={formData.wantsReceipt}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Comment */}
                  <div>
                    <Label htmlFor="comment">{t("donation.form.comment")}</Label>
                    <Textarea
                      id="comment"
                      value={formData.comment}
                      onChange={(e) => handleInputChange("comment", e.target.value)}
                      placeholder={t("donation.form.comment_placeholder")}
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  {/* Privacy Consent */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="privacyConsent"
                        checked={formData.privacyConsent}
                        onCheckedChange={(checked) => handleInputChange("privacyConsent", checked as boolean)}
                        className="mt-1"
                      />
                      <Label htmlFor="privacyConsent" className="text-sm leading-relaxed">
                        {t("donation.form.privacyConsent")}
                      </Label>
                    </div>
                  </div>

                  {/* Donate Button */}
                  <Button 
                    onClick={handleDonate}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-button h-12 text-lg"
                  >
                    <Heart className="mr-2 h-5 w-5" />
                    {donationType === "one-time" ? t("donation.form.donate") : t("donation.form.donate_monthly")}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* 4. Trust & Transparency */}
        <section className="py-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {t("donation.trust.title")}
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 text-center shadow-card">
                  <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t("donation.trust.registered")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("donation.trust.registered.desc")}
                  </p>
                </Card>
                <Card className="p-6 text-center shadow-card">
                  <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t("donation.trust.tax")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("donation.trust.tax.desc")}
                  </p>
                </Card>
                <Card className="p-6 text-center shadow-card">
                  <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t("donation.trust.transparency")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("donation.trust.transparency.desc")}
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Community Photo & Quote */}
        <section className="py-section bg-muted/30">
          <div className="max-w-content mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <img 
                    src={communityImage} 
                    alt="Community in Uganda" 
                    className="w-full h-64 object-cover rounded-lg shadow-lg"
                  />
                </div>
                <div className="text-center md:text-left">
                  <blockquote className="text-2xl font-medium text-foreground mb-4 italic">
                    "{t("donation.quote.text")}"
                  </blockquote>
                  <p className="text-lg text-muted-foreground">
                    {t("donation.quote.author")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. FAQ */}
        <section className="py-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {t("donation.faq.title")}
                </h2>
              </div>
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left">
                    {t("donation.faq.q1")}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t("donation.faq.a1")}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left">
                    {t("donation.faq.q2")}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t("donation.faq.a2")}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left">
                    {t("donation.faq.q3")}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t("donation.faq.a3")}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left">
                    {t("donation.faq.q4")}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t("donation.faq.a4")}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* 7. Footer Contact */}
        <section className="py-section bg-muted/30">
          <div className="max-w-content mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                {t("donation.contact.title")}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {t("donation.contact.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="outline" size="lg" className="shadow-button">
                  <a href={`mailto:${t("donation.contact.email")}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    {t("donation.contact.email")}
                  </a>
                </Button>
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button">
                  <a href="/contact">
                    {t("donation.contact.button")}
                  </a>
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

export default Donation;
