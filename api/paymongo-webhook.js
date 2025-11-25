/**
 * Vercel Serverless Function: PayMongo Webhook Handler
 * POST /api/paymongo-webhook
 * 
 * Receives payment status updates from PayMongo
 * Updates booking payment status in Supabase
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const PAYMONGO_API_BASE = 'https://api.paymongo.com/v1'
const PAYMONGO_SECRET_KEY = process.env.VITE_PAYMONGO_SECRET_KEY

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const event = req.body.data

    console.log('📥 Webhook received:', {
      type: event.type || req.body.type,
      id: event.id
    })

    // Handle different event types
    const eventType = event.type || req.body.type

    switch (eventType) {
      case 'source.chargeable':
        await handleSourceChargeable(event)
        break

      case 'payment.paid':
        await handlePaymentSuccess(event)
        break

      case 'payment.failed':
        await handlePaymentFailure(event)
        break

      case 'payment.refunded':
      case 'payment.refund.updated':
        console.log('ℹ️ Refund event:', eventType)
        break

      default:
        console.log('ℹ️ Unhandled event type:', eventType)
    }

    // Always return 200 to acknowledge receipt
    return res.status(200).json({ received: true })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    // Still return 200 to prevent PayMongo from retrying
    return res.status(200).json({ received: true, error: error.message })
  }
}

/**
 * Handle source.chargeable event
 * This fires when customer completes GCash payment
 * We need to create a payment to actually charge the source
 */
async function handleSourceChargeable(event) {
  try {
    const source = event.attributes
    const sourceId = event.id
    const amount = source.amount
    const metadata = source.metadata || {}

    console.log('💰 Source chargeable:', {
      sourceId,
      amount,
      bookingRef: metadata.booking_reference
    })

    // Create payment from source
    const paymentData = {
      data: {
        attributes: {
          amount: amount,
          currency: 'PHP',
          description: 'Car Booking Deposit',
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
        'Authorization': `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('❌ Failed to create payment:', responseData)
      return
    }

    const payment = responseData.data

    console.log('✅ Payment created from source:', payment.id)

    // Update booking with payment ID
    if (metadata.booking_id) {
      const { error } = await supabase
        .from('bookings')
        .update({
          payment_id: payment.id,
          payment_method: 'gcash'
        })
        .eq('id', metadata.booking_id)

      if (error) {
        console.error('❌ Failed to update booking:', error)
      } else {
        console.log('✅ Booking updated with payment ID')
      }
    }

  } catch (error) {
    console.error('❌ Error handling source.chargeable:', error)
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(event) {
  try {
    const payment = event.attributes
    const paymentId = event.id

    console.log('✅ Payment successful:', {
      paymentId,
      amount: payment.amount,
      status: payment.status
    })

    // Get source metadata to find booking
    const sourceId = payment.source?.id

    if (!sourceId) {
      console.warn('⚠️ No source ID in payment')
      return
    }

    // Fetch source to get metadata
    const sourceResponse = await fetch(`${PAYMONGO_API_BASE}/sources/${sourceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      }
    })

    const sourceData = await sourceResponse.json()
    const metadata = sourceData.data?.attributes?.metadata || {}

    console.log('📋 Source metadata:', metadata)

    // Update booking in database
    const updateData = {
      payment_status: 'paid',
      payment_date: new Date().toISOString(),
      payment_id: paymentId
    }

    let query = supabase.from('bookings').update(updateData)

    // Try to find booking by ID or reference
    if (metadata.booking_id) {
      query = query.eq('id', metadata.booking_id)
    } else if (metadata.booking_reference) {
      query = query.eq('booking_reference', metadata.booking_reference)
    } else {
      query = query.eq('payment_id', paymentId)
    }

    const { data, error } = await query.select()

    if (error) {
      console.error('❌ Failed to update booking:', error)
      return
    }

    if (data && data.length > 0) {
      console.log('✅ Booking updated:', data[0].booking_reference)
    } else {
      console.warn('⚠️ No booking found for payment:', paymentId)
    }

  } catch (error) {
    console.error('❌ Error handling payment success:', error)
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(event) {
  try {
    const payment = event.attributes
    const paymentId = event.id

    console.log('❌ Payment failed:', {
      paymentId,
      status: payment.status
    })

    // Update booking in database
    const { data, error } = await supabase
      .from('bookings')
      .update({
        payment_status: 'failed'
      })
      .eq('payment_id', paymentId)
      .select()

    if (error) {
      console.error('❌ Failed to update booking:', error)
      return
    }

    if (data && data.length > 0) {
      console.log('✅ Booking marked as failed:', data[0].booking_reference)
    } else {
      console.warn('⚠️ No booking found for payment:', paymentId)
    }

  } catch (error) {
    console.error('❌ Error handling payment failure:', error)
  }
}
