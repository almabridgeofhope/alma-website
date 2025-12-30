// Stripe Service for creating checkout sessions
// Uses Stripe Checkout (redirect-based payment)

export interface CreateCheckoutSessionRequest {
  amount: number; // in EUR
  currency?: string;
  paymentMethodTypes?: ('card' | 'sepa_debit')[];
  metadata?: Record<string, string>;
  customerEmail?: string;
  customerName?: string;
  isSubscription?: boolean; // true for monthly recurring payments
  successUrl?: string; // Optional override for success redirect
  cancelUrl?: string;  // Optional override for cancel redirect
}

export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string; // Redirect URL to Stripe Checkout
}

export interface StripeSessionDetails {
  id: string;
  amount_total: number; // Amount in cents
  currency: string;
  customer_email: string | null;
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  payment_method_types?: string[]; // Array of payment method types (e.g., ['card', 'sepa_debit'])
  metadata: Record<string, string>;
  customer_details?: {
    email?: string;
    name?: string;
    address?: {
      city?: string | null;
      country?: string | null;
      line1?: string | null;
      line2?: string | null;
      postal_code?: string | null;
      state?: string | null;
    };
  };
}

class StripeService {
  private backendUrl: string | null = null;
  private stage: string;

  constructor() {
    // Check if backend URL and stage are configured
    this.backendUrl = import.meta.env.VITE_STRIPE_BACKEND_URL || null;
    this.stage = import.meta.env.VITE_STAGE || 'local'; // Default to local/test
    
    console.log(`Stripe Service initialized with stage: ${this.stage}`);
  }

  /**
   * Create a Stripe Checkout Session
   * This redirects the user to Stripe Checkout for payment
   * 
   * Example backend endpoint:
   * POST /api/stripe/create-checkout-session
   * Body: { amount: 100, currency: 'eur', paymentMethodTypes: ['card'] }
   * Returns: { sessionId: 'cs_xxx', url: 'https://checkout.stripe.com/...' }
   */
  async createCheckoutSession(request: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse> {
    if (!this.backendUrl) {
      throw new Error('Stripe backend URL not configured. Please set VITE_STRIPE_BACKEND_URL environment variable.');
    }

    try {
      const baseUrl = window.location.origin;
      // Use BrowserRouter format (no hash)
      // Redirect directly to success page with session_id
      const successUrl = request.successUrl || `${baseUrl}/donation/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = request.cancelUrl || `${baseUrl}/donation?stripe=cancelled`;

      // Google Apps Script web apps have CORS limitations
      // Use form-encoded data to bypass CORS preflight
      // This works better with Google Apps Script web apps
      const requestPayload = {
        amount: Math.round(request.amount * 100), // Convert to cents
        currency: request.currency || 'eur',
        payment_method_types: request.paymentMethodTypes || ['card'],
        metadata: request.metadata || {},
        customer_email: request.customerEmail,
        customer_name: request.customerName,
        success_url: successUrl,
        cancel_url: cancelUrl,
        is_subscription: request.isSubscription || false, // Flag for recurring payments
        stage: this.stage, // Pass stage (local=test, prod=live)
      };
      
      console.log('📦 Request payload:', requestPayload);
      
      const formData = new URLSearchParams();
      formData.append('data', JSON.stringify(requestPayload));

      // Google Apps Script Web Apps only have /exec endpoint
      // Don't append /create-checkout-session to the URL
      const response = await fetch(this.backendUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const responseText = await response.text();
      console.log('📥 Response status:', response.status, response.statusText);
      console.log('📄 Full response text:', responseText);
      
      if (!response.ok) {
        let errorMessage = 'Failed to create checkout session';
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.message || error.error || errorMessage;
          console.error('❌ Backend error:', error);
        } catch {
          errorMessage = responseText || errorMessage;
          console.error('❌ Backend error (non-JSON):', responseText);
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('📦 Parsed response data:', data);
      } catch (error) {
        console.error('❌ Failed to parse response:', responseText);
        console.error('❌ Parse error:', error);
        throw new Error('Invalid response from server: ' + responseText.substring(0, 500));
      }

      // Validate response
      if (!data.ok || !data.url) {
        console.error('❌ Missing URL in response:', data);
        console.error('❌ Full response object:', JSON.stringify(data, null, 2));
        const errorMsg = data.error || data.message || 'No checkout URL received from server';
        throw new Error(errorMsg);
      }

      return {
        sessionId: data.sessionId || data.id,
        url: data.url,
      };
    } catch (error) {
      console.error('Stripe service error:', error);
      throw error;
    }
  }

  /**
   * Retrieve Stripe Session Details
   * Used after successful payment to get transaction details
   */
  async getSessionDetails(sessionId: string): Promise<StripeSessionDetails> {
    if (!this.backendUrl) {
      throw new Error('Stripe backend URL not configured. Please set VITE_STRIPE_BACKEND_URL environment variable.');
    }

    try {
      // Use GET request with query parameters
      const url = `${this.backendUrl}?action=get-session&session_id=${encodeURIComponent(sessionId)}`;
      console.log("📡 Fetching session details from:", url);
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
      });

      console.log("📥 Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to retrieve session details:', errorText);
        throw new Error(`Failed to retrieve session details: ${response.status} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log("📄 Response text (first 200 chars):", responseText.substring(0, 200));
      
      const data = JSON.parse(responseText);
      console.log("📦 Parsed response data:", data);
      
      if (!data.ok || !data.session) {
        console.error('❌ Invalid session details response:', data);
        throw new Error('Invalid session details response');
      }

      const session = data.session as StripeSessionDetails;
      
      // Comprehensive logging for payment details (especially important for live payments)
      const isLivePayment = session.id.startsWith('cs_live_');
      console.log("✅ Session details successfully retrieved");
      console.log("=== Payment Details ===");
      console.log("Session ID:", session.id);
      console.log("Payment Mode:", isLivePayment ? "LIVE" : "TEST");
      console.log("Payment Status:", session.payment_status);
      console.log("Amount:", (session.amount_total / 100).toFixed(2), session.currency.toUpperCase());
      console.log("Customer Email:", session.customer_details?.email || session.customer_email || 'N/A');
      console.log("Customer Name:", session.customer_details?.name || 'N/A');
      console.log("Metadata:", JSON.stringify(session.metadata || {}, null, 2));
      console.log("======================");
      
      return session;
    } catch (error) {
      console.error('❌ Error retrieving session details:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();


