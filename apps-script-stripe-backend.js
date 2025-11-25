/**
 * Google Apps Script Backend für Stripe Checkout Sessions
 * 
 * Diese Funktion erstellt Stripe Checkout Sessions sicher auf dem Server.
 * Der Benutzer wird zu Stripe Checkout weitergeleitet und nach der Zahlung zurückgeführt.
 * 
 * SETUP:
 * 1. Gehen Sie zu https://script.google.com
 * 2. Erstellen Sie ein neues Projekt
 * 3. Fügen Sie diesen Code ein
 * 4. Fügen Sie Ihre Stripe Secret Keys hinzu:
 *    - File > Project Settings > Script Properties
 *    - Fügen Sie hinzu:
 *      - STRIPE_SECRET_KEY_TEST: sk_test_...
 *      - STRIPE_SECRET_KEY_LIVE: sk_live_...
 * 5. Deploy als Web App:
 *    - Deploy > New Deployment
 *    - Type: Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    - Kopieren Sie die Web App URL
 * 
 * WICHTIG: Die Web App URL muss als VITE_STRIPE_BACKEND_URL in GitHub Secrets gesetzt werden
 * 
 * HINWEIS: Diese Implementierung verwendet Stripe Checkout (Redirect-basiert).
 * Der Benutzer wird zu Stripe Checkout weitergeleitet und nach der Zahlung zurückgeführt.
 */

// ========== CONFIGURATION ==========
// Diese Werte werden aus Script Properties gelesen
const STRIPE_SECRET_KEY_TEST = 'sk_test_...'; // Wird aus Script Properties gelesen
const STRIPE_SECRET_KEY_LIVE = 'sk_live_...'; // Wird aus Script Properties gelesen
const USE_LIVE_MODE = false; // Setzen Sie auf true für Production

// ========== HELPER FUNCTIONS ==========

/**
 * Get Stripe Secret Key from Script Properties
 */
function getStripeSecretKey() {
  const properties = PropertiesService.getScriptProperties();
  const isLive = properties.getProperty('USE_LIVE_MODE') === 'true' || USE_LIVE_MODE;
  
  let secretKey;
  if (isLive) {
    secretKey = properties.getProperty('STRIPE_SECRET_KEY_LIVE') || STRIPE_SECRET_KEY_LIVE;
  } else {
    secretKey = properties.getProperty('STRIPE_SECRET_KEY_TEST') || STRIPE_SECRET_KEY_TEST;
  }
  
  // Validate key format
  if (!secretKey || secretKey.startsWith('sk_...') || secretKey.length < 20) {
    throw new Error('Stripe Secret Key not configured. Please set STRIPE_SECRET_KEY_TEST or STRIPE_SECRET_KEY_LIVE in Script Properties.');
  }
  
  return secretKey;
}

/**
 * JSON Response Helper
 * Note: Google Apps Script Web Apps automatically handle CORS headers
 * when deployed as "Anyone" - no need to set headers manually
 */
function jsonResponse(data, statusCode = 200) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Error Response Helper
 */
function errorResponse(message, statusCode = 400) {
  return jsonResponse({ 
    ok: false, 
    error: message 
  }, statusCode);
}

/**
 * Success Response Helper
 */
function successResponse(data) {
  return jsonResponse({ 
    ok: true, 
    ...data 
  });
}

// ========== STRIPE API FUNCTIONS ==========

/**
 * Create Stripe Checkout Session
 * Uses Stripe REST API directly (no library needed)
 */
