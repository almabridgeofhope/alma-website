// Stripe Service for creating checkout sessions
// Uses Stripe Checkout (redirect-based payment)

export interface CreateCheckoutSessionRequest {
  amount: number; // in EUR
  currency?: string;
  paymentMethodTypes?: ('card' | 'sepa_debit')[];
  metadata?: Record<string, string>;
  customerEmail?: string;
  customerName?: string;
}

export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string; // Redirect URL to Stripe Checkout
}

class StripeService {
  private backendUrl: string | null = null;

  constructor() {
    // Check if backend URL is configured
    this.backendUrl = import.meta.env.VITE_STRIPE_BACKEND_URL || null;
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
      const successUrl = `${baseUrl}/#/donation?stripe=success&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/#/donation?stripe=cancelled`;

      // Google Apps Script web apps have CORS limitations
      // Use form-encoded data to bypass CORS preflight
      // This works better with Google Apps Script web apps
      const formData = new URLSearchParams();
      formData.append('data', JSON.stringify({
        amount: Math.round(request.amount * 100), // Convert to cents
        currency: request.currency || 'eur',
        payment_method_types: request.paymentMethodTypes || ['card'],
        metadata: request.metadata || {},
        customer_email: request.customerEmail,
        customer_name: request.customerName,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }));

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

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to create checkout session';
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.message || error.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error('Failed to parse response:', responseText);
        throw new Error('Invalid response from server');
      }

      // Validate response
      if (!data.url) {
        console.error('Missing URL in response:', data);
        throw new Error('No checkout URL received from server');
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
}

export const stripeService = new StripeService();


