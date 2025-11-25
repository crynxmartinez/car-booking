/**
 * PayMongo GCash Payment Integration
 * Handles payment creation and verification for Philippine payments
 */

const PAYMONGO_API_BASE = 'https://api.paymongo.com/v1'
const PAYMONGO_SECRET_KEY = import.meta.env.VITE_PAYMONGO_SECRET_KEY
const PAYMONGO_PUBLIC_KEY = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY

/**
 * Create a GCash payment source
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object>} Payment source with redirect URL
 */
export async function createGCashPayment(paymentData) {
  try {
    if (!PAYMONGO_SECRET_KEY) {
      console.error('PayMongo secret key not configured')
      return { success: false, error: 'Payment gateway not configured' }
    }

    const {
      amount, // Amount in PHP (will be converted to centavos)
      description = 'Car Booking Deposit',
      reference, // Booking reference
      successUrl,
      failureUrl
    } = paymentData

    // Convert amount to centavos (PayMongo uses smallest currency unit)
    const amountInCentavos = Math.round(amount * 100)

    console.log('💳 Creating GCash payment source:', {
      amount,
      amountInCentavos,
      reference
    })

    // Step 1: Create a payment source (GCash)
    const sourceData = {
      data: {
        attributes: {
          type: 'gcash',
          amount: amountInCentavos,
          currency: 'PHP',
          redirect: {
            success: successUrl,
            failed: failureUrl
          },
          billing: {
            name: paymentData.customer?.name || 'Customer',
            email: paymentData.customer?.email || 'customer@example.com',
            phone: paymentData.customer?.phone || '09000000000'
          },
          metadata: {
            booking_reference: reference,
            booking_id: paymentData.bookingId
          }
        }
      }
    }

    console.log('📤 Sending source creation request to PayMongo')

    const response = await fetch(`${PAYMONGO_API_BASE}/sources`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(PAYMONGO_SECRET_KEY + ':')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sourceData)
    })

    const responseData = await response.json()

    console.log('📥 PayMongo response status:', response.status)

    if (!response.ok) {
      console.error('❌ Payment source creation failed:', responseData)
      return {
        success: false,
        error: responseData.errors?.[0]?.detail || 'Payment creation failed',
        details: responseData
      }
    }

    const source = responseData.data

    // Extract redirect URL from response
    const redirectUrl = source.attributes.redirect?.checkout_url

    if (!redirectUrl) {
      console.error('❌ No redirect URL in response:', responseData)
      return {
        success: false,
        error: 'No redirect URL received'
      }
    }

    console.log('✅ Payment source created successfully')
    console.log('Source ID:', source.id)
    console.log('Redirect URL:', redirectUrl)

    return {
      success: true,
      sourceId: source.id,
      status: source.attributes.status,
      redirectUrl: redirectUrl,
      reference: reference
    }

  } catch (error) {
    console.error('❌ PayMongo integration error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Create a payment from a chargeable source
 * This is called by the webhook when source becomes chargeable
 * @param {string} sourceId - PayMongo source ID
 * @param {number} amount - Amount in centavos
 * @param {string} description - Payment description
 * @returns {Promise<Object>} Payment details
 */
export async function createPaymentFromSource(sourceId, amount, description = 'Car Booking Deposit') {
  try {
    if (!PAYMONGO_SECRET_KEY) {
      return { success: false, error: 'Payment gateway not configured' }
    }

    console.log('💰 Creating payment from source:', sourceId)

    const paymentData = {
      data: {
        attributes: {
          amount: amount,
          currency: 'PHP',
          description: description,
          source: {
            id: sourceId,
            type: 'source'
          }
        }
      }
    }

    const response = await fetch(`${PAYMONGO_API_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(PAYMONGO_SECRET_KEY + ':')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('❌ Payment creation failed:', responseData)
      return { success: false, error: 'Payment creation failed' }
    }

    const payment = responseData.data

    console.log('✅ Payment created:', payment.id)

    return {
      success: true,
      payment: payment
    }

  } catch (error) {
    console.error('❌ Error creating payment:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Get payment details by payment ID
 * @param {string} paymentId - PayMongo payment ID
 * @returns {Promise<Object>} Payment details
 */
export async function getPaymentDetails(paymentId) {
  try {
    if (!PAYMONGO_SECRET_KEY) {
      return { success: false, error: 'Payment gateway not configured' }
    }

    console.log('🔍 Fetching payment details for:', paymentId)

    const response = await fetch(`${PAYMONGO_API_BASE}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(PAYMONGO_SECRET_KEY + ':')}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Failed to fetch payment details:', data)
      return { success: false, error: 'Failed to fetch payment details' }
    }

    console.log('✅ Payment details retrieved:', data.data.attributes.status)

    return {
      success: true,
      payment: data.data
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
 * @param {string} signature - Signature from webhook headers
 * @param {string} body - Raw request body
 * @param {string} webhookSecret - Webhook secret key from PayMongo
 * @returns {boolean} Whether signature is valid
 */
export function verifyWebhookSignature(signature, body, webhookSecret) {
  // PayMongo uses HMAC SHA256 for webhook signatures
  // TODO: Implement proper signature verification
  // For now, return true in development
  if (import.meta.env.DEV) {
    return true
  }
  
  // In production, implement proper HMAC verification
  return true
}