function createStripeCheckoutSession(amount, currency, paymentMethodTypes, successUrl, cancelUrl, metadata = {}, customerEmail = null, customerName = null) {
  const stripeSecretKey = getStripeSecretKey();
  
  if (!stripeSecretKey || stripeSecretKey.startsWith('sk_...')) {
    throw new Error('Stripe Secret Key not configured. Please set STRIPE_SECRET_KEY_TEST or STRIPE_SECRET_KEY_LIVE in Script Properties.');
  }

  const url = 'https://api.stripe.com/v1/checkout/sessions';
  
  // Build form-encoded payload for Stripe API
  // Stripe expects nested objects in form-encoded format: key[subkey]=value
  const formParams = [];
  
  // Mode
  formParams.push('mode=payment');
  
  // Line items (nested structure)
  formParams.push('line_items[0][price_data][currency]=' + encodeURIComponent(currency || 'eur'));
  formParams.push('line_items[0][price_data][product_data][name]=' + encodeURIComponent('Donation'));
  formParams.push('line_items[0][price_data][unit_amount]=' + Math.round(amount));
  formParams.push('line_items[0][quantity]=1');
  
  // Payment method types (array)
  const pmTypes = Array.isArray(paymentMethodTypes) ? paymentMethodTypes : [paymentMethodTypes];
  pmTypes.forEach((pmt, index) => {
    formParams.push(`payment_method_types[${index}]=${encodeURIComponent(pmt)}`);
  });
  
  // URLs
  formParams.push('success_url=' + encodeURIComponent(successUrl));
  formParams.push('cancel_url=' + encodeURIComponent(cancelUrl));
  
  // Metadata (nested object)
  if (metadata && Object.keys(metadata).length > 0) {
    Object.keys(metadata).forEach((key, index) => {
      formParams.push(`metadata[${key}]=${encodeURIComponent(metadata[key])}`);
    });
  }
  
  // Customer email
  if (customerEmail) {
    formParams.push('customer_email=' + encodeURIComponent(customerEmail));
  }
  
  // Customer name (add to metadata if not present)
  if (customerName && !metadata.customer_name) {
    formParams.push('metadata[customer_name]=' + encodeURIComponent(customerName));
  }

  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + stripeSecretKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    payload: formParams.join('&'),
  };

  try {
    console.log('Calling Stripe API:', url);
    console.log('Payload length:', formParams.join('&').length);
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('Stripe API Response Code:', responseCode);
    console.log('Stripe API Response (first 500 chars):', responseText.substring(0, 500));
    
    if (responseCode !== 200) {
      console.error('Stripe API Error:', responseCode, responseText);
      let errorMessage = `Stripe API Error: ${responseCode}`;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error) {
          if (errorData.error.message) {
            errorMessage += ' - ' + errorData.error.message;
          }
          if (errorData.error.type) {
            errorMessage += ' (Type: ' + errorData.error.type + ')';
          }
        } else if (errorData.message) {
          errorMessage += ' - ' + errorData.message;
        } else {
          errorMessage += ' - ' + responseText.substring(0, 200);
        }
      } catch (e) {
        errorMessage += ' - ' + responseText.substring(0, 200);
      }
      throw new Error(errorMessage);
    }
    
    const parsedResponse = JSON.parse(responseText);
    console.log('Stripe API Success - Session ID:', parsedResponse.id);
    return parsedResponse;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    console.error('Error type:', typeof error);
    console.error('Error string:', String(error));
    
    // Re-throw with more context
    if (error instanceof Error) {
      throw error;
    } else {
      // Handle Google Apps Script specific errors
      const errorStr = String(error);
      if (errorStr.includes('Exception')) {
        throw new Error('Google Apps Script error: ' + errorStr);
      }
      throw new Error('Failed to create checkout session: ' + errorStr);
    }
  }
}

// ========== WEB APP ENDPOINTS ==========

/**
 * Handle CORS Preflight
 */
function doOptions() {
  return jsonResponse({}, 200);
}

/**
 * Main POST Handler
 * Endpoint: POST /create-checkout-session
 */
