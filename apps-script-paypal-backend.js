// Google Apps Script Backend for PayPal Subscriptions
// This script creates PayPal subscription plans dynamically for variable donation amounts
//
// SETUP INSTRUCTIONS:
// 1. Go to https://script.google.com
// 2. Create a new project
// 3. Paste this code
// 4. Add your PayPal Client ID and Client Secret in Script Properties:
//    - File > Project properties > Script properties
//    - Add: VITE_PAYPAL_CLIENT_ID = your_client_id
//    - Add: VITE_PAYPAL_CLIENT_SECRET = your_client_secret
//    - Use SANDBOX credentials for testing, LIVE credentials for production
// 5. Deploy as a web app:
//    - Click Deploy > New deployment
//    - Select type: Web app
//    - Execute as: Me
//    - Who has access: Anyone
//    - Click Deploy
//    - Copy the Web App URL and use it as VITE_PAYPAL_BACKEND_URL in your .env file
//
// PAYPAL API DOCUMENTATION:
// - Subscriptions: https://developer.paypal.com/docs/api/subscriptions/v1/
// - Products: https://developer.paypal.com/docs/api/catalog-products/v1/
// - Plans: https://developer.paypal.com/docs/api/subscriptions/v1/#plans

// ========== HELPER FUNCTIONS ==========

/**
 * Get PayPal credentials from Script Properties based on stage
 * @param {string} stage - 'local' for sandbox, 'prod' for live
 */
function getPayPalCredentials(stage = 'local') {
  const props = PropertiesService.getScriptProperties();
  
  let clientId, clientSecret, apiBase;
  
  if (stage === 'prod') {
    // Production/Live credentials
    clientId = props.getProperty('VITE_PAYPAL_LIVE_CLIENT_ID');
    clientSecret = props.getProperty('VITE_PAYPAL_LIVE_CLIENT_SECRET');
    apiBase = 'https://api-m.paypal.com';
    
    if (!clientId || !clientSecret) {
      throw new Error('PayPal LIVE credentials not configured. Add VITE_PAYPAL_LIVE_CLIENT_ID and VITE_PAYPAL_LIVE_CLIENT_SECRET to Script Properties.');
    }
    
    console.log('Using PayPal LIVE credentials');
  } else {
    // Sandbox/Test credentials (default)
    clientId = props.getProperty('VITE_PAYPAL_SANDBOX_CLIENT_ID');
    clientSecret = props.getProperty('VITE_PAYPAL_SANDBOX_CLIENT_SECRET');
    apiBase = 'https://api-m.sandbox.paypal.com';
    
    if (!clientId || !clientSecret) {
      throw new Error('PayPal SANDBOX credentials not configured. Add VITE_PAYPAL_SANDBOX_CLIENT_ID and VITE_PAYPAL_SANDBOX_CLIENT_SECRET to Script Properties.');
    }
    
    console.log('Using PayPal SANDBOX credentials');
  }
  
  return { clientId, clientSecret, apiBase };
}

/**
 * Get PayPal OAuth access token
 * @param {string} stage - 'local' for sandbox, 'prod' for live
 */
function getPayPalAccessToken(stage = 'local') {
  const { clientId, clientSecret, apiBase } = getPayPalCredentials(stage);
  
  const url = `${apiBase}/v1/oauth2/token`;
  const auth = Utilities.base64Encode(`${clientId}:${clientSecret}`);
  
  const options = {
    method: 'post',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    payload: 'grant_type=client_credentials',
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`Failed to get access token: ${result.error_description || result.error}`);
    }
    
    return result.access_token;
  } catch (error) {
    console.error('Error getting PayPal access token:', error);
    throw error;
  }
}

/**
 * Create or get a PayPal product for donations
 * @param {string} accessToken - PayPal access token
 * @param {string} stage - 'local' for sandbox, 'prod' for live
 */
