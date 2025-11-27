import { useEffect, useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import OptimizedImage from "@/components/OptimizedImage";
import PreloadImage from "@/components/PreloadImage";
import { Heart, Shield, CheckCircle, Mail, CreditCard, Banknote, ShoppingCart, Package, Sprout, Droplets, Wheat, Trash2, Plus, Minus, Edit2, Check, X, Info, HelpCircle, BrickWall, Layers, Zap, Toilet, Sofa, Paintbrush, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShoppingCart } from "@/contexts/ShoppingCartContext";
import { donationWebhookService } from "@/services/donationWebhookService";
import { stripeService } from "@/services/stripeService";
import { paypalService } from "@/services/paypalService";
import heroImage from "@/assets/nature/nature_2.jpg";
import communityImage from "@/assets/community/community_2.png";
import { useSearchParams, Link, useNavigate } from "react-router-dom";

// PayPal Configuration
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

// Stripe Configuration
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// SEPA Bank Account Configuration
const SEPA_BANK_ACCOUNT = {
  iban: import.meta.env.VITE_SEPA_IBAN || "DE22672300004014594213",
  bic: import.meta.env.VITE_SEPA_BIC || "MLPBDE61XXX", 
  accountHolder: import.meta.env.VITE_SEPA_ACCOUNT_HOLDER || "Aaron Immanuel Hesser",
  bankName: import.meta.env.VITE_SEPA_BANK_NAME || "MLP Banking"
};

// Generate SEPA reference number
const generateSEPAReference = (donorName: string, amount: number, timestamp: string): string => {
  const date = new Date(timestamp);
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const namePart = donorName.replace(/\s+/g, '').substring(0, 10).toUpperCase();
  const amountPart = Math.floor(amount).toString().padStart(4, '0');
  return `ALMA-${dateStr}-${namePart}-${amountPart}`;
};

// PayPal Button Component - uses PayPalScriptReducer hook (must be inside PayPalScriptProvider)
const PayPalButtonsComponent = memo(({ 
  createOrder, 
  createSubscription,
  onApprove, 
  onError, 
  onCancel,
}: {
  createOrder?: (data: any, actions: any) => Promise<string>;
  createSubscription?: (data: any, actions: any) => Promise<string>;
  onApprove: (data: any, actions: any) => Promise<void>;
  onError: (err: any) => void;
  onCancel: () => void;
}) => {
  const { t } = useLanguage();
  const [{ isPending, isResolved, isRejected }] = usePayPalScriptReducer();

  if (isPending) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Lade PayPal...</p>
        </div>
      </div>
    );
  }

  if (isRejected || !isResolved) {
    console.error("PayPal SDK failed to load", { isRejected, isResolved });
    return (
      <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800 mb-2">
          {t("paypal.error.loadFailed")}
        </p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          size="sm"
        >
          Seite neu laden
        </Button>
      </div>
    );
  }

  // PayPal SDK requires ONLY one of createOrder or createSubscription, not both
  const buttonProps: any = {
    onApprove,
    onError,
    onCancel,
    style: {
      layout: "vertical",
      color: "blue",
      shape: "rect",
      label: "paypal",
      tagline: false,
    },
  };

  // Add the appropriate create function based on payment type
  if (createSubscription) {
    buttonProps.createSubscription = createSubscription;
  } else if (createOrder) {
    buttonProps.createOrder = createOrder;
  }

  return (
    <div className="w-full relative">
      <div className="mb-2 text-center text-sm text-muted-foreground">
        {t("paypal.redirect")}
      </div>
      <div id="paypal-button-container" className="w-full min-h-[50px] relative">
        <PayPalButtons {...buttonProps} />
      </div>
    </div>
  );
});

PayPalButtonsComponent.displayName = "PayPalButtonsComponent";

// PayPal Button Wrapper with PayPalScriptProvider - wraps only the PayPal buttons
// This is the component that should be used in the Donation component
// Supports both one-time payments and subscriptions (via backend)
const PayPalButtonWrapper = memo(({ 
  createOrder,
  createSubscription,
  onApprove, 
  onError, 
  onCancel,
  language,
}: {
  createOrder?: (data: any, actions: any) => Promise<string>;
  createSubscription?: (data: any, actions: any) => Promise<string>;
  onApprove: (data: any, actions: any) => Promise<void>;
  onError: (err: any) => void;
  onCancel: () => void;
  language: string;
}) => {
  if (!PAYPAL_CLIENT_ID) {
    return (
      <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">PayPal Client ID nicht konfiguriert</p>
      </div>
    );
  }

  const paypalLocale = language === "de" ? "de_DE" : "en_US";
  
  // Determine intent based on payment type
  const isSubscription = !!createSubscription;
  const intent = isSubscription ? "subscription" : "capture";
  const vault = isSubscription ? true : undefined;

  return (
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CLIENT_ID,
        currency: "EUR",
        intent: intent,
        components: "buttons",
        locale: paypalLocale,
        "enable-funding": "paypal",
        "disable-funding": "card,credit,venmo,paylater,sepa",
        vault: vault as any,
      }}
    >
      <PayPalButtonsComponent
        createOrder={createOrder}
        createSubscription={createSubscription}
        onApprove={onApprove}
        onError={onError}
        onCancel={onCancel}
      />
    </PayPalScriptProvider>
  );
});

PayPalButtonWrapper.displayName = "PayPalButtonWrapper";

// Stripe Checkout Button Component
const StripeCheckoutButton = memo(({
  amount,
  onRedirect,
  onError,
  language,
  paymentMethodTypes,
  formData,
  metadata,
  onValidate,
  isSubscription,
}: {
  amount: number;
  onRedirect: () => void;
  onError: (error: string) => void;
  language: string;
  paymentMethodTypes: ('card' | 'sepa_debit')[];
  formData: {
    firstName: string;
    lastName: string;
    email: string;
  };
  metadata?: Record<string, string>;
  onValidate: () => boolean;
  isSubscription?: boolean;
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClick = async () => {
    if (!onValidate()) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { url } = await stripeService.createCheckoutSession({
        amount,
        currency: 'eur',
        paymentMethodTypes,
        metadata: metadata || {},
        customerEmail: formData.email,
        customerName: `${formData.firstName} ${formData.lastName}`,
        isSubscription: isSubscription || false,
      });

      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        throw new Error('Invalid checkout URL received');
      }

      onRedirect();
      window.location.href = url;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create checkout session';
      setErrorMessage(message);
      onError(message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
        </div>
      )}
      <Button
        onClick={handleClick}
        disabled={isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing
          ? (language === "de" ? "Wird weitergeleitet..." : "Redirecting...")
          : (language === "de" ? `€${amount.toFixed(2)} spenden` : `Donate €${amount.toFixed(2)}`)}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        {language === "de" 
          ? "Sie werden zu Stripe Checkout weitergeleitet, um die Zahlung abzuschließen."
          : "You will be redirected to Stripe Checkout to complete your payment."}
      </p>
    </div>
  );
});

StripeCheckoutButton.displayName = "StripeCheckoutButton";

