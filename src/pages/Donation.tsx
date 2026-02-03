import { useEffect, useState, useCallback, useRef, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Heart, Shield, CheckCircle, Mail, CreditCard, Banknote, ShoppingCart, Package, Sprout, Droplets, Wheat, Trash2, Plus, Minus, Edit2, Check, X, Info, HelpCircle, BrickWall, Layers, Zap, Toilet, Sofa, Paintbrush, Copy, CheckCircle2, AlertCircle, Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShoppingCart } from "@/contexts/ShoppingCartContext";
import { donationWebhookService } from "@/services/donationWebhookService";
import { stripeService } from "@/services/stripeService";
import { paypalService } from "@/services/paypalService";
import heroImage from "@/assets/nature/nature_2.webp";
import communityImage from "@/assets/community/community_2.webp";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";

// PayPal Configuration - Select Client ID based on environment
const VITE_STAGE = import.meta.env.VITE_STAGE || "local";
const PAYPAL_CLIENT_ID = VITE_STAGE === 'prod' 
  ? import.meta.env.VITE_PAYPAL_LIVE_CLIENT_ID 
  : import.meta.env.VITE_PAYPAL_SANDBOX_CLIENT_ID;

// Diagnostic: Log which Client ID is loaded and from which environment
if (typeof window !== 'undefined') {
  const clientIdPreview = PAYPAL_CLIENT_ID ? `${PAYPAL_CLIENT_ID.substring(0, 10)}...` : "NOT SET";
  const mode = import.meta.env.MODE || "development";
  const sandboxId = import.meta.env.VITE_PAYPAL_SANDBOX_CLIENT_ID;
  const liveId = import.meta.env.VITE_PAYPAL_LIVE_CLIENT_ID;
  console.log("🔍 PayPal Environment Variable Diagnostics:");
  console.log("   VITE_STAGE:", VITE_STAGE);
  console.log("   MODE:", mode);
  console.log("   Using Client ID:", VITE_STAGE === 'prod' ? 'LIVE' : 'SANDBOX');
  console.log("   Frontend Client ID (first 10 chars):", clientIdPreview);
  console.log("   Full Client ID length:", PAYPAL_CLIENT_ID ? PAYPAL_CLIENT_ID.length : 0);
  console.log("   VITE_PAYPAL_SANDBOX_CLIENT_ID:", sandboxId ? `${sandboxId.substring(0, 10)}...` : "NOT SET");
  console.log("   VITE_PAYPAL_LIVE_CLIENT_ID:", liveId ? `${liveId.substring(0, 10)}...` : "NOT SET");
  console.log("");
  console.log("📋 Vite Environment File Loading Priority:");
  console.log("   1. .env.local (highest priority - used for local development)");
  console.log("   2. .env");
  console.log("   → If both exist, .env.local takes precedence");
  console.log("");
  console.log("⚠️ IMPORTANT: If Client ID doesn't match backend:");
  console.log("   1. For local: Ensure VITE_PAYPAL_SANDBOX_CLIENT_ID matches PAYPAL_SANDBOX_CLIENT_ID in Google Apps Script");
  console.log("   2. For production: Ensure VITE_PAYPAL_LIVE_CLIENT_ID matches PAYPAL_LIVE_CLIENT_ID in Google Apps Script");
  console.log("   3. RESTART the dev server (npm run dev) after changing .env files");
  console.log("   4. Vite only loads environment variables at startup, not during hot reload");
  if (VITE_STAGE !== 'prod' && clientIdPreview !== "NOT SET" && !clientIdPreview.startsWith("AfPOv616xW")) {
    console.warn("   ⚠️ MISMATCH DETECTED! Frontend Sandbox Client ID doesn't match expected backend ID.");
    console.warn("   → Update VITE_PAYPAL_SANDBOX_CLIENT_ID in .env.local to match backend Client ID");
    console.warn("   → Then restart the dev server: npm run dev");
  }
}

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
  // PayPal SDK requires ONLY one of createOrder or createSubscription, not both
  if (createSubscription) {
    console.log("🔵 PayPal Button: Using createSubscription for monthly payment");
    buttonProps.createSubscription = createSubscription;
  } else if (createOrder) {
    console.log("🟢 PayPal Button: Using createOrder for one-time payment");
    buttonProps.createOrder = createOrder;
  } else {
    console.warn("⚠️ PayPal Button: Neither createSubscription nor createOrder provided!");
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
  
  // Determine PayPal environment based on VITE_STAGE
  // PayPal SDK auto-detects from Client ID, but we can be explicit
  const paypalEnv = import.meta.env.VITE_STAGE === 'prod' ? 'production' : 'sandbox';

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
        // Explicitly set environment (though SDK auto-detects from Client ID)
        // This ensures consistency with backend environment
        ...(import.meta.env.VITE_STAGE === 'prod' ? {} : { "data-env": "sandbox" }),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Note: Navigation links are now handled directly in the Navigation component
  // using explicit onClick handlers when on the donation page to bypass PayPal SDK interception.
  
  // Component state
  const [searchParams, setSearchParams] = useSearchParams();
  const [donationType, setDonationType] = useState<"one-time" | "monthly">("one-time");
  
  // Debug: Log donation type changes (only when it changes, not on every render)
  useEffect(() => {
    console.log("🎯 Donation Type Changed:", donationType);
    console.log("🎯 PayPal Button Config - createSubscription:", donationType === "monthly" ? "SET" : "NOT SET", "createOrder:", donationType === "one-time" ? "SET" : "NOT SET");
  }, [donationType]);
  
  const [amount, setAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "stripe-card" | "stripe-sepa">("stripe-sepa");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  // Ref to track if we've already handled cancellation to prevent showing error multiple times
  const cancellationHandledRef = useRef(false);
  
  // Helper functions to show dialogs
  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    setShowErrorDialog(true);
  }, []);
  
  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setShowSuccessDialog(true);
  }, []);

  // Helper function to get the current donation amount
  const getCurrentAmount = useCallback((): string => {
    if (donationType === "monthly") {
      return amount || customAmount || "";
    } else {
      // For one-time donations, prefer cart total if items exist
      if (cartState.items.length > 0) {
        return cartState.totalAmount.toString();
      }
      return amount || customAmount || "";
    }
  }, [donationType, amount, customAmount, cartState.items.length, cartState.totalAmount]);

  // Helper function to check if a valid amount is selected
  const hasValidAmount = useCallback((): boolean => {
    const currentAmount = getCurrentAmount();
    return currentAmount !== "" && !isNaN(parseFloat(currentAmount)) && parseFloat(currentAmount) > 0;
  }, [getCurrentAmount]);
  
  // Handle success and cancellation redirects from PayPal and Stripe return URLs
  useEffect(() => {
    const success = searchParams.get("success");
    const cancelled = searchParams.get("cancelled");
    const stripeStatus = searchParams.get("stripe");
    const sessionId = searchParams.get("session_id");
    const flow = searchParams.get("flow");
    const source = searchParams.get("source");
    const isMembershipFlow = flow === "membership" || source === "membership";

    // Ensure we're on the donation page - if we have cancellation params but we're not on /donation, redirect there
    if ((cancelled === "true" || stripeStatus === "cancelled") && window.location.pathname !== '/donation') {
      console.log('[Donation] Redirecting to donation page with cancellation params');
      navigate(`/donation?${stripeStatus === "cancelled" ? 'stripe=cancelled' : 'cancelled=true'}`, { replace: true });
      return;
    }

    // Handle PayPal success redirect
    if (success === "true") {
      // Reset cancellation ref when handling success
      cancellationHandledRef.current = false;
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
        if (isMembershipFlow) {
          params.set("flow", "membership");
          params.set("source", source || "membership");
          navigate(`/membership/success?${params.toString()}`);
        } else {
          navigate(`/donation/success?${params.toString()}`);
        }
      } else {
        // If no amount, just redirect to success page
        if (isMembershipFlow) {
          navigate("/membership/success?flow=membership&source=membership");
        } else {
          navigate("/donation/success");
        }
      }
      return;
    }
    
    // Handle PayPal/Stripe cancellation - just clear URL parameters, no error message
    if ((cancelled === "true" || stripeStatus === "cancelled") && !cancellationHandledRef.current) {
      // Mark as handled to prevent processing multiple times
      cancellationHandledRef.current = true;
      
      // Clear the URL parameters and return to the page silently
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("cancelled");
      newSearchParams.delete("stripe");
      setSearchParams(newSearchParams, { replace: true });
      
      // Reset ref after a short delay to allow for future cancellations
      setTimeout(() => {
        cancellationHandledRef.current = false;
      }, 100);
      return;
    }
    
    // Handle Stripe success redirect
    if (stripeStatus === "success" && sessionId) {
      // Reset cancellation ref when handling success
      cancellationHandledRef.current = false;
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
          
          // DON'T clear cart here - it will be cleared in DonationSuccess.tsx after successful webhook
          // The cart items are needed in DonationSuccess to send to the webhook
          
          navigate(`/donation/success?${params.toString()}`);
        })
        .catch((error) => {
          console.error("Failed to retrieve Stripe session details:", error);
          // Still redirect to success page even if we can't get details
          navigate("/donation/success");
        });
    }
  }, [searchParams, setSearchParams, navigate, cartState.items.length, cartState.totalAmount, amount, customAmount, donationType, clearCart, language, showError]);
  
  const [formData, setFormData] = useState({
    salutation: "",
    firstName: "",
    lastName: "",
    email: "",
    isGift: false,
    giftRecipientName: "",
    giftRecipientEmail: "",
    street: "",
    postalCode: "",
    city: "",
    country: "",
    comment: "",
    wantsReceipt: false,
    privacyConsent: false,
    wantsNewsletter: false,
  });

  // Use ref to track latest formData for PayPal validation
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Use ref to track latest amount values for PayPal validation (to avoid closure issues)
  const amountRef = useRef({ amount, customAmount, donationType });
  amountRef.current = { amount, customAmount, donationType };

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
      [field]: value,
      ...(field === "isGift" && value === false
        ? { giftRecipientName: "", giftRecipientEmail: "" }
        : {})
    }));
  };

  const sendGiftEmail = async (params: {
    recipientName: string;
    recipientEmail: string;
    donorName: string;
    donorEmail: string;
    amount: string;
    donationType: "one-time" | "monthly";
  }) => {
    try {
      const serviceId = "service_wou9sst";
      const templateId = "template_eqc74jo";
      const publicKey = "zxPupF44hCueD6u4K";

      const subject = t("donation.giftEmail.subject");
      const greeting = `${t("donation.giftEmail.greeting")} ${params.recipientName},`;
      const bodyLines = [
        greeting,
        "",
        t("donation.giftEmail.body"),
        "",
        `${t("donation.giftEmail.details.donor")} ${params.donorName} (${params.donorEmail})`,
        `${t("donation.giftEmail.details.amount")} ${params.amount}`,
        `${t("donation.giftEmail.details.type")} ${
          params.donationType === "monthly"
            ? t("donation.giftEmail.details.type.monthly")
            : t("donation.giftEmail.details.type.onetime")
        }`,
        "",
        t("donation.giftEmail.closing"),
        t("donation.giftEmail.signature"),
      ];

      await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: params.donorName,
          from_email: params.donorEmail,
          subject,
          message: bodyLines.join("\n"),
          to_email: params.recipientEmail,
          reply_to: params.donorEmail,
        },
        publicKey
      );
      console.log("✅ Gift email sent to recipient");
    } catch (error) {
      console.error("❌ Failed to send gift email:", error);
    }
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

    if (formData.isGift) {
      if (!formData.giftRecipientName.trim()) {
        showError(t("donation.form.error.giftRecipientName"));
        return false;
      }
      if (!formData.giftRecipientEmail.trim()) {
        showError(t("donation.form.error.giftRecipientEmail"));
        return false;
      }
      const giftEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!giftEmailRegex.test(formData.giftRecipientEmail)) {
        showError(t("donation.form.error.giftRecipientEmailInvalid"));
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
        donorSalutation: formData.salutation || undefined,
        paymentId: paymentId,
        paymentStatus: 'paid', // PayPal payments are always 'paid' when we reach this point
        wantsReceipt: formData.wantsReceipt,
        isGift: formData.isGift,
        giftRecipientName: formData.isGift ? formData.giftRecipientName || undefined : undefined,
        giftRecipientEmail: formData.isGift ? formData.giftRecipientEmail || undefined : undefined,
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
    const finalAmountStr = getCurrentAmount();

    // Validate amount
    if (!finalAmountStr || parseFloat(finalAmountStr) <= 0) {
      throw new Error(t("donation.form.error.amount"));
    }

    // Get current formData from ref to ensure we have the latest values
    const currentFormData = formDataRef.current;

    // Validate first name - add debug logging
    console.log('PayPal validation - firstName:', currentFormData.firstName, 'trimmed:', currentFormData.firstName?.trim());
    if (!currentFormData.firstName || !currentFormData.firstName.trim()) {
      console.error('PayPal validation failed: firstName is empty or whitespace only');
      throw new Error(t("donation.form.error.firstName"));
    }

    // Validate last name
    if (!currentFormData.lastName || !currentFormData.lastName.trim()) {
      throw new Error(t("donation.form.error.lastName"));
    }

    // Validate email
    if (!currentFormData.email || !currentFormData.email.trim()) {
      throw new Error(t("donation.form.error.email"));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentFormData.email)) {
      throw new Error(t("donation.form.error.emailInvalid"));
    }

    // Validate address if receipt is requested
    if (currentFormData.wantsReceipt) {
      if (!currentFormData.street?.trim() || !currentFormData.postalCode?.trim() || !currentFormData.city?.trim() || !currentFormData.country?.trim()) {
        throw new Error(t("donation.form.error.address"));
      }
    }

    if (currentFormData.isGift) {
      if (!currentFormData.giftRecipientName?.trim()) {
        throw new Error(t("donation.form.error.giftRecipientName"));
      }
      if (!currentFormData.giftRecipientEmail?.trim()) {
        throw new Error(t("donation.form.error.giftRecipientEmail"));
      }
      const giftEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!giftEmailRegex.test(currentFormData.giftRecipientEmail)) {
        throw new Error(t("donation.form.error.giftRecipientEmailInvalid"));
      }
    }

    // Validate privacy consent
    if (!currentFormData.privacyConsent) {
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

    const salutation = currentFormData.salutation || "none";
    const customId = `${donationType}-${Date.now()}|salutation:${salutation}`;
    
    return actions.order.create({
      purchase_units: [{
        amount: {
          currency_code: "EUR",
          value: formattedAmount,
        },
        description: `${donationType === "one-time" ? t("donation.form.onetime") : t("donation.form.monthly")} donation to Alma Bridge of Hope`,
        custom_id: customId,
      }],
        application_context: {
          brand_name: "Alma Bridge of Hope",
          landing_page: "LOGIN",
          user_action: "PAY_NOW",
          cancel_url: `${window.location.origin}/donation?cancelled=true`,
        },
    });
  }, [getCurrentAmount, t, language, formData]);

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
      if (formDataRef.current.salutation) {
        formData.append('salutation', formDataRef.current.salutation);
      }

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
          console.log("Full PayPal data object:", JSON.stringify(data, null, 2));
          
          // PayPal Subscription IDs start with "I-"
          // Check if subscriptionID exists and has the correct format
          paymentId = data.subscriptionID || data.subscription_id || data.id;
          
          // Log all possible subscription ID fields for debugging
          console.log("Possible subscription ID fields:", {
            subscriptionID: data.subscriptionID,
            subscription_id: data.subscription_id,
            id: data.id,
            orderID: data.orderID,
            order_id: data.order_id
          });
          
          details = { 
            id: paymentId, 
            status: 'ACTIVE',
            subscription_id: paymentId
          };
          console.log("PayPal subscription ID (final):", paymentId);
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

        if (formData.isGift && formData.giftRecipientEmail && formData.giftRecipientName) {
          const amountLabel = formatCurrency(parseFloat(finalAmount || "0"));
          await sendGiftEmail({
            recipientName: formData.giftRecipientName,
            recipientEmail: formData.giftRecipientEmail,
            donorName: `${formData.firstName} ${formData.lastName}`.trim(),
            donorEmail: formData.email,
            amount: amountLabel,
            donationType,
          });
        }

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
    
    // Check if this is a Client ID mismatch error (thrown by createPayPalSubscription)
    if (err?.isClientIdMismatch || err?.message?.includes("Client ID mismatch") || err?.message?.includes("Client-ID stimmt nicht")) {
      const clientIdMismatchMessage = language === "de"
        ? "❌ PayPal Client-ID stimmt nicht überein!\n\n" +
          "Die Frontend PayPal Client-ID stimmt nicht mit der Backend PayPal Client-ID überein.\n\n" +
          "Bitte prüfen Sie:\n" +
          "1. Browser-Konsole für detaillierte Client-ID-Vergleiche\n" +
          "2. VITE_PAYPAL_SANDBOX_CLIENT_ID (für local) oder VITE_PAYPAL_LIVE_CLIENT_ID (für prod) in Ihrer .env-Datei\n" +
          "3. PAYPAL_SANDBOX_CLIENT_ID oder PAYPAL_LIVE_CLIENT_ID in Google Apps Script\n" +
          "4. Beide müssen von derselben PayPal-App im Developer Portal stammen\n\n" +
          "Dies ist die häufigste Ursache für 404-Fehler bei Abonnements."
        : "❌ PayPal Client ID mismatch!\n\n" +
          "The frontend PayPal Client ID does not match the backend PayPal Client ID.\n\n" +
          "Please check:\n" +
          "1. Browser console for detailed Client ID comparisons\n" +
          "2. VITE_PAYPAL_SANDBOX_CLIENT_ID (for local) or VITE_PAYPAL_LIVE_CLIENT_ID (for prod) in your .env file\n" +
          "3. PAYPAL_SANDBOX_CLIENT_ID or PAYPAL_LIVE_CLIENT_ID in Google Apps Script\n" +
          "4. Both must be from the same PayPal app in the Developer Portal\n\n" +
          "This is the most common cause of 404 errors for subscriptions.";
      showError(clientIdMismatchMessage);
      setIsProcessingPayment(false);
      return;
    }
    
    // Check if this is a subscription-related 404 error (Subscriptions not activated)
    const isSubscription404 = donationType === "monthly" && (
      err?.status === 404 ||
      err?.response?.status === 404 ||
      err?.message?.includes("404") ||
      err?.message?.includes("RESOURCE_NOT_FOUND") ||
      err?.message?.includes("Not Found") ||
      (err?.details && Array.isArray(err.details) && err.details.some((d: any) => 
        d.issue === "RESOURCE_NOT_FOUND" || 
        d.description?.includes("RESOURCE_NOT_FOUND") ||
        d.description?.includes("Not Found")
      ))
    );
    
    // Create detailed error message - use translated message
    let detailedError = t("donation.form.error.payment");
    
    // Special handling for subscription 404 errors
    if (isSubscription404) {
      const subscriptionErrorMessage = language === "de"
        ? "\n\n⚠️ WICHTIG: PayPal-Abonnement konnte nicht erstellt werden (404 Fehler).\n\n" +
          "Bitte prüfen Sie die Browser-Konsole für detaillierte Diagnose-Informationen.\n\n" +
          "Mögliche Ursachen (in Reihenfolge der Wahrscheinlichkeit):\n\n" +
          "1. Client-ID stimmt nicht überein (SEHR HÄUFIG):\n" +
          "   → Die Frontend PayPal Client-ID muss mit der Backend PayPal Client-ID übereinstimmen\n" +
          "   → Frontend verwendet: VITE_PAYPAL_CLIENT_ID aus Ihrer .env-Datei\n" +
          "   → Backend verwendet: VITE_PAYPAL_SANDBOX_CLIENT_ID oder VITE_PAYPAL_LIVE_CLIENT_ID in Google Apps Script\n" +
          "   → Beide müssen von derselben PayPal-App im Developer Portal stammen\n" +
          "   → Prüfen Sie die Browser-Konsole für einen Client-ID-Vergleich\n" +
          "   → Prüfen Sie, dass Sie Sandbox-Credentials zum Testen und Live-Credentials für Produktion verwenden\n\n" +
          "2. Abonnements nicht aktiviert:\n" +
          "   PayPal-Abonnements müssen in Ihrem PayPal-Geschäftskonto aktiviert werden.\n" +
          "   → Sandbox: https://www.sandbox.paypal.com/billing/plans\n" +
          "   → Live: https://www.paypal.com/billing/plans\n" +
          "   → Klicken Sie auf 'Plan erstellen', erstellen Sie einen beliebigen Plan und aktivieren Sie ihn\n" +
          "   → Dies aktiviert die Abonnementfunktion für Ihr Konto\n\n" +
          "3. Subscriptions API nicht aktiviert:\n" +
          "   → Prüfen Sie im PayPal Developer Portal (https://developer.paypal.com/)\n" +
          "   → My Apps & Credentials → Ihre App → API-Berechtigungen\n" +
          "   → Stellen Sie sicher, dass 'Subscriptions' aktiviert ist\n\n" +
          "4. Plan noch nicht verfügbar:\n" +
          "   → Der Plan wurde erstellt, aber PayPal braucht manchmal mehrere Sekunden, um ihn verfügbar zu machen\n" +
          "   → Das System hat bereits mehrere Versuche unternommen\n" +
          "   → Versuchen Sie es in ein paar Sekunden erneut oder kontaktieren Sie den Support\n\n" +
          "Einmalige Zahlungen funktionieren ohne diese Aktivierung, aber monatliche Abonnements erfordern sie."
        : "\n\n⚠️ IMPORTANT: PayPal subscription could not be created (404 error).\n\n" +
          "Please check the browser console for detailed diagnostic information.\n\n" +
          "Possible causes (in order of likelihood):\n\n" +
          "1. Client ID mismatch (VERY COMMON):\n" +
          "   → The frontend PayPal Client ID must match the backend PayPal Client ID\n" +
          "   → Frontend uses: VITE_PAYPAL_CLIENT_ID from your .env file\n" +
          "   → Backend uses: VITE_PAYPAL_SANDBOX_CLIENT_ID or VITE_PAYPAL_LIVE_CLIENT_ID in Google Apps Script\n" +
          "   → Both must be from the same PayPal app in the Developer Portal\n" +
          "   → Check the browser console for Client ID comparison\n" +
          "   → Check that you're using sandbox credentials for testing and live for production\n\n" +
          "2. Subscriptions not activated:\n" +
          "   PayPal subscriptions need to be activated in your PayPal business account.\n" +
          "   → Sandbox: https://www.sandbox.paypal.com/billing/plans\n" +
          "   → Live: https://www.paypal.com/billing/plans\n" +
          "   → Click 'Create Plan', create any plan, and activate it\n" +
          "   → This activates the subscription feature for your account\n\n" +
          "3. Subscriptions API not enabled:\n" +
          "   → Check in the PayPal Developer Portal (https://developer.paypal.com/)\n" +
          "   → My Apps & Credentials → Your App → API Permissions\n" +
          "   → Ensure 'Subscriptions' is enabled\n\n" +
          "4. Plan not yet available:\n" +
          "   → The plan was created, but PayPal sometimes needs several seconds to make it available\n" +
          "   → The system has already made multiple attempts\n" +
          "   → Try again in a few seconds or contact support\n\n" +
          "One-time payments work without this activation, but monthly subscriptions require it.";
      
      detailedError += subscriptionErrorMessage;
    } else {
      // Regular error handling for other errors
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
    }
    
    setErrorMessage(detailedError);
    setShowErrorDialog(true);
    setIsProcessingPayment(false);
  }, [t, language, donationType]);

  // PayPal subscription creation handler for monthly donations
  // Create PayPal subscription using backend to generate dynamic subscription plan
  const createPayPalSubscription = useCallback(async (data: any, actions: any) => {
    console.log("=== Creating PayPal Subscription ===");
    console.log("🔵 createPayPalSubscription called with data:", data);
    console.log("🔵 createPayPalSubscription called with actions:", actions);

    // Use ref to get latest amount values (avoids closure issues)
    const currentAmountData = amountRef.current;
    console.log("Current amount data from ref:", currentAmountData);

    // Get amount from ref (for monthly donations)
    let finalAmountStr = "";
    if (currentAmountData.donationType === "monthly") {
      finalAmountStr = currentAmountData.amount || currentAmountData.customAmount || "";
    } else {
      // This shouldn't happen for subscriptions, but handle it anyway
      finalAmountStr = currentAmountData.amount || currentAmountData.customAmount || "";
    }

    console.log("Final amount string:", finalAmountStr);

    // Validate amount
    if (!finalAmountStr || finalAmountStr.trim() === "" || parseFloat(finalAmountStr) <= 0 || isNaN(parseFloat(finalAmountStr))) {
      console.error("Amount validation failed:", { 
        finalAmountStr, 
        parsed: parseFloat(finalAmountStr),
        amountFromRef: currentAmountData.amount,
        customAmountFromRef: currentAmountData.customAmount,
        donationTypeFromRef: currentAmountData.donationType
      });
      throw new Error(t("donation.form.error.amount"));
    }

    // Get current formData from ref to ensure we have the latest values
    const currentFormData = formDataRef.current;

    // Validate first name - add debug logging
    console.log('PayPal subscription validation - firstName:', currentFormData.firstName, 'trimmed:', currentFormData.firstName?.trim());
    if (!currentFormData.firstName || !currentFormData.firstName.trim()) {
      console.error('PayPal subscription validation failed: firstName is empty or whitespace only');
      throw new Error(t("donation.form.error.firstName"));
    }

    // Validate last name
    if (!currentFormData.lastName || !currentFormData.lastName.trim()) {
      throw new Error(t("donation.form.error.lastName"));
    }

    // Validate email
    if (!currentFormData.email || !currentFormData.email.trim()) {
      throw new Error(t("donation.form.error.email"));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentFormData.email)) {
      throw new Error(t("donation.form.error.emailInvalid"));
    }

    // Validate address if receipt is requested
    if (currentFormData.wantsReceipt) {
      if (!currentFormData.street?.trim() || !currentFormData.postalCode?.trim() || !currentFormData.city?.trim() || !currentFormData.country?.trim()) {
        throw new Error(t("donation.form.error.address"));
      }
    }

    if (currentFormData.isGift) {
      if (!currentFormData.giftRecipientName?.trim()) {
        throw new Error(t("donation.form.error.giftRecipientName"));
      }
      if (!currentFormData.giftRecipientEmail?.trim()) {
        throw new Error(t("donation.form.error.giftRecipientEmail"));
      }
      const giftEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!giftEmailRegex.test(currentFormData.giftRecipientEmail)) {
        throw new Error(t("donation.form.error.giftRecipientEmailInvalid"));
      }
    }

    // Validate privacy consent
    if (!currentFormData.privacyConsent) {
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
        donorEmail: currentFormData.email,
        donorName: `${currentFormData.firstName} ${currentFormData.lastName}`,
        metadata: {
          donationType: 'monthly',
          wantsReceipt: currentFormData.wantsReceipt ? 'true' : 'false',
          donor_salutation: currentFormData.salutation || "",
          giftDonation: currentFormData.isGift ? "true" : "false",
          giftRecipientName: currentFormData.giftRecipientName || "",
          giftRecipientEmail: currentFormData.giftRecipientEmail || "",
        }
      });
      
      if (!planResult.ok || !planResult.plan_id) {
        throw new Error(planResult.message || planResult.error || "Failed to create subscription plan");
      }
      
      // Validate plan_id format (PayPal plan IDs start with "P-")
      if (!planResult.plan_id.startsWith("P-")) {
        console.error("⚠️ Invalid plan_id format:", planResult.plan_id);
        throw new Error(`Invalid plan ID format: ${planResult.plan_id}. PayPal plan IDs should start with "P-"`);
      }
      
      console.log("✅ Subscription plan created successfully:", planResult.plan_id);
      console.log("📋 Plan details:", {
        plan_id: planResult.plan_id,
        amount: planResult.amount,
        currency: planResult.currency,
        status: "ACTIVE (should be immediately available)"
      });
      
      // Diagnostic: Log Client ID being used (first 10 chars for security)
      const clientIdPreview = PAYPAL_CLIENT_ID ? `${PAYPAL_CLIENT_ID.substring(0, 10)}...` : "NOT SET";
      const currentStage = import.meta.env.VITE_STAGE || "local";
      console.log("🔑 PayPal Client ID (frontend):", clientIdPreview);
      console.log("🌍 PayPal Environment (frontend):", currentStage, currentStage === 'prod' ? '(LIVE)' : '(SANDBOX)');
      console.log("📋 Plan ID created:", planResult.plan_id);
      
      // CRITICAL: Verify backend Client ID matches frontend (for debugging)
      // This is the most common cause of 404 errors
      let clientIdMismatch = false;
      try {
        console.log("🔍 Checking backend Client ID and environment...");
        const backendDiagnostic = await paypalService.getDiagnosticInfo();
        if (backendDiagnostic.ok && backendDiagnostic.diagnostic) {
          const backendClientIdPreview = backendDiagnostic.diagnostic.client_id_preview || "UNKNOWN";
          const backendStage = backendDiagnostic.diagnostic.stage || "unknown";
          const backendApiBase = backendDiagnostic.diagnostic.api_base || "unknown";
          
          console.log("🔑 PayPal Client ID (backend):", backendClientIdPreview);
          console.log("🌍 PayPal Environment (backend):", backendStage, backendStage === 'prod' ? '(LIVE)' : '(SANDBOX)');
          console.log("🌐 PayPal API Base (backend):", backendApiBase);
          
          // Compare first 10 characters
          const frontendPrefix = PAYPAL_CLIENT_ID ? PAYPAL_CLIENT_ID.substring(0, 10) : "";
          const backendPrefix = backendDiagnostic.diagnostic.client_id_preview 
            ? backendDiagnostic.diagnostic.client_id_preview.replace('...', '')
            : "";
          
          // Check for Client ID mismatch
          if (frontendPrefix && backendPrefix && frontendPrefix !== backendPrefix) {
            clientIdMismatch = true;
            console.error("❌ CLIENT ID MISMATCH DETECTED!");
            console.error("   Frontend:", frontendPrefix + "...");
            console.error("   Backend:", backendPrefix + "...");
            console.error("   This WILL cause subscription creation to fail with 404!");
            console.error("   → Frontend uses:", VITE_STAGE === 'prod' ? 'VITE_PAYPAL_LIVE_CLIENT_ID' : 'VITE_PAYPAL_SANDBOX_CLIENT_ID', "from .env");
            console.error("   → Backend uses: PAYPAL_SANDBOX_CLIENT_ID or PAYPAL_LIVE_CLIENT_ID in Google Apps Script");
            console.error("   → Both must be from the SAME PayPal app in Developer Portal");
            console.error("   → Fix: Update", VITE_STAGE === 'prod' ? 'VITE_PAYPAL_LIVE_CLIENT_ID' : 'VITE_PAYPAL_SANDBOX_CLIENT_ID', "to match backend Client ID");
          } else if (frontendPrefix && backendPrefix) {
            console.log("✅ Client IDs match (first 10 characters)");
          }
          
          // Check for environment mismatch
          if (currentStage !== backendStage) {
            console.warn("⚠️ Environment mismatch detected!");
            console.warn(`   Frontend stage: ${currentStage}`);
            console.warn(`   Backend stage: ${backendStage}`);
            console.warn("   → This might cause issues if Client IDs don't match environments");
          } else {
            console.log("✅ Environments match");
          }
          
          // Check if Client ID is set in backend
          if (!backendDiagnostic.diagnostic.has_client_id) {
            console.error("❌ Backend Client ID is NOT SET!");
            console.error("   → Add VITE_PAYPAL_SANDBOX_CLIENT_ID or VITE_PAYPAL_LIVE_CLIENT_ID to Google Apps Script Properties");
          }
        } else {
          console.warn("⚠️ Could not verify backend Client ID:", backendDiagnostic.error);
          console.warn("   → This might indicate a backend configuration issue");
        }
      } catch (diagnosticError) {
        console.error("❌ Diagnostic check failed:", diagnosticError);
        console.error("   → This might indicate a backend connectivity issue");
      }
      
      // If Client ID mismatch detected, throw error immediately
      if (clientIdMismatch) {
        const mismatchError = new Error(
          language === "de"
            ? "PayPal Client-ID stimmt nicht überein: Frontend und Backend verwenden unterschiedliche Client-IDs. Bitte prüfen Sie die Konfiguration."
            : "PayPal Client ID mismatch: Frontend and backend are using different Client IDs. Please check your configuration."
        );
        (mismatchError as any).isClientIdMismatch = true;
        throw mismatchError;
      }
      
      // Optional: Verify plan exists and is ACTIVE before attempting subscription creation
      // This helps diagnose PayPal account configuration issues
      try {
        console.log("🔍 Verifying plan exists in PayPal system...");
        const planVerification = await paypalService.getPlanDetails(planResult.plan_id);
        if (planVerification.ok && planVerification.plan) {
          console.log("✅ Plan verified via API:", {
            id: planVerification.plan.id,
            status: planVerification.plan.status,
            name: planVerification.plan.name,
            product_id: planVerification.plan.product_id
          });
          if (planVerification.plan.status !== 'ACTIVE') {
            console.warn("⚠️ Plan exists but status is not ACTIVE:", planVerification.plan.status);
            console.warn("⚠️ This might cause subscription creation to fail!");
          }
        } else {
          console.warn("⚠️ Could not verify plan (this might be normal if plan is still propagating):", planVerification.error);
        }
      } catch (verifyError) {
        console.warn("⚠️ Plan verification failed (this might be normal):", verifyError);
      }
      
      // PayPal sometimes needs time to propagate the plan across their systems
      // Even though the plan is created with ACTIVE status, it may not be immediately
      // available for subscription creation. We'll wait and retry if needed.
      console.log("⏳ Waiting for plan to be fully available in PayPal system...");
      
      // Wait longer for plan propagation (PayPal sometimes needs 1-3 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create the subscription using the plan ID with retry logic
      // According to PayPal docs: https://developer.paypal.com/docs/subscriptions/integrate/
      // The createSubscription function should return actions.subscription.create({ plan_id: 'YOUR_PLAN_ID' })
      console.log("🔄 Creating subscription with plan_id:", planResult.plan_id);
      console.log("📝 Plan was created successfully and should be ACTIVE");
      console.log("⏱️ Plan creation timestamp:", new Date().toISOString());
      
      // Retry logic for subscription creation
      // PayPal plans sometimes need time to propagate, so we retry with exponential backoff
      const maxRetries = 4; // Increased to 4 attempts
      let lastError: any = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🚀 Attempt ${attempt}/${maxRetries}: Calling actions.subscription.create() with plan_id:`, planResult.plan_id);
          
          // Actually await the promise to catch rejections properly
          const subscriptionId = await actions.subscription.create({
            plan_id: planResult.plan_id
          });
          
          // Success! Return the subscription ID
          console.log("✅ Subscription created successfully! Subscription ID:", subscriptionId);
          return subscriptionId;
          
        } catch (subscriptionError: any) {
          lastError = subscriptionError;
          
          // Extract error information
          const errorMessage = subscriptionError?.message || String(subscriptionError);
          const errorDetails = subscriptionError?.details || subscriptionError?.response || {};
          const errorStatus = subscriptionError?.status || errorDetails?.status || 0;
          
          // Check if this is a resource not found error (404)
          const isResourceNotFound = 
            errorStatus === 404 ||
            errorMessage.includes("RESOURCE_NOT_FOUND") || 
            errorMessage.includes("INVALID_RESOURCE_ID") ||
            errorMessage.includes("does not exist") ||
            errorMessage.includes("404") ||
            errorMessage.toLowerCase().includes("not found");
          
          console.error(`❌ Subscription creation attempt ${attempt}/${maxRetries} failed:`, {
            error: subscriptionError,
            message: errorMessage,
            status: errorStatus,
            details: errorDetails,
            isResourceNotFound: isResourceNotFound,
            plan_id: planResult.plan_id,
            client_id_preview: PAYPAL_CLIENT_ID ? `${PAYPAL_CLIENT_ID.substring(0, 10)}...` : "NOT SET",
            environment: import.meta.env.VITE_STAGE || "local (sandbox)"
          });
          
          // Additional diagnostic for 404 errors
          if (isResourceNotFound) {
            console.error("🔍 404 Error Diagnostics:", {
              "Plan ID": planResult.plan_id,
              "Plan Format Valid": planResult.plan_id.startsWith("P-"),
              "Client ID Set": !!PAYPAL_CLIENT_ID,
              "Client ID Preview": PAYPAL_CLIENT_ID ? `${PAYPAL_CLIENT_ID.substring(0, 10)}...` : "NOT SET",
              "Environment": import.meta.env.VITE_STAGE || "local",
              "Attempt": `${attempt}/${maxRetries}`,
              "Possible Causes": [
                "1. Client ID mismatch (MOST COMMON) - Frontend and backend using different Client IDs",
                "2. PayPal account doesn't have subscriptions enabled - Check https://www.sandbox.paypal.com/billing/plans",
                "3. PayPal app doesn't have subscription API permissions - Check Developer Portal",
                "4. Plan not yet propagated in PayPal system (less likely after multiple retries)",
                "5. Wrong environment (sandbox vs live) mismatch"
              ],
              "Troubleshooting Steps": [
                "1. Check console logs above for Client ID comparison",
                "2. Verify VITE_PAYPAL_SANDBOX_CLIENT_ID (local) or VITE_PAYPAL_LIVE_CLIENT_ID (prod) matches backend Client ID",
                "3. Log in to PayPal Sandbox and create a test plan manually",
                "4. Check PayPal Developer Portal API permissions",
                "5. Ensure both frontend and backend use same environment (sandbox/live)"
              ]
            });
            
            // Try to get backend diagnostic info again for this error
            try {
              const errorDiagnostic = await paypalService.getDiagnosticInfo();
              if (errorDiagnostic.ok && errorDiagnostic.diagnostic) {
                console.error("🔍 Backend Diagnostic at Error Time:", {
                  "Backend Client ID Preview": errorDiagnostic.diagnostic.client_id_preview,
                  "Backend Environment": errorDiagnostic.diagnostic.stage,
                  "Backend API Base": errorDiagnostic.diagnostic.api_base,
                  "Has Client ID": errorDiagnostic.diagnostic.has_client_id,
                  "Has Client Secret": errorDiagnostic.diagnostic.has_client_secret
                });
              }
            } catch (diagError) {
              console.error("Could not get backend diagnostic during error:", diagError);
            }
          }
          
          // If it's a resource not found error and we have retries left, wait and retry
          if (isResourceNotFound && attempt < maxRetries) {
            // Exponential backoff: 2s, 3s, 4s (increased wait times)
            const waitTime = (attempt + 1) * 1000;
            console.log(`⏳ Plan not yet available (attempt ${attempt}/${maxRetries}), waiting ${waitTime}ms before retry...`);
            console.log(`📋 Plan ID: ${planResult.plan_id}, created at: ${new Date().toISOString()}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          } else {
            // Either not a resource not found error, or we've exhausted retries
            console.error(`❌ Final error after ${attempt} attempts:`, subscriptionError);
            throw subscriptionError;
          }
        }
      }
      
      // If we get here, all retries failed
      throw lastError || new Error("Failed to create subscription after multiple attempts");
    } catch (error) {
      console.error("Error creating PayPal subscription:", error);
      throw error;
    }
  }, [t, language]);

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
              <div className="mt-6 pt-6 border-t border-border/50">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t("donation.communityHouse.cta")}{" "}
                  <Link 
                    to="/projects#community-house" 
                    className="text-primary hover:underline font-medium"
                  >
                    {t("donation.communityHouse.button")}
                  </Link>
                  .
                </p>
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
                    
                    <div>
                      <Label htmlFor="salutation">{t("form.salutation")}</Label>
                      <Select
                        value={formData.salutation || undefined}
                        onValueChange={(value) => handleInputChange("salutation", value)}
                      >
                        <SelectTrigger id="salutation" className="mt-2">
                          <SelectValue placeholder={t("form.salutation.placeholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mr">{t("form.salutation.mr")}</SelectItem>
                          <SelectItem value="ms">{t("form.salutation.ms")}</SelectItem>
                          <SelectItem value="diverse">{t("form.salutation.diverse")}</SelectItem>
                          <SelectItem value="none">{t("form.salutation.none")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

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

                  {/* Gift Donation */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isGift"
                        checked={formData.isGift}
                        onCheckedChange={(checked) => handleInputChange("isGift", checked as boolean)}
                      />
                      <Label htmlFor="isGift" className="text-sm">
                        {t("donation.form.gift.label")}
                      </Label>
                    </div>

                    {formData.isGift && (
                      <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          {t("donation.form.gift.description")}
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="giftRecipientName">{t("donation.form.gift.name")}</Label>
                            <Input
                              id="giftRecipientName"
                              value={formData.giftRecipientName}
                              onChange={(e) => handleInputChange("giftRecipientName", e.target.value)}
                              className="mt-2"
                              required={formData.isGift}
                            />
                          </div>
                          <div>
                            <Label htmlFor="giftRecipientEmail">{t("donation.form.gift.email")}</Label>
                            <Input
                              id="giftRecipientEmail"
                              type="email"
                              value={formData.giftRecipientEmail}
                              onChange={(e) => handleInputChange("giftRecipientEmail", e.target.value)}
                              className="mt-2"
                              required={formData.isGift}
                            />
                          </div>
                        </div>
                      </div>
                    )}
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
                    <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as typeof paymentMethod)} className="flex flex-wrap gap-3">
                      {STRIPE_PUBLISHABLE_KEY && (
                        <>
                          {/* 1. SEPA Lastschrift (first) */}
                          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer flex-1 min-w-[150px]">
                            <RadioGroupItem value="stripe-sepa" id="payment-stripe-sepa" />
                            <Label htmlFor="payment-stripe-sepa" className="flex-1 cursor-pointer">
                              {language === "de" ? "SEPA Lastschrift" : "SEPA Direct Debit"}
                            </Label>
                          </div>
                          {/* 2. Kreditkarte (second) */}
                          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer flex-1 min-w-[150px]">
                            <RadioGroupItem value="stripe-card" id="payment-stripe-card" />
                            <Label htmlFor="payment-stripe-card" className="flex-1 cursor-pointer">
                              {language === "de" ? "Kreditkarte" : "Credit Card"}
                            </Label>
                          </div>
                        </>
                      )}
                      {/* 3. PayPal (available for both one-time and monthly payments) */}
                      {PAYPAL_CLIENT_ID && (
                        <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer flex-1 min-w-[150px]">
                          <RadioGroupItem value="paypal" id="payment-paypal" />
                          <Label htmlFor="payment-paypal" className="flex-1 cursor-pointer">
                            PayPal
                          </Label>
                        </div>
                      )}
                    </RadioGroup>
                  </div>

                  {/* Payment UI - Conditional based on selected method */}
                  <div className="w-full relative">
                    {/* PayPal - Available for both one-time and monthly payments */}
                    {paymentMethod === "paypal" && PAYPAL_CLIENT_ID && (
                      <div className="w-full relative" key="paypal-buttons">
                        <PayPalButtonWrapper
                          createOrder={donationType === "one-time" ? createPayPalOrder : undefined}
                          createSubscription={donationType === "monthly" ? createPayPalSubscription : undefined}
                          onApprove={onPayPalApprove}
                          onError={onPayPalError}
                          onCancel={onPayPalCancel}
                          language={language}
                          key={`paypal-${donationType}`}
                        />
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
                        amount={parseFloat(getCurrentAmount() || "0")}
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
                          donor_salutation: formData.salutation || "",
                          comment: formData.comment || "",
                          wantsReceipt: formData.wantsReceipt ? "true" : "false",
                          wantsNewsletter: formData.wantsNewsletter ? "true" : "false",
                          giftDonation: formData.isGift ? "true" : "false",
                          giftRecipientName: formData.giftRecipientName || "",
                          giftRecipientEmail: formData.giftRecipientEmail || "",
                          donor_street: formData.street || "",
                          donor_postalCode: formData.postalCode || "",
                          donor_city: formData.city || "",
                          donor_country: formData.country || "",
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
                          if (formData.isGift) {
                            if (!formData.giftRecipientName) {
                              showError(t("donation.form.error.giftRecipientName"));
                              return false;
                            }
                            if (!formData.giftRecipientEmail) {
                              showError(t("donation.form.error.giftRecipientEmail"));
                              return false;
                            }
                            const giftEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            if (!giftEmailRegex.test(formData.giftRecipientEmail)) {
                              showError(t("donation.form.error.giftRecipientEmailInvalid"));
                              return false;
                            }
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
                        amount={parseFloat(getCurrentAmount() || "0")}
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
                          donor_salutation: formData.salutation || "",
                          comment: formData.comment || "",
                          wantsReceipt: formData.wantsReceipt ? "true" : "false",
                          wantsNewsletter: formData.wantsNewsletter ? "true" : "false",
                          giftDonation: formData.isGift ? "true" : "false",
                          giftRecipientName: formData.giftRecipientName || "",
                          giftRecipientEmail: formData.giftRecipientEmail || "",
                          donor_street: formData.street || "",
                          donor_postalCode: formData.postalCode || "",
                          donor_city: formData.city || "",
                          donor_country: formData.country || "",
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
                          if (formData.isGift) {
                            if (!formData.giftRecipientName) {
                              showError(t("donation.form.error.giftRecipientName"));
                              return false;
                            }
                            if (!formData.giftRecipientEmail) {
                              showError(t("donation.form.error.giftRecipientEmail"));
                              return false;
                            }
                            const giftEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            if (!giftEmailRegex.test(formData.giftRecipientEmail)) {
                              showError(t("donation.form.error.giftRecipientEmailInvalid"));
                              return false;
                            }
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

        {/* 1b. Spenden statt Geschenke CTA */}
        <section className="py-10 bg-muted/30">
          <div className="max-w-content mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <Card className="p-6 md:p-8 shadow-card">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                      {t("donation.giftCta.title")}
                    </h2>
                    <p className="text-muted-foreground text-lg">
                      {t("donation.giftCta.description")}
                    </p>
                  </div>
                  <Button asChild size="lg">
                    <Link to="/spenden-statt-geschenke">
                      {t("donation.giftCta.button")}
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* 5. Transparency Commitment */}
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
                    alt="Gemeinschaft in Uganda: Mitglieder der Gemeinschaft arbeiten zusammen an Projekten zur Verbesserung ihrer Lebensbedingungen" 
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
                  <AccordionContent className="text-muted-foreground whitespace-pre-line">
                    {t("donation.faq.a4").replace(/{email}/g, t("donation.contact.email"))}
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
