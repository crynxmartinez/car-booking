/**
 * Checkout.com GCash Payment Integration
 * Handles payment creation and verification
 */

const CHECKOUT_API_BASE = import.meta.env.VITE_CHECKOUT_ENV === 'production' 
  ? 'https://api.checkout.com' 
  : 'https://api.sandbox.checkout.com'

const CHECKOUT_SECRET_KEY = import.meta.env.VITE_CHECKOUT_SECRET_KEY
const CHECKOUT_PUBLIC_KEY = import.meta.env.VITE_CHECKOUT_PUBLIC_KEY
const CHECKOUT_PROCESSING_CHANNEL_ID = import.meta.env.VITE_CHECKOUT_PROCESSING_CHANNEL_ID

/**
 * Create a GCash payment request
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object>} Payment response with redirect URL
 */
export async function createGCashPayment(paymentData) {
  try {
    if (!CHECKOUT_SECRET_KEY || !CHECKOUT_PROCESSING_CHANNEL_ID) {
      console.error('Checkout.com credentials not configured')
      return { success: false, error: 'Payment gateway not configured' }
    }

    const {
      amount, // Amount in PHP (will be converted to cents)
      currency = 'PHP',
      reference, // Booking reference
      customer,
      successUrl,
      failureUrl,
      items = []
    } = paymentData

    // Convert amount to cents (Checkout.com uses smallest currency unit)
    const amountInCents = Math.round(amount * 100)

    console.log('💳 Creating GCash payment:', {
      amount,
      amountInCents,
      reference,
      customer: customer.name
    })

    const requestBody = {
      amount: amountInCents,
      currency: currency,
      source: {
        type: 'gcash'
      },
      processing: {
        terminal_type: 'WEB',
        os_type: 'WEB'
      },
      success_url: successUrl,
      failure_url: failureUrl,
      payment_type: 'Regular',
      reference: reference,
      capture: true,
      customer: {
        name: customer.name,
        email: customer.email
      },
      items: items.length > 0 ? items : [{
        reference: 'DEPOSIT',
        name: 'Car Booking Deposit',
        unit_price: amountInCents,
        quantity: 1
      }],
      processing_channel_id: CHECKOUT_PROCESSING_CHANNEL_ID
    }

    console.log('📤 Sending payment request to Checkout.com')

    const response = await fetch(`${CHECKOUT_API_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CHECKOUT_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const responseData = await response.json()

    console.log('📥 Checkout.com response status:', response.status)

    if (!response.ok) {
      console.error('❌ Payment creation failed:', responseData)
      return {
        success: false,
        error: responseData.error_type || 'Payment creation failed',
        details: responseData
      }
    }

    // Extract redirect URL from response
    const redirectUrl = responseData._links?.redirect?.href

    if (!redirectUrl) {
      console.error('❌ No redirect URL in response:', responseData)
      return {
        success: false,
        error: 'No redirect URL received'
      }
    }

    console.log('✅ Payment created successfully')
    console.log('Payment ID:', responseData.id)
    console.log('Redirect URL:', redirectUrl)

    return {
      success: true,
      paymentId: responseData.id,
      status: responseData.status,
      redirectUrl: redirectUrl,
      reference: responseData.reference
    }

  } catch (error) {
    console.error('❌ Checkout.com integration error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Get payment details by payment ID
 * @param {string} paymentId - Checkout.com payment ID
 * @returns {Promise<Object>} Payment details
 */
export async function getPaymentDetails(paymentId) {
  try {
    if (!CHECKOUT_SECRET_KEY) {
      return { success: false, error: 'Payment gateway not configured' }
    }

    console.log('🔍 Fetching payment details for:', paymentId)

    const response = await fetch(`${CHECKOUT_API_BASE}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CHECKOUT_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Failed to fetch payment details:', data)
      return { success: false, error: 'Failed to fetch payment details' }
    }

    console.log('✅ Payment details retrieved:', data.status)

    return {
      success: true,
      payment: data
    }

  } catch (error) {
    console.error('❌ Error fetching payment details:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Verify webhook signature (for security)
 * @param {string} signature - Signature from Cko-Signature header
 * @param {string} body - Raw request body
 * @returns {boolean} Whether signature is valid
 */
export function verifyWebhookSignature(signature, body) {
  // TODO: Implement signature verification
  // For now, return true in development
  if (import.meta.env.DEV) {
    return true
  }
  
  // In production, implement proper signature verification
  // using the webhook secret key from Checkout.com
  return true
}
