/**
 * Vercel Serverless Function: Create GCash Payment
 * POST /api/create-payment
 * 
 * Creates a payment request with Checkout.com and returns redirect URL
 */

const CHECKOUT_API_BASE = process.env.VITE_CHECKOUT_ENV === 'production' 
  ? 'https://api.checkout.com' 
  : 'https://api.sandbox.checkout.com'

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      bookingId,
      amount,
      currency = 'PHP',
      reference,
      customer,
      successUrl,
      failureUrl
    } = req.body

    // Validate required fields
    if (!bookingId || !amount || !reference || !customer) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['bookingId', 'amount', 'reference', 'customer']
      })
    }

    // Validate environment variables
    const secretKey = process.env.VITE_CHECKOUT_SECRET_KEY
    const processingChannelId = process.env.VITE_CHECKOUT_PROCESSING_CHANNEL_ID

    if (!secretKey || !processingChannelId) {
      console.error('❌ Checkout.com credentials not configured')
      return res.status(500).json({ error: 'Payment gateway not configured' })
    }

    // Convert amount to cents
    const amountInCents = Math.round(amount * 100)

    console.log('💳 Creating payment:', {
      bookingId,
      amount,
      amountInCents,
      reference,
      customer: customer.name
    })

    // Prepare payment request
    const paymentRequest = {
      amount: amountInCents,
      currency: currency,
      source: {
        type: 'gcash'
      },
      processing: {
        terminal_type: 'WEB',
        os_type: 'WEB'
      },
      success_url: successUrl || `${process.env.VITE_APP_URL}/payment/success?booking_id=${bookingId}`,
      failure_url: failureUrl || `${process.env.VITE_APP_URL}/payment/failure?booking_id=${bookingId}`,
      payment_type: 'Regular',
      reference: reference,
      capture: true,
      customer: {
        name: customer.name,
        email: customer.email
      },
      items: [{
        reference: 'DEPOSIT',
        name: 'Car Booking Deposit',
        unit_price: amountInCents,
        quantity: 1
      }],
      processing_channel_id: processingChannelId
    }

    // Make request to Checkout.com
    const response = await fetch(`${CHECKOUT_API_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentRequest)
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('❌ Checkout.com error:', responseData)
      return res.status(response.status).json({
        error: 'Payment creation failed',
        details: responseData
      })
    }

    // Extract redirect URL
    const redirectUrl = responseData._links?.redirect?.href

    if (!redirectUrl) {
      console.error('❌ No redirect URL in response')
      return res.status(500).json({ error: 'No redirect URL received' })
    }

    console.log('✅ Payment created:', responseData.id)

    // Return success response
    return res.status(200).json({
      success: true,
      paymentId: responseData.id,
      status: responseData.status,
      redirectUrl: redirectUrl,
      reference: responseData.reference
    })

  } catch (error) {
    console.error('❌ Server error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
