/**
 * Vercel Serverless Function: Create GCash Payment
 * POST /api/create-payment
 * 
 * Creates a payment source with PayMongo and returns redirect URL
 */

const PAYMONGO_API_BASE = 'https://api.paymongo.com/v1'

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
    const secretKey = process.env.VITE_PAYMONGO_SECRET_KEY

    if (!secretKey) {
      console.error('❌ PayMongo credentials not configured')
      return res.status(500).json({ error: 'Payment gateway not configured' })
    }

    // Convert amount to centavos (PayMongo uses centavos for PHP)
    const amountInCentavos = Math.round(amount * 100)

    console.log('💳 Creating GCash payment source:', {
      bookingId,
      amount,
      amountInCentavos,
      reference,
      customer: customer.name
    })

    // Prepare payment source request (GCash)
    const sourceData = {
      data: {
        attributes: {
          type: 'gcash',
          amount: amountInCentavos,
          currency: currency,
          redirect: {
            success: successUrl || `${process.env.VITE_APP_URL}/payment/success?booking_id=${bookingId}`,
            failed: failureUrl || `${process.env.VITE_APP_URL}/payment/failure?booking_id=${bookingId}`
          },
          billing: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone || '09000000000'
          },
          metadata: {
            booking_reference: reference,
            booking_id: bookingId
          }
        }
      }
    }

    // Make request to PayMongo
    const response = await fetch(`${PAYMONGO_API_BASE}/sources`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sourceData)
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('❌ PayMongo error:', responseData)
      return res.status(response.status).json({
        error: 'Payment creation failed',
        details: responseData
      })
    }

    const source = responseData.data

    // Extract redirect URL
    const redirectUrl = source.attributes.redirect?.checkout_url

    if (!redirectUrl) {
      console.error('❌ No redirect URL in response')
      return res.status(500).json({ error: 'No redirect URL received' })
    }

    console.log('✅ Payment source created:', source.id)

    // Return success response
    return res.status(200).json({
      success: true,
      paymentId: source.id,
      status: source.attributes.status,
      redirectUrl: redirectUrl,
      reference: reference
    })

  } catch (error) {
    console.error('❌ Server error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
