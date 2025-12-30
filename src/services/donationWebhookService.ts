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
  paymentMethod: 'paypal' | 'sepa' | 'card' | 'stripe-card' | 'stripe-sepa';
  donorEmail?: string;
  donorName?: string;
  timestamp?: string;
  paymentId?: string; // PayPal transaction ID or SEPA reference
  paymentStatus?: 'paid' | 'unpaid' | 'pending' | 'failed'; // Payment status (for Stripe SEPA, PayPal is always 'paid')
  wantsReceipt?: boolean; // Whether donor wants a donation receipt (Spendenbescheid)
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
  private webhookUrl: string;

  constructor() {
    // Get webhook URL from environment variable
    this.webhookUrl = import.meta.env.VITE_DONATION_WEBHOOK_URL || '';
    
    // Log webhook URL status (without exposing full URL for security)
    if (this.webhookUrl) {
      const urlObj = new URL(this.webhookUrl);
      console.log('Donation webhook URL configured:', urlObj.origin);
    } else {
      console.error('⚠️ VITE_DONATION_WEBHOOK_URL is not configured!');
      console.error('Please set VITE_DONATION_WEBHOOK_URL in your environment variables.');
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
    if (!this.webhookUrl) {
      const errorMsg = 'Donation webhook URL not configured. Set VITE_DONATION_WEBHOOK_URL in your environment variables.';
      console.error('❌', errorMsg);
      console.error('Current environment:', import.meta.env.MODE);
      console.error('Available env vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
      return {
        ok: false,
        message: errorMsg
      };
    }
    
    // Log the webhook URL being used (sanitized for security)
    try {
      const urlObj = new URL(this.webhookUrl);
      console.log('📡 Webhook URL:', urlObj.origin + urlObj.pathname.substring(0, 20) + '...');
    } catch (e) {
      console.error('❌ Invalid webhook URL format:', this.webhookUrl);
    }

    // Ensure timestamp is set
    if (!donationData.timestamp) {
      donationData.timestamp = new Date().toISOString();
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Sending donation to webhook (attempt ${attempt}/${retries})...`, {
          totalAmount: donationData.totalAmount,
          itemsCount: donationData.items.length,
          paymentMethod: donationData.paymentMethod
        });
        
        // Google Apps Script web apps have CORS limitations
        // Use form-encoded data to bypass CORS preflight
        // This works better with Google Apps Script web apps
        const formData = new URLSearchParams();
        formData.append('data', JSON.stringify(donationData));
        
        const response = await fetch(this.webhookUrl, {
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
          console.log('Donation successfully processed by webhook:', result);
          return result;
        } else {
          throw new Error(result.message || 'Webhook returned error');
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Webhook request failed (attempt ${attempt}/${retries}):`, lastError);

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
    const errorMessage = `Failed to send donation to webhook after ${retries} attempts: ${lastError?.message || 'Unknown error'}`;
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