function getOrCreateDonationProduct(accessToken, stage = 'local') {
  // Try to get existing product first (separate product IDs for sandbox and production)
  const props = PropertiesService.getScriptProperties();
  const productIdKey = stage === 'prod' ? 'VITE_PAYPAL_LIVE_DONATION_PRODUCT_ID' : 'VITE_PAYPAL_SANDBOX_DONATION_PRODUCT_ID';
  let productId = props.getProperty(productIdKey);
  
  if (productId) {
    console.log(`Using existing ${stage} donation product:`, productId);
    return productId;
  }
  
  // Create a new product
  const { apiBase } = getPayPalCredentials(stage);
  const url = `${apiBase}/v1/catalogs/products`;
  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `donation-product-${Date.now()}` // Idempotency key
    },
    payload: JSON.stringify({
      name: 'Monthly Donation to Alma Bridge of Hope',
      description: 'Recurring monthly donation to support Alma Bridge of Hope projects',
      type: 'SERVICE',
      category: 'NONPROFIT'
    }),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() !== 201) {
      throw new Error(`Failed to create product: ${JSON.stringify(result)}`);
    }
    
    productId = result.id;
    
    // Store the product ID for future use (separate for sandbox and production)
    props.setProperty(productIdKey, productId);
    console.log(`Created new ${stage} donation product:`, productId);
    
    return productId;
  } catch (error) {
    console.error('Error creating PayPal product:', error);
    throw error;
  }
}

/**
 * Create a PayPal subscription plan for a specific amount
 * @param {string} accessToken - PayPal access token
 * @param {string} productId - PayPal product ID
 * @param {number} amount - Subscription amount
 * @param {string} currency - Currency code (default: EUR)
 * @param {object} metadata - Additional metadata
 * @param {string} stage - 'local' for sandbox, 'prod' for live
 */
function createSubscriptionPlan(accessToken, productId, amount, currency = 'EUR', metadata = {}, stage = 'local') {
  const { apiBase } = getPayPalCredentials(stage);
  const url = `${apiBase}/v1/billing/plans`;
  
  // Format amount to 2 decimal places
  const formattedAmount = parseFloat(amount).toFixed(2);
  
  // Create a descriptive plan name
  const planName = `Monthly €${formattedAmount} Donation`;
  const planDescription = metadata.donorName 
    ? `Monthly donation of €${formattedAmount} by ${metadata.donorName}`
    : `Monthly donation of €${formattedAmount}`;
  
  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `plan-${Date.now()}-${Math.random()}` // Idempotency key
    },
    payload: JSON.stringify({
      product_id: productId,
      name: planName,
      description: planDescription,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: {
            interval_unit: 'MONTH',
            interval_count: 1
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // 0 = infinite until cancelled
          pricing_scheme: {
            fixed_price: {
              value: formattedAmount,
              currency_code: currency
            }
          }
        }
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3
      }
    }),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();
    const result = JSON.parse(responseText);
    
    if (response.getResponseCode() !== 201) {
      console.error('PayPal API error:', response.getResponseCode(), result);
      throw new Error(`Failed to create subscription plan: ${JSON.stringify(result)}`);
    }
    
    // Validate plan_id format (should start with "P-")
    if (!result.id || !result.id.startsWith('P-')) {
      console.error('⚠️ Invalid plan_id format returned from PayPal:', result.id);
      console.error('Full PayPal response:', responseText);
      throw new Error(`Invalid plan ID format from PayPal: ${result.id}`);
    }
    
    console.log('✅ Created subscription plan:', result.id);
    console.log('📋 Plan details:', {
      id: result.id,
      name: result.name,
      status: result.status,
      product_id: result.product_id,
      create_time: result.create_time
    });
    
    return result.id;
  } catch (error) {
    console.error('Error creating PayPal subscription plan:', error);
    throw error;
  }
}

// ========== SETUP ENDPOINT ==========

/**
 * Secure Setup Endpoint
 * POST /?action=setup
 * Body: { setup_token: "...", secrets: { VITE_PAYPAL_SANDBOX_CLIENT_ID: "...", VITE_PAYPAL_SANDBOX_CLIENT_SECRET: "...", VITE_PAYPAL_LIVE_CLIENT_ID: "...", VITE_PAYPAL_LIVE_CLIENT_SECRET: "..." } }
 * 
 * This endpoint allows GitHub Actions to automatically sync secrets from GitHub Secrets
 * to Apps Script Properties. The setup_token must match what's configured in GitHub Secrets.
 */
