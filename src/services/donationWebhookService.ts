// Service for sending donation data to Google Apps Script webhook

export interface DonationItem {
  type: 'item' | 'phase' | 'general-donation';
  itemId?: string;
  name: string;
  unitPrice: number;
  quantity?: number;
  totalPrice: number;
  projectName?: string;
  phase?: string;
}

export interface DonationData {
  items: DonationItem[];
  totalAmount: number;
  donationType: 'one-time' | 'monthly' | 'new-membership';
  paymentMethod: 'paypal' | 'sepa' | 'card' | 'stripe-card' | 'stripe-sepa' | 'bank-transfer' | 'no-payment';
  donorEmail?: string;
  donorName?: string;
  donorSalutation?: string;
  timestamp?: string;
  paymentId?: string; // PayPal transaction ID or SEPA reference
  paymentStatus?: 'paid' | 'unpaid' | 'pending' | 'failed'; // Payment status (for Stripe SEPA, PayPal is always 'paid')
  wantsReceipt?: boolean; // Whether donor wants a donation receipt (Spendenbescheid)
  isGift?: boolean; // Whether donation is a present
  giftRecipientName?: string;
  giftRecipientEmail?: string;
  address?: {
    street?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };
  wantsNewsletter?: boolean; // Whether donor wants to receive news about projects
  comment?: string; // Optional comment from donor
}

export interface WebhookResponse {
  ok: boolean;
  message?: string;
  updates?: Array<{
    itemId: string;
    oldQty: number;
    newQty: number;
    amount: number;
    type?: string;
  }>;
  totalUpdated?: number;
  error?: string;
}

class DonationWebhookService {
  private supabaseWebhookUrl: string;
  private legacyWebhookUrl: string; // Keep for backwards compatibility

  constructor() {
    // New Supabase webhook URL (preferred)
    this.supabaseWebhookUrl = import.meta.env.VITE_SUPABASE_WEBHOOK_URL || '';

    // Legacy Google Apps Script webhook URL (fallback)
    this.legacyWebhookUrl = import.meta.env.VITE_DONATION_WEBHOOK_URL || '';

    // Log webhook URL status (without exposing full URL for security)
    if (this.supabaseWebhookUrl) {
      const urlObj = new URL(this.supabaseWebhookUrl);
      console.log('Supabase donation webhook URL configured:', urlObj.origin);
    } else if (this.legacyWebhookUrl) {
      const urlObj = new URL(this.legacyWebhookUrl);
      console.log('Legacy donation webhook URL configured (Google Apps Script):', urlObj.origin);
      console.warn('⚠️ Using legacy Google Apps Script webhook. Consider migrating to Supabase webhooks.');
    } else {
      console.error('⚠️ No webhook URL configured!');
      console.error('Please set VITE_SUPABASE_WEBHOOK_URL or VITE_DONATION_WEBHOOK_URL in your environment variables.');
    }
  }

  /**
   * Send donation data to the webhook
   * @param donationData The donation data to send
   * @param retries Number of retry attempts (default: 3)
   * @returns Promise with the webhook response
   */
  async sendDonation(
    donationData: DonationData,
    retries: number = 3
  ): Promise<WebhookResponse> {
    // Determine which webhook URL to use
    const webhookUrl = this.supabaseWebhookUrl || this.legacyWebhookUrl;

    if (!webhookUrl) {
      const errorMsg = 'No donation webhook URL configured. Set VITE_SUPABASE_WEBHOOK_URL or VITE_DONATION_WEBHOOK_URL in your environment variables.';
      console.error('❌', errorMsg);
      console.error('Current environment:', import.meta.env.MODE);
      console.error('Available env vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
      return {
        ok: false,
        message: errorMsg
      };
    }

    const usingSupabase = this.supabaseWebhookUrl === webhookUrl;

    // Log the webhook URL being used (sanitized for security)
    try {
      const urlObj = new URL(webhookUrl);
      console.log('📡 Webhook URL:', urlObj.origin + urlObj.pathname.substring(0, 20) + '...');
      console.log('Using webhook provider:', usingSupabase ? 'Supabase Edge Function' : 'Google Apps Script');
    } catch (e) {
      console.error('❌ Invalid webhook URL format:', webhookUrl);
    }

    // Ensure timestamp is set
    if (!donationData.timestamp) {
      donationData.timestamp = new Date().toISOString();
    }

    // For Supabase webhooks, we don't need to send the data directly
    // The webhook will be called by Stripe/PayPal, not by the frontend
    // But we can still validate the data structure
    if (usingSupabase) {
      console.log('✅ Using Supabase webhook - data will be processed by Stripe/PayPal webhooks');
      console.log('Donation data prepared for webhook processing:', {
        totalAmount: donationData.totalAmount,
        itemsCount: donationData.items.length,
        paymentMethod: donationData.paymentMethod,
        donationType: donationData.donationType
      });

      // Return success - the actual processing happens via webhooks
      return {
        ok: true,
        message: 'Donation data prepared for Supabase webhook processing',
        totalUpdated: donationData.items.length
      };
    }

    // Legacy Google Apps Script webhook
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Sending donation to legacy webhook (attempt ${attempt}/${retries})...`, {
          totalAmount: donationData.totalAmount,
          itemsCount: donationData.items.length,
          paymentMethod: donationData.paymentMethod
        });

        // Google Apps Script web apps have CORS limitations
        // Use form-encoded data to bypass CORS preflight
        const formData = new URLSearchParams();
        formData.append('data', JSON.stringify(donationData));

        const response = await fetch(webhookUrl, {
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

        const result: WebhookResponse = await response.json();

        if (result.ok) {
          console.log('Donation successfully processed by legacy webhook:', result);
          return result;
        } else {
          throw new Error(result.message || 'Webhook returned error');
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Legacy webhook request failed (attempt ${attempt}/${retries}):`, lastError);

        // If this is the last attempt, don't wait
        if (attempt < retries) {
          // Exponential backoff: wait 1s, 2s, 4s...
          const waitTime = Math.pow(2, attempt - 1) * 1000;
          console.log(`Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries failed
    const errorMessage = `Failed to send donation to legacy webhook after ${retries} attempts: ${lastError?.message || 'Unknown error'}`;
    console.error(errorMessage);
    return {
      ok: false,
      message: errorMessage,
      error: lastError?.message
    };
  }

  /**
   * Format cart items for webhook
   * Converts CartItem[] to DonationItem[]
   */
  formatCartItemsForWebhook(cartItems: Array<{
    id: string;
    type: 'item' | 'phase' | 'general-donation';
    name: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    category?: string;
    phase?: string;
    projectName?: string;
    itemId?: string;
  }>): DonationItem[] {
    return cartItems.map(item => ({
      type: item.type,
      itemId: item.itemId,
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
      projectName: item.projectName,
      phase: item.phase,
    }));
  }
}

// Singleton instance
export const donationWebhookService = new DonationWebhookService();
