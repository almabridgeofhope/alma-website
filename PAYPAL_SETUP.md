# PayPal Integration Setup

## 🔧 PayPal Configuration

### 1. PayPal App Configuration
In your PayPal Developer Dashboard (https://developer.paypal.com/):

1. **Return URL**: `https://yourdomain.com/donation?success=true`
2. **Cancel URL**: `https://yourdomain.com/donation?cancelled=true`
3. **Webhook URL**: `https://yourdomain.com/api/paypal/webhook` (optional)

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
1. Go to your donation page: `http://localhost:8080/#/donation`
2. Fill out the donation form
3. Select PayPal as payment method
4. Click the PayPal button
5. Use the sandbox credentials above to log in
6. Complete the test payment
7. Verify the success message appears

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
