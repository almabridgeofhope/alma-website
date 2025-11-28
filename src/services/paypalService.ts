// Service for creating PayPal subscription plans via backend
// Similar to stripeService.ts but for PayPal subscriptions

export interface CreateSubscriptionPlanRequest {
  amount: number; // in EUR
  currency?: string;
  donorEmail?: string;
  donorName?: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionPlanResponse {
  ok: boolean;
  plan_id?: string;
  amount?: number;
  currency?: string;
  message?: string;
  error?: string;
}

class PayPalService {
  private backendUrl: string;
  private stage: string;

  constructor() {
    // Get backend URL and stage from environment variables
    this.backendUrl = import.meta.env.VITE_PAYPAL_BACKEND_URL || '';
    this.stage = import.meta.env.VITE_STAGE || 'local'; // Default to local/sandbox
    
    if (!this.backendUrl) {
      console.warn('VITE_PAYPAL_BACKEND_URL not configured. PayPal subscriptions will not work.');
    }
    
    console.log(`PayPal Service initialized with stage: ${this.stage}`);
  }

  /**
   * Create a PayPal subscription plan for a specific amount
   * This calls the Google Apps Script backend which creates the plan via PayPal API
   */
  async createSubscriptionPlan(request: CreateSubscriptionPlanRequest): Promise<CreateSubscriptionPlanResponse> {
    if (!this.backendUrl) {
      return {
        ok: false,
        error: 'PayPal backend URL not configured',
        message: 'PayPal backend URL not configured. Set VITE_PAYPAL_BACKEND_URL in your environment variables.'
      };
    }

    try {
      console.log('Creating PayPal subscription plan via backend...', {
        amount: request.amount,
        currency: request.currency || 'EUR'
      });

      // Prepare request payload
      const requestPayload = {
        amount: request.amount,
        currency: request.currency || 'EUR',
        donor_email: request.donorEmail,
        donor_name: request.donorName,
        metadata: request.metadata || {},
        stage: this.stage, // Pass stage (local=sandbox, prod=live)
      };

      // Google Apps Script web apps have CORS limitations
      // Use form-encoded data to bypass CORS preflight
      const formData = new URLSearchParams();
      formData.append('data', JSON.stringify(requestPayload));

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
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: CreateSubscriptionPlanResponse = await response.json();

      if (result.ok && result.plan_id) {
        console.log('PayPal subscription plan created successfully:', result.plan_id);
        return result;
      } else {
        throw new Error(result.message || result.error || 'Failed to create subscription plan');
      }
    } catch (error) {
      console.error('Error creating PayPal subscription plan:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        message: `Failed to create subscription plan: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Check if PayPal backend is configured
   */
  isConfigured(): boolean {
    return !!this.backendUrl;
  }
}

// Singleton instance
export const paypalService = new PayPalService();

