# PayPal Integration Setup

## 🔧 PayPal Configuration

### 1. PayPal App Configuration
In your PayPal Developer Dashboard (https://developer.paypal.com/):

1. **Return URL**: `https://yourdomain.com/donation?success=true`
2. **Cancel URL**: `https://yourdomain.com/donation?cancelled=true`
3. **Webhook URL**: `https://yourdomain.com/api/paypal/webhook` (optional)

#### Important: Monthly Subscriptions Setup
For **monthly recurring donations** to work, you need to ensure:

1. **PayPal Business Account**: Your PayPal account must be a Business account (not Personal)
2. **Subscriptions Feature**: Subscriptions are automatically enabled for Business accounts
3. **No Additional Setup Required**: The backend automatically creates subscription plans dynamically for each donation amount
4. **Testing**: Test monthly subscriptions in the PayPal Sandbox first before going live

**Note**: The subscription plans are created automatically via the Google Apps Script backend when a user selects monthly donation. No manual plan creation in PayPal is needed.

#### Troubleshooting: 404 Error When Creating Subscriptions

If you encounter a `RESOURCE_NOT_FOUND` (404) error when trying to create a monthly subscription, check the following **in order of likelihood**:

1. **Client ID Mismatch (MOST COMMON CAUSE)**:
   - **The frontend and backend MUST use the same PayPal Client ID**
   - Frontend uses: `VITE_PAYPAL_SANDBOX_CLIENT_ID` (for local/testing) or `VITE_PAYPAL_LIVE_CLIENT_ID` (for production) from your `.env` or `.env.local` file
   - The frontend automatically selects the correct Client ID based on `VITE_STAGE`:
     - `VITE_STAGE=local` (or not set) → uses `VITE_PAYPAL_SANDBOX_CLIENT_ID`
     - `VITE_STAGE=prod` → uses `VITE_PAYPAL_LIVE_CLIENT_ID`
   - Backend uses: `PAYPAL_SANDBOX_CLIENT_ID` (for testing) or `PAYPAL_LIVE_CLIENT_ID` (for production) in Google Apps Script Properties
   - **Both must be from the same PayPal app** in the Developer Portal
   - The system now automatically detects and reports Client ID mismatches in the browser console
   - **How to fix**: 
     - Check the browser console for Client ID comparison logs (look for "🔑 PayPal Client ID" messages)
     - **Important**: Vite loads `.env.local` with **higher priority** than `.env`
     - For local development, make sure:
       - `VITE_PAYPAL_SANDBOX_CLIENT_ID` in `.env.local` matches `PAYPAL_SANDBOX_CLIENT_ID` in Google Apps Script
       - `VITE_STAGE` is set to `local` (or not set, defaults to `local`) for sandbox testing
       - The dev server was **restarted** after creating/updating `.env.local` (Vite only loads env vars at startup)
     - For production, make sure:
       - `VITE_PAYPAL_LIVE_CLIENT_ID` matches `PAYPAL_LIVE_CLIENT_ID` in Google Apps Script
       - `VITE_STAGE` is set to `prod`
     - Both Client IDs should start with the same characters (first 10 characters should match)
     - Update your `.env.local` file (preferred for local development) or `.env` file, then **restart the dev server**

2. **Verify PayPal Sandbox Business Account**:
   - Log in to https://www.sandbox.paypal.com with your sandbox business account
   - Go to https://www.sandbox.paypal.com/billing/plans
   - Try creating a test plan manually to ensure subscriptions are enabled
   - If you can't access the billing plans page, subscriptions may not be activated
   - **This is required**: Create at least one plan manually to activate the subscription feature

3. **Check PayPal Developer Portal**:
   - Go to https://developer.paypal.com/
   - Navigate to "My Apps & Credentials"
   - Select your app (the one that matches your Client ID)
   - Check "API Permissions" - ensure "Subscriptions" is enabled
   - Verify you're using the correct Client ID and Secret for sandbox/live
   - **Important**: Make sure the frontend and backend are using Client IDs from the **same app**

4. **Environment Mismatch**:
   - Ensure both frontend and backend use the same environment (sandbox vs live)
   - Frontend environment is determined by `VITE_STAGE` (defaults to "local" = sandbox)
   - Backend environment is determined by the `stage` parameter (defaults to "local" = sandbox)
   - The system logs environment information in the browser console

5. **Plan Propagation Delay**:
   - PayPal sometimes needs a few seconds to make newly created plans available
   - The system automatically retries with exponential backoff (up to 4 attempts with 2s, 3s, 4s, 5s delays)
   - If all retries fail, wait 10-30 seconds and try again
   - The system also verifies plan existence before attempting subscription creation

6. **Check Browser Console**:
   - Open browser developer tools (F12) and check the Console tab
   - Look for diagnostic messages starting with 🔑, 🔍, ⚠️, or ❌
   - The system now provides detailed diagnostic information including:
     - Client ID comparison (frontend vs backend)
     - Environment verification (sandbox vs live)
     - Plan verification status
     - Detailed error diagnostics

7. **Check Backend Logs**:
   - The Google Apps Script backend logs plan creation
   - Verify the plan ID starts with "P-" (e.g., `P-5WE314488W427491BNFEVY3Q`)
   - Check that the plan status is "ACTIVE"
   - You can also call the diagnostic endpoint: `GET {BACKEND_URL}?action=diagnostic&stage=local`

8. **Common Issues**:
   - **Wrong environment**: Ensure sandbox credentials are used for testing
   - **Account type**: Personal accounts cannot create subscriptions
   - **API permissions**: Some PayPal apps need explicit subscription API access
   - **Different PayPal apps**: Frontend and backend using Client IDs from different PayPal apps

### 2. Testing
- The integration is currently set to **sandbox mode** for testing
- Use PayPal sandbox accounts to test payments
- Switch to live mode when ready for production

#### Test Credentials
**Sandbox Business Account:**
- **URL**: https://sandbox.paypal.com
- **Email**: sb-t47klu46990970@business.example.com
- **Password**: 0i(Axp.D

#### Testing Steps

**For One-Time Donations:**
1. Go to your donation page: `http://localhost:8080/#/donation`
2. Select "One-time" donation type
3. Fill out the donation form
4. Select PayPal as payment method
5. Click the PayPal button
6. Use the sandbox credentials above to log in
7. Complete the test payment
8. Verify the success message appears

**For Monthly Recurring Donations:**
1. Go to your donation page: `http://localhost:8080/#/donation`
2. Select "Monthly" donation type
3. Fill out the donation form
4. Select PayPal as payment method
5. Click the PayPal button (it will create a subscription plan automatically)
6. Use the sandbox credentials above to log in
7. Complete the subscription setup
8. Verify the success message appears
9. Check your PayPal Sandbox account to confirm the subscription was created

### 6. Security Notes
- ✅ Client ID is safe to expose in frontend code
- ⚠️ Client Secret must be kept secure (server-side only)
- 🔒 Always verify payments on your backend
- 📝 Implement webhook handling for payment confirmations

### 7. Next Steps
1. Test the PayPal integration with sandbox accounts
2. Set up backend payment verification
3. Implement webhook handling for payment confirmations
4. Switch to live mode when ready for production

## 🚀 Features Implemented
- ✅ PayPal Smart Buttons integration
- ✅ One-time and recurring payment support
- ✅ EUR currency support
- ✅ Bilingual support (EN/DE)
- ✅ Form validation before payment
- ✅ Error handling and user feedback
- ✅ Responsive design