const Donation = () => {
  const { t, language } = useLanguage();
  const { state: cartState, updateQuantity, removeItem, clearCart, formatCurrency, addOrUpdateGeneralDonation, getGeneralDonation, updateAmount, closeCart } = useShoppingCart();
  const navigate = useNavigate();
  
  // Close cart sidebar if it's open when on donation page
  useEffect(() => {
    closeCart();
  }, [closeCart]);

  // Note: Navigation links are now handled directly in the Navigation component
  // using explicit onClick handlers when on the donation page to bypass PayPal SDK interception.
  
  // Component state
  const [searchParams] = useSearchParams();
  const [donationType, setDonationType] = useState<"one-time" | "monthly">("one-time");
  const [amount, setAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "stripe-card" | "stripe-sepa">("paypal");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  // Helper functions to show dialogs
  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    setShowErrorDialog(true);
  }, []);
  
  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setShowSuccessDialog(true);
  }, []);
  
  // Handle success and cancellation redirects from PayPal and Stripe return URLs
  useEffect(() => {
    const success = searchParams.get("success");
    const cancelled = searchParams.get("cancelled");
    const stripeStatus = searchParams.get("stripe");
    const sessionId = searchParams.get("session_id");

    // Handle PayPal success redirect
    if (success === "true") {
      // Redirect to success page with donation details
      // Note: We'll get the amount from the cart or form state
      const finalAmount = cartState.items.length > 0 
        ? cartState.totalAmount.toString() 
        : (amount || customAmount || "");
      
      if (finalAmount) {
        const params = new URLSearchParams({
          amount: finalAmount,
          type: donationType,
        });
        navigate(`/donation/success?${params.toString()}`);
      } else {
        // If no amount, just redirect to success page
        navigate("/donation/success");
      }
      return;
    }
    
    // Handle PayPal/Stripe cancellation
    if (cancelled === "true" || stripeStatus === "cancelled") {
      // Clear the URL parameters and show info message
      navigate("/donation", { replace: true });
      showError(
        language === "de" 
          ? "Die Zahlung wurde abgebrochen. Sie können es erneut versuchen."
          : "Payment was cancelled. You can try again."
      );
      return;
    }
    
    // Handle Stripe success redirect
    if (stripeStatus === "success" && sessionId) {
      // Retrieve session details from Stripe to get the amount
      stripeService.getSessionDetails(sessionId)
        .then((session) => {
          const finalAmount = (session.amount_total / 100).toFixed(2); // Convert from cents to euros
          const donationType = session.metadata?.donationType || "one-time";
          
          const params = new URLSearchParams({
            amount: finalAmount,
            type: donationType,
            sessionId: sessionId,
          });
          
          // Clear cart after successful payment
          clearCart();
          
          navigate(`/donation/success?${params.toString()}`);
        })
        .catch((error) => {
          console.error("Failed to retrieve Stripe session details:", error);
          // Still redirect to success page even if we can't get details
          navigate("/donation/success");
        });
    }
  }, [searchParams, navigate, cartState.items.length, cartState.totalAmount, amount, customAmount, donationType, clearCart, language, showError]);
  
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
    wantsNewsletter: false,
  });

  const predefinedAmounts = [10, 25, 50, 100];
  const [useCartAmount, setUseCartAmount] = useState(false);
  const [hasManualSelection, setHasManualSelection] = useState(false);
  const [generalDonationAmount, setGeneralDonationAmount] = useState<string>("");
  const [editingGeneralDonation, setEditingGeneralDonation] = useState(false);
  const [editGeneralDonationValue, setEditGeneralDonationValue] = useState<string>("");
  const [addingGeneralDonation, setAddingGeneralDonation] = useState(false);
  const [newGeneralDonationAmount, setNewGeneralDonationAmount] = useState<string>("");
  const [sepaReference, setSepaReference] = useState<string>("");
  const [sepaDetailsCopied, setSepaDetailsCopied] = useState(false);

  // Auto-add general donation when URL param exists and cart has items
  useEffect(() => {
    const amountParam = searchParams.get("amount");
    const hasUrlAmount = !!amountParam;
    const hasCartItems = cartState.items.some(item => item.type !== 'general-donation');
    const generalDonation = getGeneralDonation();
    
    // If URL param exists and cart has non-donation items, add/update general donation
    if (hasUrlAmount && hasCartItems && amountParam) {
      const amount = parseFloat(amountParam);
      if (!isNaN(amount) && amount > 0) {
        // Only update if the amount is different from current general donation
        if (!generalDonation || generalDonation.totalPrice !== amount) {
          addOrUpdateGeneralDonation(amount);
        }
      }
    }
  }, [searchParams, cartState.items, getGeneralDonation, addOrUpdateGeneralDonation]);

  // Update general donation amount state when cart changes
  useEffect(() => {
    const generalDonation = getGeneralDonation();
    if (generalDonation) {
      setGeneralDonationAmount(generalDonation.totalPrice.toString());
    } else {
      setGeneralDonationAmount("");
    }
  }, [cartState.items, getGeneralDonation]);

  useEffect(() => {
    const amountParam = searchParams.get("amount");
    const hasCartItems = cartState.items.some(item => item.type !== 'general-donation');
    
    // If we have cart items (including general donation), clear amount selection
    if (cartState.items.length > 0) {
      setAmount("");
      setCustomAmount("");
      return;
    }
    
    // If no cart items, use URL param if available
    if (amountParam && !hasCartItems && !hasManualSelection) {
      setAmount(amountParam);
      setCustomAmount("");
    } else if (!amountParam && !hasCartItems && !hasManualSelection) {
      setAmount("");
      setCustomAmount("");
    }
  }, [searchParams, cartState.items.length, hasManualSelection]);

  const handleAmountSelect = (selectedAmount: number) => {
    // Always allow selection - user can override cart amount or URL param
    setAmount(selectedAmount.toString());
    setCustomAmount("");
    setUseCartAmount(false);
    setHasManualSelection(true);
  };

  const handleUseCartAmount = () => {
    if (cartState.items.length > 0) {
      setUseCartAmount(true);
      setAmount(cartState.totalAmount.toString());
      setCustomAmount("");
      setHasManualSelection(true);
    }
  };

  const getPhaseIcon = (phase: string) => {
    const phaseLower = phase?.toLowerCase() || '';
    
    // General project phases
    switch (phaseLower) {
      case 'planning':
        return <Sprout className="w-4 h-4 text-green-600" />;
      case 'implementation':
        return <Droplets className="w-4 h-4 text-blue-600" />;
      case 'impact':
        return <Wheat className="w-4 h-4 text-yellow-600" />;
    }
    
    // Construction phases
    if (phaseLower.includes('security')) {
      return <Shield className="w-4 h-4 text-gray-600" />;
    }
    if ((phaseLower.includes('outer') && phaseLower.includes('walls')) || 
        (phaseLower.includes('outer') && phaseLower.includes('floor')) ||
        (phaseLower.includes('walls') && phaseLower.includes('flooring'))) {
      return <BrickWall className="w-4 h-4 text-gray-600" />;
    }
    if (phaseLower.includes('foundation') && phaseLower.includes('sealing')) {
      return <Layers className="w-4 h-4 text-gray-600" />;
    }
    if (phaseLower.includes('water') && phaseLower.includes('system')) {
      return <Droplets className="w-4 h-4 text-gray-600" />;
    }
    if (phaseLower.includes('septic') || phaseLower.includes('soak')) {
      return <Droplets className="w-4 h-4 text-gray-600" />;
    }
    if (phaseLower.includes('interior') && phaseLower.includes('furniture')) {
      return <Sofa className="w-4 h-4 text-gray-600" />;
    }
    if ((phaseLower.includes('interior') && phaseLower.includes('walls')) || 
        phaseLower.includes('innenwände')) {
      return <Paintbrush className="w-4 h-4 text-gray-600" />;
    }
    if (phaseLower.includes('electricity') && phaseLower.includes('lighting')) {
      return <Zap className="w-4 h-4 text-gray-600" />;
    }
    if (phaseLower.includes('bathroom') && phaseLower.includes('sanitary')) {
      return <Toilet className="w-4 h-4 text-gray-600" />;
    }
    
    // Fallbacks
    if (phaseLower.includes('outer') || (phaseLower.includes('walls') && phaseLower.includes('floor'))) {
      return <BrickWall className="w-4 h-4 text-gray-600" />;
    }
    if (phaseLower.includes('foundation') || phaseLower.includes('sealing')) {
      return <Layers className="w-4 h-4 text-gray-600" />;
    }
    if (phaseLower.includes('water')) {
      return <Droplets className="w-4 h-4 text-gray-600" />;
    }
    if (phaseLower.includes('innenwände') || 
        (phaseLower.includes('interior') && (phaseLower.includes('finishing') || phaseLower.includes('walls')))) {
      return <Paintbrush className="w-4 h-4 text-gray-600" />;
    }
    if (phaseLower.includes('electricity') || phaseLower.includes('lighting')) {
      return <Zap className="w-4 h-4 text-gray-600" />;
    }
    if (phaseLower.includes('bathroom') || phaseLower.includes('sanitary')) {
      return <Toilet className="w-4 h-4 text-gray-600" />;
    }
    
    return <Package className="w-4 h-4 text-gray-600" />;
  };

  const handleCustomAmountChange = (value: string) => {
    // Always allow custom amount - user can override cart amount or URL param
    setCustomAmount(value);
    setAmount("");
    setUseCartAmount(false);
    setHasManualSelection(true);
  };

  const handleEditGeneralDonation = () => {
    const generalDonation = getGeneralDonation();
    if (generalDonation) {
      setEditGeneralDonationValue(generalDonation.totalPrice.toString());
      setEditingGeneralDonation(true);
    }
  };

  const handleSaveGeneralDonation = () => {
    const amount = parseFloat(editGeneralDonationValue);
    if (!isNaN(amount) && amount > 0) {
      updateAmount('general-donation', amount);
      setEditingGeneralDonation(false);
    }
  };

  const handleCancelEditGeneralDonation = () => {
    setEditingGeneralDonation(false);
    setEditGeneralDonationValue("");
  };

  const handleAddGeneralDonation = () => {
    const existingGeneralDonation = getGeneralDonation();
    if (existingGeneralDonation) {
      // If general donation exists, edit it instead of adding new one
      setEditGeneralDonationValue(existingGeneralDonation.totalPrice.toString());
      setEditingGeneralDonation(true);
    } else {
      // If no general donation exists, add new one
      setAddingGeneralDonation(true);
      setNewGeneralDonationAmount("");
    }
  };

  const handleSaveNewGeneralDonation = () => {
    const amount = parseFloat(newGeneralDonationAmount);
    if (!isNaN(amount) && amount > 0) {
      // Add new general donation
      addOrUpdateGeneralDonation(amount);
      setAddingGeneralDonation(false);
      setNewGeneralDonationAmount("");
    }
  };

  const handleCancelAddGeneralDonation = () => {
    setAddingGeneralDonation(false);
    setNewGeneralDonationAmount("");
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    // For monthly donations, always use selected amount (no cart items)
    // For one-time donations, use cart total if items exist, otherwise use selected amount
    const finalAmount = donationType === "monthly"
      ? (amount || customAmount)
      : (cartState.items.length > 0 
          ? cartState.totalAmount.toString() 
          : (amount || customAmount));
    console.log("Validating form...");
    console.log("Final amount:", finalAmount);
    console.log("Form data:", formData);
    
    // Required fields validation
    if (!finalAmount || parseFloat(finalAmount) <= 0) {
      console.log("Amount validation failed");
      showError(t("donation.form.error.amount"));
      return false;
    }
    
    if (!formData.firstName.trim()) {
      console.log("First name validation failed");
      showError(t("donation.form.error.firstName"));
      return false;
    }
    
    if (!formData.lastName.trim()) {
      console.log("Last name validation failed");
      showError(t("donation.form.error.lastName"));
      return false;
    }
    
    if (!formData.email.trim()) {
      console.log("Email validation failed");
      showError(t("donation.form.error.email"));
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      console.log("Email format validation failed");
      showError(t("donation.form.error.emailInvalid"));
      return false;
    }
    
    // Address validation if receipt is requested
    if (formData.wantsReceipt) {
      if (!formData.street.trim() || !formData.postalCode.trim() || !formData.city.trim() || !formData.country.trim()) {
        console.log("Address validation failed");
        showError(t("donation.form.error.address"));
        return false;
      }
    }
    
    if (!formData.privacyConsent) {
      console.log("Privacy consent validation failed");
      showError(t("donation.form.error.privacy"));
      return false;
    }
    
    console.log("Form validation passed!");
    return true;
  };

  const handleDonate = () => {
    console.log("Donate button clicked!");
    console.log("Form data:", formData);
    console.log("Amount:", amount);
    console.log("Custom amount:", customAmount);
    console.log("Payment method:", paymentMethod);
    
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    // Show warning dialog instead of proceeding directly
    setShowWarningDialog(true);
  };

  // Helper function to process donation and send to webhook
  const processDonation = async (paymentId?: string) => {
    try {
      console.log("=== Processing Donation ===");
      console.log("Payment ID:", paymentId);
      console.log("Cart items count:", cartState.items.length);
      console.log("Cart items:", cartState.items);
      console.log("Amount:", amount);
      console.log("Custom amount:", customAmount);
      
      // Prepare donation items
      let donationItems = [];
      
      if (cartState.items.length > 0) {
        // Use cart items
        console.log("✅ Using cart items for donation");
        donationItems = donationWebhookService.formatCartItemsForWebhook(cartState.items);
        console.log("Formatted donation items:", donationItems);
      } else {
        // No cart items - create a general donation
        const finalAmount = parseFloat(amount || customAmount || "0");
        console.log("📝 No cart items, creating general donation with amount:", finalAmount);
        if (finalAmount > 0) {
          donationItems = [{
            type: 'general-donation' as const,
            name: t("donation.form.unrestrictedDonation"),
            unitPrice: finalAmount,
            totalPrice: finalAmount,
          }];
        }
      }

      if (donationItems.length === 0) {
        console.error("❌ No donation items to process");
        return { ok: false, message: "No donation items" };
      }

      // Calculate total amount
      const totalAmount = donationItems.reduce((sum, item) => sum + item.totalPrice, 0);
      console.log("💰 Total donation amount:", totalAmount);

      console.log("📤 Sending donation to webhook...");
      // Send to webhook
      const result = await donationWebhookService.sendDonation({
        items: donationItems,
        totalAmount: totalAmount,
        donationType: donationType,
        paymentMethod: paymentMethod,
        donorEmail: formData.email || undefined,
        donorName: formData.firstName && formData.lastName 
          ? `${formData.firstName} ${formData.lastName}` 
          : undefined,
        paymentId: paymentId,
        wantsReceipt: formData.wantsReceipt,
        address: formData.wantsReceipt ? {
          street: formData.street || undefined,
          postalCode: formData.postalCode || undefined,
          city: formData.city || undefined,
          country: formData.country || undefined,
        } : undefined,
        wantsNewsletter: formData.wantsNewsletter,
        comment: formData.comment || undefined,
      });

      if (result.ok) {
        console.log("✅ Donation successfully processed by webhook:", result);
        console.log("📊 Items updated:", result.totalUpdated);
        console.log("📋 Updates:", result.updates);
        return result;
      } else {
        console.error("❌ Failed to process donation:", result.message);
        // Don't throw - we still want to show success to user
        // The donation was received, just the sheet update failed
        return result;
      }
    } catch (error) {
      console.error("❌ Error processing donation:", error);
      // Don't throw - payment was successful, just webhook update failed
      return { ok: false, message: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  const handlePaymentMethodClick = async () => {
    if (!validateForm()) {
      return;
    }
    // PayPal payment will be handled by PayPal buttons (they're already visible)
    // No need to do anything else - buttons are already rendered
  };

  const copySEPADetails = () => {
    const finalAmount = donationType === "monthly"
      ? (amount || customAmount)
      : (cartState.items.length > 0 
          ? cartState.totalAmount.toString() 
          : (amount || customAmount));
    
    const details = `IBAN: ${SEPA_BANK_ACCOUNT.iban}\nBIC: ${SEPA_BANK_ACCOUNT.bic}\nAccount Holder: ${SEPA_BANK_ACCOUNT.accountHolder}\nAmount: €${finalAmount}\nReference: ${sepaReference}`;
    
    navigator.clipboard.writeText(details).then(() => {
      setSepaDetailsCopied(true);
      setTimeout(() => setSepaDetailsCopied(false), 2000);
    });
  };

  // PayPal payment handlers - memoized to prevent unnecessary re-renders
  const createPayPalOrder = useCallback((data: any, actions: any) => {
    // Validate all required fields before creating PayPal order
    const finalAmountStr = donationType === "monthly"
      ? (amount || customAmount)
      : (cartState.items.length > 0 
          ? cartState.totalAmount.toString() 
          : (amount || customAmount));
    
    // Validate amount
    if (!finalAmountStr || parseFloat(finalAmountStr) <= 0) {
      throw new Error(t("donation.form.error.amount"));
    }
    
    // Validate first name
    if (!formData.firstName.trim()) {
      throw new Error(t("donation.form.error.firstName"));
    }
    
    // Validate last name
    if (!formData.lastName.trim()) {
      throw new Error(t("donation.form.error.lastName"));
    }
    
    // Validate email
    if (!formData.email.trim()) {
      throw new Error(t("donation.form.error.email"));
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      throw new Error(t("donation.form.error.emailInvalid"));
    }
    
    // Validate address if receipt is requested
    if (formData.wantsReceipt) {
      if (!formData.street.trim() || !formData.postalCode.trim() || !formData.city.trim() || !formData.country.trim()) {
        throw new Error(t("donation.form.error.address"));
      }
    }
    
    // Validate privacy consent
    if (!formData.privacyConsent) {
      throw new Error(t("donation.form.error.privacy"));
    }
    
    // Calculate final amount for PayPal
    let finalAmount: number;
    
    if (donationType === "monthly") {
      finalAmount = parseFloat(amount || customAmount || "0");
    } else {
      if (cartState.items.length > 0) {
        // Use cart total, but validate it and fallback to calculating from items if needed
        finalAmount = cartState.totalAmount;
        
        // If totalAmount is invalid, calculate from items
        if (isNaN(finalAmount) || finalAmount <= 0) {
          const calculatedTotal = cartState.items.reduce((sum, item) => {
            const itemTotal = item.totalPrice || (item.unitPrice * (item.quantity || 1));
            return sum + (isNaN(itemTotal) ? 0 : itemTotal);
          }, 0);
          
          if (!isNaN(calculatedTotal) && calculatedTotal > 0) {
            finalAmount = calculatedTotal;
          } else {
            // Last resort: try to use amount/customAmount
            finalAmount = parseFloat(amount || customAmount || "0");
          }
        }
      } else {
        finalAmount = parseFloat(amount || customAmount || "0");
      }
    }
    
    // Final amount validation (should not happen if validation above worked, but double-check)
    if (isNaN(finalAmount) || finalAmount <= 0) {
      console.error("Invalid amount for PayPal order:", {
        finalAmount,
        donationType,
        amount,
        customAmount,
        cartItemsCount: cartState.items.length,
        cartTotalAmount: cartState.totalAmount,
        cartItems: cartState.items.map(item => ({
          id: item.id,
          type: item.type,
          totalPrice: item.totalPrice,
          unitPrice: item.unitPrice,
          quantity: item.quantity
        }))
      });
      throw new Error(t("donation.form.error.amount"));
    }
    
    // Format amount to 2 decimal places for PayPal
    const formattedAmount = finalAmount.toFixed(2);
    
    return actions.order.create({
      purchase_units: [{
        amount: {
          currency_code: "EUR",
          value: formattedAmount,
        },
        description: `${donationType === "one-time" ? t("donation.form.onetime") : t("donation.form.monthly")} donation to Alma Bridge of Hope`,
        custom_id: `${donationType}-${Date.now()}`,
      }],
      application_context: {
        brand_name: "Alma Bridge of Hope",
        landing_page: "LOGIN",
        user_action: "PAY_NOW",
        return_url: `${window.location.origin}/donation?success=true`,
        cancel_url: `${window.location.origin}/donation?cancelled=true`,
      },
    });
  }, [donationType, amount, customAmount, cartState.items, cartState.totalAmount, t, language, formData]);

  // Function to subscribe to newsletter
  const subscribeToNewsletter = async (email: string) => {
    const endpoint = import.meta.env.VITE_NEWSLETTER_ENDPOINT as string | undefined;
    
    if (!endpoint) {
      console.warn("Newsletter endpoint not configured");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('source', 'donation-form');

      await fetch(endpoint, {
        method: "POST",
        body: formData,
        mode: 'no-cors',
      });
      
      console.log("Newsletter subscription successful for:", email);
    } catch (err) {
      console.error("Newsletter subscription failed:", err);
      // Don't show error to user - donation was successful
    }
  };

  const onPayPalApprove = (data: any, actions: any) => {
    console.log("=== PayPal Payment Approved ===");
    console.log("PayPal data:", data);
    console.log("PayPal actions:", actions);
    
    // Check if this is a subscription or an order
    const isSubscription = !!data.subscriptionID;
    console.log("Is subscription:", isSubscription);
    console.log("Subscription ID:", data.subscriptionID);
    console.log("Order ID:", data.orderID);
    
    // Check if this is a SEPA payment (only for orders)
    // SEPA payments can be detected by checking the payment source or funding source
    const paymentSource = data.paymentSource || data.payment_source;
    const fundingSource = data.fundingSource || data.funding_source;
    const isSEPAPayment = !isSubscription && !!(paymentSource?.sepa_debit || fundingSource === 'sepa' || data.paymentMethod === 'sepa');
    
    console.log("Payment source:", paymentSource);
    console.log("Funding source:", fundingSource);
    console.log("Is SEPA payment:", isSEPAPayment);
    
    // Handle both subscriptions and orders
    const handlePayment = async () => {
      try {
        let details: any;
        let paymentId: string;
        
        if (isSubscription) {
          // For subscriptions, we don't capture - subscription is already created
          console.log("Subscription created successfully");
          paymentId = data.subscriptionID;
          details = { 
            id: paymentId, 
            status: 'ACTIVE',
            subscription_id: data.subscriptionID
          };
          console.log("PayPal subscription ID:", paymentId);
        } else if (isSEPAPayment) {
          // For SEPA, try to capture but it might take time
          // Use order ID if capture is not immediately available
          console.log("SEPA payment detected - attempting capture...");
          
          try {
            // Try to capture with a timeout
            details = await Promise.race([
              actions.order.capture(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Capture timeout")), 10000)
              )
            ]) as any;
            
            paymentId = details.id || details.purchase_units?.[0]?.payments?.captures?.[0]?.id || data.orderID;
            console.log("SEPA payment captured:", paymentId);
          } catch (captureError) {
            // If capture times out or fails, use order ID
            console.log("Capture not immediately available, using order ID");
            paymentId = data.orderID;
            details = { id: paymentId, status: 'PENDING' };
          }
        } else {
          // For regular PayPal payments, capture normally
          details = await actions.order.capture();
          paymentId = details.id || details.purchase_units?.[0]?.payments?.captures?.[0]?.id;
          console.log("PayPal payment captured:", paymentId);
        }
        
        console.log("=== PayPal Payment Completed ===");
        console.log("PayPal details:", details);
        console.log("PayPal transaction ID:", paymentId);
        
        // Process the donation via webhook
        console.log("⏳ Processing donation via webhook...");
        const result = await processDonation(paymentId);
        
        setIsProcessingPayment(false);
        
        // Subscribe to newsletter if requested
        if (formData.wantsNewsletter && formData.email) {
          await subscribeToNewsletter(formData.email);
        }
        
        // Calculate final amount for redirect BEFORE clearing state
        const finalAmount = donationType === "monthly"
          ? (amount || customAmount || "0")
          : (cartState.items.length > 0 
              ? cartState.totalAmount.toString() 
              : (amount || customAmount || "0"));
        
        console.log("💰 PayPal: Navigating to success page with amount:", finalAmount);
        
        // Redirect to success page with donation details (BEFORE clearing state)
        const params = new URLSearchParams({
          amount: finalAmount,
          type: donationType,
        });
        if (paymentId) {
          params.set("paymentId", paymentId);
        }
        
        // Navigate using window.location for reliable page transition
        const successUrl = `/donation/success?${params.toString()}`;
        console.log("🚀 Navigating to:", successUrl);
        
        // Use window.location.href for full page navigation
        // This ensures the page actually changes instead of just updating the URL
        window.location.href = successUrl;
      } catch (error) {
        console.error("Error processing PayPal payment:", error);
        setIsProcessingPayment(false);
        
        // Create detailed error message - use translated message
        let detailedError = t("donation.form.error.payment");
        
        // Always show helpful error details to help user fix the issue
        if (error instanceof Error) {
          detailedError += `\n\n${language === "de" ? "Fehlerdetails: " : "Error details: "}${error.message}`;
        } else if (typeof error === "object" && error !== null) {
          const errorObj = error as any;
          if (errorObj.message) {
            detailedError += `\n\n${language === "de" ? "Fehlerdetails: " : "Error details: "}${errorObj.message}`;
          } else if (errorObj.error) {
            // Some errors are nested
            detailedError += `\n\n${language === "de" ? "Fehlerdetails: " : "Error details: "}${errorObj.error}`;
          }
        }
        
        showError(detailedError);
      }
    };
    
    return handlePayment();
  };

  const onPayPalError = useCallback((err: any) => {
    console.error("PayPal error:", err);
    
    // Create detailed error message - use translated message
    let detailedError = t("donation.form.error.payment");
    
    // Always show helpful error details to help user fix the issue
    if (err) {
      let errorDetails = "";
      
      // Extract error details from PayPal error object
      if (err.details && Array.isArray(err.details)) {
        // PayPal API errors often have details array
        const details = err.details
          .map((d: any) => {
            // Try to get user-friendly description
            if (d.description) return d.description;
            if (d.message) return d.message;
            if (d.issue) return d.issue;
            return null;
          })
          .filter(Boolean);
        
        if (details.length > 0) {
          errorDetails = details.join(". ");
        }
      } else if (err.message) {
        errorDetails = err.message;
      } else if (typeof err === "string") {
        errorDetails = err;
      }
      
      // Add error details if available
      if (errorDetails) {
        detailedError += `\n\n${language === "de" ? "Fehlerdetails: " : "Error details: "}${errorDetails}`;
      }
    }
    
    setErrorMessage(detailedError);
    setShowErrorDialog(true);
    setIsProcessingPayment(false);
  }, [t, language]);

  // PayPal subscription creation handler for monthly donations
  // Create PayPal subscription using backend to generate dynamic subscription plan
  const createPayPalSubscription = useCallback(async (data: any, actions: any) => {
    console.log("=== Creating PayPal Subscription ===");
    
    // Validate all required fields before creating PayPal subscription
    const finalAmountStr = amount || customAmount;
    
    // Validate amount
    if (!finalAmountStr || parseFloat(finalAmountStr) <= 0) {
      throw new Error(t("donation.form.error.amount"));
    }
    
    // Validate first name
    if (!formData.firstName.trim()) {
      throw new Error(t("donation.form.error.firstName"));
    }
    
    // Validate last name
    if (!formData.lastName.trim()) {
      throw new Error(t("donation.form.error.lastName"));
    }
    
    // Validate email
    if (!formData.email.trim()) {
      throw new Error(t("donation.form.error.email"));
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      throw new Error(t("donation.form.error.emailInvalid"));
    }
    
    // Validate address if receipt is requested
    if (formData.wantsReceipt) {
      if (!formData.street.trim() || !formData.postalCode.trim() || !formData.city.trim() || !formData.country.trim()) {
        throw new Error(t("donation.form.error.address"));
      }
    }
    
    // Validate privacy consent
    if (!formData.privacyConsent) {
      throw new Error(t("donation.form.error.privacy"));
    }
    
    const finalAmount = parseFloat(finalAmountStr);
    
    // Final amount validation
    if (isNaN(finalAmount) || finalAmount <= 0) {
      console.error("Invalid amount for PayPal subscription:", { finalAmount, finalAmountStr });
      throw new Error(t("donation.form.error.amount"));
    }
    
    console.log("Creating PayPal subscription plan via backend with amount:", finalAmount, "EUR");
    
    try {
      // Call backend to create a subscription plan with this specific amount
      const planResult = await paypalService.createSubscriptionPlan({
        amount: finalAmount,
        currency: "EUR",
        donorEmail: formData.email,
        donorName: `${formData.firstName} ${formData.lastName}`,
        metadata: {
          donationType: 'monthly',
          wantsReceipt: formData.wantsReceipt ? 'true' : 'false',
        }
      });
      
      if (!planResult.ok || !planResult.plan_id) {
        throw new Error(planResult.message || planResult.error || "Failed to create subscription plan");
      }
      
      console.log("Subscription plan created successfully:", planResult.plan_id);
      
      // Create the subscription using the plan ID
      return actions.subscription.create({
        plan_id: planResult.plan_id,
        subscriber: {
          name: {
            given_name: formData.firstName,
            surname: formData.lastName,
          },
          email_address: formData.email,
        },
        application_context: {
          brand_name: "Alma Bridge of Hope",
          locale: language === "de" ? "de-DE" : "en-US",
          shipping_preference: "NO_SHIPPING",
          user_action: "SUBSCRIBE_NOW",
          return_url: `${window.location.origin}/donation?success=true&subscription=true`,
          cancel_url: `${window.location.origin}/donation?cancelled=true`,
        },
        custom_id: `monthly-subscription-${Date.now()}`,
      });
    } catch (error) {
      console.error("Error creating PayPal subscription:", error);
      throw error;
    }
  }, [amount, customAmount, formData, t, language]);

  const onPayPalCancel = useCallback(() => {
    console.log("PayPal payment cancelled");
    setIsProcessingPayment(false);
  }, []);


  const content = (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-16">
        {/* 1. Hero Section */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
          <PreloadImage src={heroImage} />
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
              onClick={() => document.getElementById('donation-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
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

        {/* 3. Trust & Transparency */}
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

        {/* 4. Integrated Cart in Form: no separate cart section */}

        {/* 5. Donation Form */}
        <section id="donation-form" className="py-section bg-muted/30">
          <div className="max-w-content mx-auto px-6">
            <div className="max-w-2xl mx-auto">
              <Card className="p-8 shadow-card">
                <div className="text-center mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    {cartState.items.length > 0 ? t("donation.form.completeDonation") : t("donation.form.title")}
                  </h2>
                  {cartState.items.length > 0 && (
                    <p className="text-muted-foreground">
                      {t("donation.form.completeDonationDesc")}
                    </p>
                  )}
                </div>
                
                <div className="space-y-6">
                  {/* Embedded Cart Summary when items exist - only for one-time donations */}
                  {cartState.items.length > 0 && donationType === "one-time" && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-5 h-5 text-primary" />
                          <span className="font-semibold">{t("donation.form.cart")}</span>
                          <Badge variant="secondary">{cartState.totalItems} {t("donation.form.items")}</Badge>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help flex-shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent 
                              className="max-w-xs z-[9999]" 
                              side="top"
                              sideOffset={5}
                            >
                              <p className="text-sm leading-relaxed">
                                {t("donation.itemFlexibility.warning")}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">{t("donation.form.total")}</div>
                          <div className="text-xl font-bold text-primary">
                            {formatCurrency(cartState.totalAmount)}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-auto pr-1">
                        {cartState.items.map((item) => {
                          const isGeneralDonation = item.type === 'general-donation';
                          const isEditing = isGeneralDonation && editingGeneralDonation;
                          
                          return (
                            <div key={item.id} className="flex items-center gap-3 py-3 border-b last:border-b-0">
                              <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 bg-gray-100">
                                {isGeneralDonation ? (
                                  <Heart className="w-4 h-4 text-blue-600" />
                                ) : item.type === 'phase' ? (
                                  getPhaseIcon(item.phase || '')
                                ) : (
                                  <Package className="w-4 h-4 text-gray-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        value={editGeneralDonationValue}
                                        onChange={(e) => setEditGeneralDonationValue(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleSaveGeneralDonation();
                                          } else if (e.key === 'Escape') {
                                            handleCancelEditGeneralDonation();
                                          }
                                        }}
                                        className="h-8 text-sm"
                                        min="1"
                                        step="0.01"
                                        placeholder={t("donation.form.amountPlaceholder")}
                                        autoFocus
                                      />
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={handleSaveGeneralDonation}
                                        className="h-8 px-2"
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleCancelEditGeneralDonation}
                                        className="h-8 px-2"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-1">
                                        <span className="text-sm font-medium truncate">
                                          {isGeneralDonation ? t("donation.form.unrestrictedDonation") : item.name}
                                        </span>
                                        {isGeneralDonation && (
                                          <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                              <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help flex-shrink-0" />
                                            </TooltipTrigger>
                                            <TooltipContent 
                                              className="max-w-xs z-[9999]" 
                                              side="top"
                                              sideOffset={5}
                                            >
                                              <p className="text-sm">
                                                {t("donation.form.generalDonation.info")}
                                              </p>
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                        {!isGeneralDonation && item.description && (
                                          <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                              <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help flex-shrink-0" />
                                            </TooltipTrigger>
                                            <TooltipContent 
                                              className="max-w-xs z-[9999]" 
                                              side="top"
                                              sideOffset={5}
                                            >
                                              <p className="text-sm">{item.description}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold">{formatCurrency(item.totalPrice)}</span>
                                        {isGeneralDonation && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleEditGeneralDonation}
                                            className="h-6 w-6 p-0"
                                            title={t("donation.form.changeAmount")}
                                          >
                                            <Edit2 className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                    {!isGeneralDonation && (
                                      <div className="flex items-center justify-between">
                                        <div className="text-xs text-gray-600">{item.quantity} × {formatCurrency(item.unitPrice)}</div>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="h-6 w-6 p-0"
                                            disabled={item.quantity <= 1 && (item.type === 'phase' || false)}
                                          >
                                            <Minus className="h-3 w-3" />
                                          </Button>
                                          <span className="text-sm font-medium w-8 text-center">
                                            {item.quantity}
                                          </span>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              if (item.maxQuantity && item.quantity < item.maxQuantity) {
                                                updateQuantity(item.id, item.quantity + 1);
                                              } else if (!item.maxQuantity) {
                                                updateQuantity(item.id, item.quantity + 1);
                                              }
                                            }}
                                            disabled={item.type === 'phase' && item.quantity >= 1 || (item.maxQuantity && item.quantity >= item.maxQuantity)}
                                            className="h-6 w-6 p-0"
                                          >
                                            <Plus className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                              {!isEditing && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(item.id)}
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                                  title={t("donation.form.remove")}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {addingGeneralDonation && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-center gap-2 mb-2">
                            <Input
                              type="number"
                              value={newGeneralDonationAmount}
                              onChange={(e) => setNewGeneralDonationAmount(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveNewGeneralDonation();
                                } else if (e.key === 'Escape') {
                                  handleCancelAddGeneralDonation();
                                }
                              }}
                              className="h-8 text-sm"
                              min="1"
                              step="0.01"
                              placeholder={t("donation.form.enterAmount")}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="default"
                              onClick={handleSaveNewGeneralDonation}
                              className="h-8 px-2"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelAddGeneralDonation}
                              className="h-8 px-2"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-blue-600">{t("donation.form.addGeneralDonation")}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Donation Type */}
                  <div>
                    <Label className="text-base font-semibold">{t("donation.form.type")}</Label>
                    <RadioGroup 
                      value={donationType} 
                      onValueChange={(value: "one-time" | "monthly") => {
                        const scrollY = window.scrollY;
                        setDonationType(value);
                        // Prevent scrolling when switching donation type
                        requestAnimationFrame(() => {
                          window.scrollTo(0, scrollY);
                        });
                      }}
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
                    {(() => {
                      // For monthly donations, always show amount selection (no cart items)
                      if (donationType === "monthly") {
                        const amountParam = searchParams.get("amount");
                        const hasUrlAmount = !!amountParam;
                        
                        return (
                          <>
                            {/* Show URL amount if present */}
                            {hasUrlAmount && !hasManualSelection && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md mb-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-blue-700 font-medium">{t("donation.form.preselectAmount")}</span>
                                  <span className="text-lg font-bold text-blue-700">€{amountParam}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Amount selection buttons */}
                            <div className="mt-3">
                              <div className="grid grid-cols-2 gap-3 mb-4">
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
                                  placeholder={t("donation.form.enterAmount")}
                                  value={customAmount}
                                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                                  className="mt-2"
                                  min="1"
                                  step="0.01"
                                />
                              </div>
                            </div>
                          </>
                        );
                      }
                      
                      // For one-time donations
                      const hasCartItems = cartState.items.length > 0;
                      const generalDonation = getGeneralDonation();
                      
                      // If cart has items, show total amount (general donation can be edited in cart)
                      if (hasCartItems) {
                        return (
                          <div className="mt-3 space-y-3">
                            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-green-700 font-medium">{t("donation.form.totalAmount")}</span>
                                <span className="text-xl font-bold text-green-700">
                                  {formatCurrency(cartState.totalAmount)}
                                </span>
                              </div>
                            </div>
                            {!addingGeneralDonation && !editingGeneralDonation && (
                              <Button 
                                variant="outline" 
                                onClick={handleAddGeneralDonation} 
                                className="w-full"
                              >
                                {generalDonation ? t("donation.form.editGeneralDonation") : t("donation.form.addGeneralDonation")}
                              </Button>
                            )}
                            {addingGeneralDonation && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <div className="flex items-center gap-2 mb-2">
                                  <Input
                                    type="number"
                                    value={newGeneralDonationAmount}
                                    onChange={(e) => setNewGeneralDonationAmount(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSaveNewGeneralDonation();
                                      } else if (e.key === 'Escape') {
                                        handleCancelAddGeneralDonation();
                                      }
                                    }}
                                    className="h-8 text-sm"
                                    min="1"
                                    step="0.01"
                                    placeholder={t("donation.form.enterAmount")}
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={handleSaveNewGeneralDonation}
                                    className="h-8 px-2"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCancelAddGeneralDonation}
                                    className="h-8 px-2"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="text-xs text-blue-600">{t("donation.form.addGeneralDonation")}</p>
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      // If no cart items, show amount selection
                      const amountParam = searchParams.get("amount");
                      const hasUrlAmount = !!amountParam;
                      
                      return (
                        <>
                          {/* Show URL amount if present */}
                          {hasUrlAmount && !hasManualSelection && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-blue-700 font-medium">{t("donation.form.preselectAmountArticle")}</span>
                                <span className="text-lg font-bold text-blue-700">€{amountParam}</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Amount selection buttons */}
                          <div className="mt-3">
                            <div className="grid grid-cols-2 gap-3 mb-4">
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
                                placeholder={t("donation.form.enterAmountPlaceholder")}
                                value={customAmount}
                                onChange={(e) => handleCustomAmountChange(e.target.value)}
                                className="mt-2"
                                min="1"
                                step="0.01"
                              />
                            </div>
                          </div>
                        </>
                      );
                    })()}
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
                        {t("donation.form.privacyConsent")}{" "}
                        <Link 
                          to="/privacy" 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t("donation.form.privacyPolicy")}
                        </Link>{" "}
                        {t("donation.form.privacyConsentEnd")}
                      </Label>
                    </div>
                  </div>

                  {/* Newsletter Subscription */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="wantsNewsletter"
                        checked={formData.wantsNewsletter}
                        onCheckedChange={(checked) => handleInputChange("wantsNewsletter", checked as boolean)}
                        className="mt-1"
                      />
                      <Label htmlFor="wantsNewsletter" className="text-sm leading-relaxed">
                        {t("donation.form.wantsNewsletter")}
                      </Label>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">
                      {language === "de" ? "Zahlungsmethode" : "Payment Method"}
                    </Label>
                    <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as typeof paymentMethod)}>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                        <RadioGroupItem value="paypal" id="payment-paypal" />
                        <Label htmlFor="payment-paypal" className="flex-1 cursor-pointer">
                          PayPal
                          </Label>
                        </div>
                      {STRIPE_PUBLISHABLE_KEY && (
                        <>
                          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                            <RadioGroupItem value="stripe-card" id="payment-stripe-card" />
                            <Label htmlFor="payment-stripe-card" className="flex-1 cursor-pointer">
                              {language === "de" ? "Kreditkarte" : "Credit Card"}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                            <RadioGroupItem value="stripe-sepa" id="payment-stripe-sepa" />
                            <Label htmlFor="payment-stripe-sepa" className="flex-1 cursor-pointer">
                              {language === "de" ? "SEPA Lastschrift" : "SEPA Direct Debit"}
                            </Label>
                          </div>
                        </>
                      )}
                    </RadioGroup>
                  </div>

                  {/* Payment UI - Conditional based on selected method */}
                  <div className="w-full relative">
                    {/* PayPal - Support both one-time and recurring payments */}
                    {paymentMethod === "paypal" && PAYPAL_CLIENT_ID && (
                      <div className="w-full relative" key="paypal-buttons">
                        {donationType === "monthly" && !paypalService.isConfigured() ? (
                          <div className="w-full p-6 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-start gap-3">
                              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                  {language === "de" 
                                    ? "PayPal-Backend nicht konfiguriert" 
                                    : "PayPal backend not configured"}
                                </p>
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                  {language === "de"
                                    ? "Für monatliche PayPal-Spenden muss das Backend konfiguriert sein. Bitte verwenden Sie Stripe oder kontaktieren Sie uns."
                                    : "For monthly PayPal donations, the backend must be configured. Please use Stripe or contact us."}
                                </p>
                                <Button
                                  onClick={() => setPaymentMethod("stripe-card")}
                                  variant="outline"
                                  size="sm"
                                  className="mt-2 bg-white dark:bg-gray-900 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                >
                                  {language === "de" ? "Zu Stripe wechseln" : "Switch to Stripe"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <PayPalButtonWrapper
                            createOrder={donationType === "one-time" ? createPayPalOrder : undefined}
                            createSubscription={donationType === "monthly" ? createPayPalSubscription : undefined}
                            onApprove={onPayPalApprove}
                            onError={onPayPalError}
                            onCancel={onPayPalCancel}
                            language={language}
                          />
                        )}
                        {/* Overlay to disable PayPal buttons when dialog is open */}
                        {(showSuccessDialog || showErrorDialog || showWarningDialog) && (
                          <div 
                            className="absolute inset-0 bg-background/90 backdrop-blur-sm z-[60] rounded-md flex items-center justify-center"
                            style={{ 
                              pointerEvents: 'auto',
                              cursor: 'not-allowed'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </div>
                    )}

                    {/* Stripe Card Payment */}
                    {paymentMethod === "stripe-card" && STRIPE_PUBLISHABLE_KEY && (
                      <StripeCheckoutButton
                        amount={
                          donationType === "monthly"
                            ? parseFloat(amount || customAmount || "0")
                            : (cartState.items.length > 0 
                                ? cartState.totalAmount 
                                : parseFloat(amount || customAmount || "0"))
                        }
                        onRedirect={() => setIsProcessingPayment(true)}
                        onError={(error) => showError(error)}
                        language={language}
                        paymentMethodTypes={['card']}
                        formData={{
                          firstName: formData.firstName,
                          lastName: formData.lastName,
                          email: formData.email,
                        }}
                        metadata={{
                          donationType,
                          donorEmail: formData.email,
                          donorName: `${formData.firstName} ${formData.lastName}`,
                        }}
                        isSubscription={donationType === "monthly"}
                        onValidate={() => {
                          // Basic validation
                          if (!formData.firstName){
                            showError(t("donation.form.error.firstName"));
                            return false;
                          }
                          if (!formData.lastName) {
                            showError(t("donation.form.error.lastName"));
                            return false;
                          }
                          if (!formData.email) {
                            showError(t("donation.form.error.email"));
                            return false;
                          }
                          if (!formData.privacyConsent) {
                            showError(t("donation.form.error.privacy"));
                            return false;
                          }
                          const finalAmount = donationType === "monthly"
                            ? parseFloat(amount || customAmount || "0")
                            : (cartState.items.length > 0 
                                ? cartState.totalAmount 
                                : parseFloat(amount || customAmount || "0"));
                          if (finalAmount <= 0) {
                            showError(t("donation.form.error.missingAmount"));
                            return false;
                          }
                          return true;
                        }}
                      />
                    )}

                    {/* Stripe SEPA Payment */}
                    {paymentMethod === "stripe-sepa" && STRIPE_PUBLISHABLE_KEY && (
                      <StripeCheckoutButton
                        amount={
                          donationType === "monthly"
                            ? parseFloat(amount || customAmount || "0")
                            : (cartState.items.length > 0 
                                ? cartState.totalAmount 
                                : parseFloat(amount || customAmount || "0"))
                        }
                        onRedirect={() => setIsProcessingPayment(true)}
                        onError={(error) => showError(error)}
                        language={language}
                        paymentMethodTypes={['sepa_debit']}
                        formData={{
                          firstName: formData.firstName,
                          lastName: formData.lastName,
                          email: formData.email,
                        }}
                        metadata={{
                          donationType,
                          donorEmail: formData.email,
                          donorName: `${formData.firstName} ${formData.lastName}`,
                        }}
                        isSubscription={donationType === "monthly"}
                        onValidate={() => {
                          // Basic validation
                          if (!formData.firstName) {
                            showError(t("donation.form.error.firstName"));
                            return false;
                          }
                          if (!formData.lastName) {
                            showError(t("donation.form.error.lastName"));
                            return false;
                          }
                          if (!formData.email) {
                            showError(t("donation.form.error.email"));
                            return false;
                          }
                          if (!formData.privacyConsent) {
                            showError(t("donation.form.error.privacy"));
                            return false;
                          }
                          const finalAmount = donationType === "monthly"
                            ? parseFloat(amount || customAmount || "0")
                            : (cartState.items.length > 0 
                                ? cartState.totalAmount 
                                : parseFloat(amount || customAmount || "0"));
                          if (finalAmount <= 0) {
                            showError(t("donation.form.error.missingAmount"));
                            return false;
                          }
                          return true;
                        }}
                      />
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* 4. Transparency Commitment */}
        <section className="py-section bg-muted/30">
          <div className="max-w-content mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {t("donation.transparency.title")}
                </h2>
              </div>
              <div className="space-y-8">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t("donation.transparency.intro")}
                </p>
                
                <div className="grid md:grid-cols-1 gap-6">
                  <Card className="p-6 shadow-card">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-3">
                          {t("donation.transparency.coordination.title")}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {t("donation.transparency.coordination.desc")}
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-6 shadow-card">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                        <Shield className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-3">
                          {t("donation.transparency.financial.title")}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {t("donation.transparency.financial.desc")}
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-6 shadow-card">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                        <Info className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-3">
                          {t("donation.transparency.tracking.title")}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {t("donation.transparency.tracking.desc")}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
                
                <Card className="p-6 shadow-card">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                        <Info className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-3">
                          {t("donation.transparency.communication.title")}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {t("donation.transparency.communication.desc")}
                        </p>
                      </div>
                    </div>
                  </Card>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Community Photo & Quote */}
        <section className="py-section bg-muted/30 relative z-0 overflow-hidden">
          <div className="max-w-content mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden shadow-lg">
                  <OptimizedImage
                    src={communityImage} 
                    alt="Community in Uganda" 
                    className="w-full h-full object-cover object-center"
                    lazy={true}
                  />
                </div>
                <div className="text-center md:text-left flex flex-col justify-center">
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
        <section className="py-section bg-background relative z-10">
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
                <AccordionItem value="item-5" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left">
                    {t("donation.faq.q5")}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t("donation.faq.a5")}
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
                <Button asChild variant="outline" size="lg">
                  <a href={`mailto:${t("donation.contact.email")}`}>
                    {t("donation.contact.email")}
                  </a>
                </Button>
                <Button 
                  size="lg"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('[Donation] Contact button clicked');
                    console.log('[Donation] Current location:', window.location.href);
                    console.log('[Donation] Current pathname:', window.location.pathname);
                    
                    // Clear any stale redirect paths
                    sessionStorage.removeItem('404-redirect-path');
                    
                    // On donation page, React Router navigation seems unreliable
                    // Use window.location.replace() for guaranteed navigation without history entry
                    // This ensures the page actually navigates, not just changes URL
                    try {
                      console.log('[Donation] Attempting navigation with window.location.replace');
                      window.location.replace('/contact');
                      console.log('[Donation] window.location.replace() called');
                    } catch (error) {
                      console.error('[Donation] Navigation error:', error);
                      // Fallback: try window.location.href
                      window.location.href = '/contact';
                    }
                  }}
                >
                  {t("donation.contact.button")}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
      
      {/* Warning Dialog */}
      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              {t("donation.warning.title")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed">
              {t("donation.warning.message")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowWarningDialog(false)}>
              {t("donation.warning.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowWarningDialog(false)}>
              {t("donation.warning.continue")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="sm:max-w-[500px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-green-900 dark:text-green-100">
                {language === "de" ? "Spende erfolgreich!" : "Donation Successful!"}
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed pt-4 whitespace-pre-line">
              {successMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => {
                setShowSuccessDialog(false);
                // Scroll to top after closing
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            >
              {language === "de" ? "Verstanden" : "Got it"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent className="sm:max-w-[550px]">
          <AlertDialogHeader>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 space-y-2">
                <AlertDialogTitle className="text-xl font-semibold text-red-900 dark:text-red-100">
                  {language === "de" ? "Fehler aufgetreten" : "An Error Occurred"}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base leading-relaxed text-foreground pt-2 whitespace-pre-line">
                  {errorMessage}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setShowErrorDialog(false)}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            >
              {language === "de" ? "Verstanden" : "Got it"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  // Return content directly - PayPalScriptProvider is now only wrapping the PayPal buttons
  // This prevents interference with React Router navigation and browser back/forward
  return content;
};

export default Donation;