function setupPayPalSecrets(requestData) {
  const properties = PropertiesService.getScriptProperties();
  
  // Get setup token from Script Properties (set manually once)
  // This should be a strong random string, stored in GitHub Secrets as VITE_PAYPAL_SETUP_TOKEN
  const expectedToken = properties.getProperty('VITE_PAYPAL_SETUP_TOKEN');
  
  // If no token is set, allow first-time setup (one-time initialization)
  if (!expectedToken) {
    console.warn('⚠️ VITE_PAYPAL_SETUP_TOKEN not set. First-time setup allowed, but you should set a token for security.');
  }
  
  // Validate setup token
  const providedToken = requestData.setup_token;
  if (expectedToken && providedToken !== expectedToken) {
    console.error('❌ Invalid setup token provided');
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: 'Unauthorized: Invalid setup token'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Validate secrets structure
  if (!requestData.secrets || typeof requestData.secrets !== 'object') {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: 'Invalid request: secrets object required'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const secrets = requestData.secrets;
  const propertiesToSet = {};
  
  // Validate and prepare secrets
  if (secrets.VITE_PAYPAL_SANDBOX_CLIENT_ID) {
    if (secrets.VITE_PAYPAL_SANDBOX_CLIENT_ID.length < 10) {
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        error: 'Invalid VITE_PAYPAL_SANDBOX_CLIENT_ID format'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    propertiesToSet['VITE_PAYPAL_SANDBOX_CLIENT_ID'] = secrets.VITE_PAYPAL_SANDBOX_CLIENT_ID;
  }
  
  if (secrets.VITE_PAYPAL_SANDBOX_CLIENT_SECRET) {
    if (secrets.VITE_PAYPAL_SANDBOX_CLIENT_SECRET.length < 10) {
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        error: 'Invalid VITE_PAYPAL_SANDBOX_CLIENT_SECRET format'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    propertiesToSet['VITE_PAYPAL_SANDBOX_CLIENT_SECRET'] = secrets.VITE_PAYPAL_SANDBOX_CLIENT_SECRET;
  }
  
  if (secrets.VITE_PAYPAL_LIVE_CLIENT_ID) {
    if (secrets.VITE_PAYPAL_LIVE_CLIENT_ID.length < 10) {
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        error: 'Invalid VITE_PAYPAL_LIVE_CLIENT_ID format'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    propertiesToSet['VITE_PAYPAL_LIVE_CLIENT_ID'] = secrets.VITE_PAYPAL_LIVE_CLIENT_ID;
  }
  
  if (secrets.VITE_PAYPAL_LIVE_CLIENT_SECRET) {
    if (secrets.VITE_PAYPAL_LIVE_CLIENT_SECRET.length < 10) {
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        error: 'Invalid VITE_PAYPAL_LIVE_CLIENT_SECRET format'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    propertiesToSet['VITE_PAYPAL_LIVE_CLIENT_SECRET'] = secrets.VITE_PAYPAL_LIVE_CLIENT_SECRET;
  }
  
  // Store secrets
  if (Object.keys(propertiesToSet).length > 0) {
    properties.setProperties(propertiesToSet);
    console.log('✅ PayPal secrets updated successfully');
    console.log('Updated keys:', Object.keys(propertiesToSet));
    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      message: 'Secrets updated successfully',
      updated_keys: Object.keys(propertiesToSet)
    })).setMimeType(ContentService.MimeType.JSON);
  } else {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: 'No valid secrets provided'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ========== MAIN ENDPOINT ==========

/**
 * Handle POST requests to create subscription plans
 */
function doPost(e) {
  try {
    console.log('=== PayPal Subscription Plan Creation Request ===');
    console.log('Timestamp:', new Date().toISOString());
    
    // Parse request data
    let requestData = {};
    
    if (e.postData && e.postData.contents) {
      const contentType = e.postData.type || '';
      console.log('Content type:', contentType);
      
      if (contentType.includes('application/json')) {
        requestData = JSON.parse(e.postData.contents);
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const params = e.parameter || {};
        if (params.data) {
          requestData = JSON.parse(params.data);
        } else {
          requestData = JSON.parse(e.postData.contents);
        }
      } else {
        requestData = JSON.parse(e.postData.contents);
      }
    } else if (e.parameter && e.parameter.data) {
      requestData = JSON.parse(e.parameter.data);
    } else {
      throw new Error('No request data provided');
    }
    
    console.log('Request data:', {
      amount: requestData.amount,
      currency: requestData.currency,
      hasDonorEmail: !!requestData.donor_email,
      hasDonorName: !!requestData.donor_name
    });
    
    // Handle setup action (for syncing secrets from GitHub Actions)
    if (requestData.action === 'setup') {
      console.log('🔧 Setup request received');
      return setupPayPalSecrets(requestData);
    }
    
    // Continue with normal subscription plan creation
    console.log('=== PayPal Subscription Plan Creation Request ===');
    
    // Validate required fields
    if (!requestData.amount || parseFloat(requestData.amount) <= 0) {
      throw new Error('Invalid or missing amount');
    }
    
    const amount = parseFloat(requestData.amount);
    const currency = requestData.currency || 'EUR';
    const stage = requestData.stage || 'local'; // Default to local/sandbox
    const metadata = {
      donorEmail: requestData.donor_email || '',
      donorName: requestData.donor_name || '',
      donationType: 'monthly',
      ...requestData.metadata
    };
    
    console.log(`Creating subscription for stage: ${stage}`);
    
    // Get PayPal access token
    console.log('Getting PayPal access token...');
    const accessToken = getPayPalAccessToken(stage);
    
    // Get or create donation product
    console.log('Getting donation product...');
    const productId = getOrCreateDonationProduct(accessToken, stage);
    
    // Create subscription plan
    console.log('Creating subscription plan...');
    const planId = createSubscriptionPlan(accessToken, productId, amount, currency, metadata, stage);
    
    // Return success response
    return jsonResponse({
      ok: true,
      plan_id: planId,
      amount: amount,
      currency: currency,
      message: 'Subscription plan created successfully'
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    console.error('Error stack:', error.stack);
    
    return jsonResponse({
      ok: false,
      error: error.toString(),
      message: `Failed to create subscription plan: ${error.message}`
    }, 500);
  }
}

/**
 * Get PayPal plan details
 * @param {string} accessToken - PayPal access token
 * @param {string} planId - PayPal plan ID
 * @param {string} stage - 'local' for sandbox, 'prod' for live
 */
function getPlanDetails(accessToken, planId, stage = 'local') {
  const { apiBase } = getPayPalCredentials(stage);
  const url = `${apiBase}/v1/billing/plans/${planId}`;
  
  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`Failed to get plan details: ${JSON.stringify(result)}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error getting PayPal plan details:', error);
    throw error;
  }
}

/**
 * Get PayPal subscription details
 * @param {string} accessToken - PayPal access token
 * @param {string} subscriptionId - PayPal subscription ID
 * @param {string} stage - 'local' for sandbox, 'prod' for live
 */
function getSubscriptionDetails(accessToken, subscriptionId, stage = 'local') {
  const { apiBase } = getPayPalCredentials(stage);
  const url = `${apiBase}/v1/billing/subscriptions/${subscriptionId}`;
  
  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`Failed to get subscription details: ${JSON.stringify(result)}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error getting PayPal subscription details:', error);
    throw error;
  }
}

/**
 * Handle GET requests (for testing and getting subscription details)
 */
function doGet(e) {
  const params = e.parameter || {};
  
  // Handle get-plan action
  if (params.action === 'get-plan' && params.plan_id) {
    try {
      const stage = params.stage || 'local';
      const planId = params.plan_id;
      
      console.log(`Getting plan details for: ${planId} (stage: ${stage})`);
      
      const accessToken = getPayPalAccessToken(stage);
      const planDetails = getPlanDetails(accessToken, planId, stage);
      
      return jsonResponse({
        ok: true,
        plan: planDetails
      });
    } catch (error) {
      console.error('Error getting plan details:', error);
      return jsonResponse({
        ok: false,
        error: error.toString(),
        message: `Failed to get plan details: ${error.message}`
      }, 500);
    }
  }
  
  // Handle get-subscription action
  if (params.action === 'get-subscription' && params.subscription_id) {
    try {
      const stage = params.stage || 'local';
      const subscriptionId = params.subscription_id;
      
      console.log(`Getting subscription details for: ${subscriptionId} (stage: ${stage})`);
      
      const accessToken = getPayPalAccessToken(stage);
      const subscriptionDetails = getSubscriptionDetails(accessToken, subscriptionId, stage);
      
      return jsonResponse({
        ok: true,
        subscription: subscriptionDetails
      });
    } catch (error) {
      console.error('Error getting subscription details:', error);
      return jsonResponse({
        ok: false,
        error: error.toString(),
        message: `Failed to get subscription details: ${error.message}`
      }, 500);
    }
  }
  
  // Handle diagnostic action (for debugging Client ID mismatch)
  if (params.action === 'diagnostic') {
    try {
      const stage = params.stage || 'local';
      const credentials = getPayPalCredentials(stage);
      
      // Return Client ID preview (first 10 chars) for verification
      // Client IDs are safe to expose, but we'll only show a preview for security
      const clientIdPreview = credentials.clientId 
        ? credentials.clientId.substring(0, 10) + '...' 
        : 'NOT SET';
      
      return jsonResponse({
        ok: true,
        diagnostic: {
          stage: stage,
          client_id_preview: clientIdPreview,
          client_id_length: credentials.clientId ? credentials.clientId.length : 0,
          api_base: credentials.apiBase,
          has_client_id: !!credentials.clientId,
          has_client_secret: !!credentials.clientSecret,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting diagnostic info:', error);
      return jsonResponse({
        ok: false,
        error: error.toString(),
        message: `Failed to get diagnostic info: ${error.message}`
      }, 500);
    }
  }
  
  // Default response
  return jsonResponse({
    ok: true,
    message: 'PayPal Subscription Backend is active',
    timestamp: new Date().toISOString(),
    note: 'Stage is determined by the "stage" parameter in POST requests (local=sandbox, prod=live)',
    available_actions: ['get-plan', 'get-subscription', 'diagnostic']
  });
}

/**
 * Handle OPTIONS requests (CORS preflight)
 */
function doOptions(e) {
  const output = ContentService.createTextOutput('');
  output.setMimeType(ContentService.MimeType.TEXT);
  
  try {
    output.setHeader('Access-Control-Allow-Origin', '*');
    output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    output.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    output.setHeader('Access-Control-Max-Age', '3600');
  } catch (e) {
    console.error('Error setting CORS headers:', e);
  }
  
  return output;
}

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(obj, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '3600'
  };
  
  for (const [key, value] of Object.entries(headers)) {
    try {
      output.setHeader(key, value);
    } catch (e) {
      // Some headers might not be settable
    }
  }
  
  return output;
}

// ========== TESTING FUNCTION ==========
// Run this function manually to test your PayPal configuration
// Set stage to 'local' to test sandbox, 'prod' to test live
function testPayPalConnection(stage = 'local') {
  try {
    console.log(`Testing PayPal connection for stage: ${stage}...`);
    
    // Test 1: Get access token
    console.log('Test 1: Getting access token...');
    const accessToken = getPayPalAccessToken(stage);
    console.log('✅ Access token obtained successfully');
    
    // Test 2: Get or create product
    console.log('Test 2: Getting/creating donation product...');
    const productId = getOrCreateDonationProduct(accessToken, stage);
    console.log('✅ Product ID:', productId);
    
    // Test 3: Create a test subscription plan
    console.log('Test 3: Creating test subscription plan (€10/month)...');
    const planId = createSubscriptionPlan(accessToken, productId, 10, 'EUR', {
      donorName: 'Test Donor',
      donorEmail: 'test@example.com'
    }, stage);
    console.log('✅ Subscription plan created:', planId);
    
    console.log('🎉 All tests passed!');
    return {
      success: true,
      stage: stage,
      accessToken: '***',
      productId: productId,
      testPlanId: planId
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      stage: stage,
      error: error.toString()
    };
  }
}