function doPost(e) {
  try {
    console.log('=== Stripe Checkout Session Request ===');
    console.log('Timestamp:', new Date().toISOString());
    
    // Parse request body
    // Support both JSON and form-encoded data (for CORS compatibility)
    let requestData = {};
    
    if (e.postData && e.postData.contents) {
      const contentType = e.postData.type || '';
      
      if (contentType.includes('application/json')) {
        // JSON payload
        requestData = JSON.parse(e.postData.contents);
      } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('form')) {
        // Form-encoded payload (for CORS compatibility)
        const params = e.parameter || {};
        if (params.data) {
          try {
            requestData = JSON.parse(params.data);
          } catch (err) {
            console.error('Failed to parse data parameter:', err);
            return errorResponse('Failed to parse request data');
          }
        } else {
          // Try to parse URL-encoded form data directly
          // Google Apps Script automatically parses form data into e.parameter
          // But we need to reconstruct the JSON from the form fields
          const allParams = {};
          for (const key in params) {
            allParams[key] = params[key];
          }
          // If we have individual fields, use them; otherwise try to parse contents
          if (Object.keys(allParams).length > 0 && !allParams.data) {
            requestData = allParams;
          } else {
            try {
              requestData = JSON.parse(e.postData.contents);
            } catch (err) {
              console.error('Failed to parse form data:', err);
              return errorResponse('Failed to parse request data');
            }
          }
        }
      } else {
        // Try to parse as JSON anyway
        try {
          requestData = JSON.parse(e.postData.contents);
        } catch (err) {
          console.error('Failed to parse request:', err);
          return errorResponse('Invalid request format. Expected JSON or form-encoded data.');
        }
      }
    } else {
      return errorResponse('No request data provided.');
    }
    
    console.log('Request data:', requestData);
    
    // Validate required fields
    if (!requestData.amount || requestData.amount <= 0) {
      return errorResponse('Invalid amount. Amount must be greater than 0.');
    }
    
    if (!requestData.payment_method_types || requestData.payment_method_types.length === 0) {
      return errorResponse('payment_method_types is required.');
    }
    
    if (!requestData.success_url) {
      return errorResponse('success_url is required.');
    }
    
    if (!requestData.cancel_url) {
      return errorResponse('cancel_url is required.');
    }
    
    // Create checkout session
    let checkoutSession;
    try {
      checkoutSession = createStripeCheckoutSession(
        requestData.amount,
        requestData.currency || 'eur',
        requestData.payment_method_types,
        requestData.success_url,
        requestData.cancel_url,
        requestData.metadata || {},
        requestData.customer_email || null,
        requestData.customer_name || null
      );
    } catch (stripeError) {
      console.error('Stripe API call failed:', stripeError);
      console.error('Error details:', JSON.stringify(stripeError, null, 2));
      // Return detailed error message
      const errorMsg = stripeError.message || stripeError.toString() || 'Unknown error';
      return errorResponse(
        'Failed to create Stripe checkout session: ' + errorMsg,
        500
      );
    }
    
    console.log('Checkout Session created:', checkoutSession.id);
    
    // Validate response
    if (!checkoutSession || !checkoutSession.url) {
      console.error('Invalid checkout session response:', checkoutSession);
      return errorResponse(
        'Stripe returned invalid response: missing checkout URL',
        500
      );
    }
    
    // Return session URL for redirect
    return successResponse({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      id: checkoutSession.id, // For backwards compatibility
    });
    
  } catch (error) {
    console.error('Error in doPost:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return errorResponse(
      'An error occurred: ' + (error.message || error.toString() || 'Unknown error'),
      500
    );
  }
}

/**
 * GET Handler (for testing)
 */
function doGet(e) {
  return jsonResponse({
    ok: true,
    message: 'Stripe Backend is running',
    endpoints: {
      'POST /create-checkout-session': 'Create a Stripe Checkout Session',
    },
    example: {
      method: 'POST',
      url: 'YOUR_WEB_APP_URL',
      body: {
        amount: 1000, // 10.00 EUR in cents
        currency: 'eur',
        payment_method_types: ['card'],
        success_url: 'https://yourdomain.com/donation?stripe=success&session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://yourdomain.com/donation?stripe=cancelled',
        metadata: {
          donationType: 'one-time',
          donorEmail: 'test@example.com',
        },
        customer_email: 'customer@example.com',
        customer_name: 'John Doe',
      },
    },
  });
}

