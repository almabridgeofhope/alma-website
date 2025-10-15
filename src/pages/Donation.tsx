import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Heart, Shield, CheckCircle, Mail, CreditCard, Banknote } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImage from "@/assets/community/community_4.jpg";
import communityImage from "@/assets/community/community_2.png";

const Donation = () => {
  const { t } = useLanguage();
  const [donationType, setDonationType] = useState<"one-time" | "monthly">("one-time");
  const [amount, setAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "sepa" | "card">("paypal");

  const predefinedAmounts = [10, 25, 50];

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount.toString());
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setAmount("");
  };

  const handleDonate = () => {
    const finalAmount = amount || customAmount;
    if (!finalAmount || parseFloat(finalAmount) <= 0) {
      alert("Please select or enter a valid donation amount.");
      return;
    }

    // Here you would integrate with your payment processor
    console.log("Donation details:", {
      type: donationType,
      amount: finalAmount,
      paymentMethod,
    });

    // For now, show a success message
    alert(`Thank you for your ${donationType} donation of €${finalAmount}!`);
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
              Your support brings hope.
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-8">
              Every donation helps us empower communities in Uganda with access to water, education and sustainable livelihoods.
            </p>
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button text-lg px-8 py-6"
              onClick={() => document.getElementById('donation-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Heart className="mr-2 h-5 w-5" />
              Donate now
            </Button>
          </div>
        </section>

        {/* 2. Mission Statement */}
        <section className="py-section bg-background">
          <div className="max-w-content mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Our Mission
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p>Alma Bridge of Hope e.V. is a non-profit organization based in Germany supporting community-led initiatives in Uganda.</p>
                <p>Our goal is to create self-sustaining communities through access to clean water, energy, education, and financial literacy.</p>
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
                    Make a Donation
                  </h2>
                </div>
                
                <div className="space-y-6">
                  {/* Donation Type */}
                  <div>
                    <Label className="text-base font-semibold">Donation Type</Label>
                    <RadioGroup 
                      value={donationType} 
                      onValueChange={(value: "one-time" | "monthly") => setDonationType(value)}
                      className="flex gap-6 mt-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="one-time" id="one-time" />
                        <Label htmlFor="one-time">One-time</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monthly" id="monthly" />
                        <Label htmlFor="monthly">Monthly</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Amount Selection */}
                  <div>
                    <Label className="text-base font-semibold">Amount (€)</Label>
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
                        Or enter custom amount
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
                    <Label className="text-base font-semibold">Payment Method</Label>
                    <RadioGroup 
                      value={paymentMethod} 
                      onValueChange={(value: "paypal" | "sepa" | "card") => setPaymentMethod(value)}
                      className="space-y-3 mt-3"
                    >
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="flex items-center gap-2 cursor-pointer">
                          <CreditCard className="h-4 w-4" />
                          PayPal
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value="sepa" id="sepa" />
                        <Label htmlFor="sepa" className="flex items-center gap-2 cursor-pointer">
                          <Banknote className="h-4 w-4" />
                          SEPA Bank Transfer
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                          <CreditCard className="h-4 w-4" />
                          Credit Card
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Donate Button */}
                  <Button 
                    onClick={handleDonate}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-button h-12 text-lg"
                  >
                    <Heart className="mr-2 h-5 w-5" />
                    {donationType === "one-time" ? "Donate Now" : "Start Monthly Donation"}
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
                  Trust & Transparency
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 text-center shadow-card">
                  <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Registered Non-Profit
                  </h3>
                  <p className="text-muted-foreground">
                    Registered non-profit in Germany (gemeinnützig anerkannt)
                  </p>
                </Card>
                <Card className="p-6 text-center shadow-card">
                  <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Tax Deductible
                  </h3>
                  <p className="text-muted-foreground">
                    Donations are tax deductible
                  </p>
                </Card>
                <Card className="p-6 text-center shadow-card">
                  <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Full Transparency
                  </h3>
                  <p className="text-muted-foreground">
                    Regular reporting ensures full transparency
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
                    "We believe in empowerment, not dependence."
                  </blockquote>
                  <p className="text-lg text-muted-foreground">
                    – Fiona, Alma CBO Uganda
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
                  Frequently Asked Questions
                </h2>
              </div>
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left">
                    How can I donate?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    You can donate easily via PayPal, SEPA bank transfer, or credit card using our secure donation form above.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left">
                    Will I receive a donation receipt?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, you will receive a donation receipt at the end of the year for tax purposes. For immediate receipts, please contact us at info@almabridgeofhope.org.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left">
                    How is my donation used?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Your donation directly supports our projects in Uganda, including water access, education, and sustainable livelihood programs. We maintain full transparency in our financial reporting.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left">
                    Can I cancel my monthly donation?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, you can cancel your monthly donation at any time by contacting us at info@almabridgeofhope.org or through your payment provider.
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
                Questions about donating?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Contact us for any questions about donations, tax receipts, or our work.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="outline" size="lg" className="shadow-button">
                  <a href="mailto:info@almabridgeofhope.org">
                    <Mail className="mr-2 h-4 w-4" />
                    info@almabridgeofhope.org
                  </a>
                </Button>
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-button">
                  <a href="/contact">
                    Contact Us
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
