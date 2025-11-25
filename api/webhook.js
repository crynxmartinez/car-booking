/**
 * Vercel Serverless Function: Checkout.com Webhook Handler
 * POST /api/webhook
 * 
 * Receives payment status updates from Checkout.com
 * Updates booking payment status in Supabase
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const signature = req.headers['cko-signature']
    const event = req.body

    console.log('📥 Webhook received:', {
      type: event.type,
      id: event.id
    })

    // TODO: Verify webhook signature for security
    // For now, we'll process all webhooks in development
    // In production, implement proper signature verification

    // Handle different event types
    switch (event.type) {
      case 'payment_approved':
      case 'payment_captured':
        await handlePaymentSuccess(event.data)
        break

      case 'payment_declined':
      case 'payment_canceled':
      case 'payment_expired':
        await handlePaymentFailure(event.data)
        break

      case 'payment_pending':
        console.log('ℹ️ Payment pending:', event.data.id)
        break

      default:
        console.log('ℹ️ Unhandled event type:', event.type)
    }

    // Always return 200 to acknowledge receipt
    return res.status(200).json({ received: true })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    // Still return 200 to prevent Checkout.com from retrying
    return res.status(200).json({ received: true, error: error.message })
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentData) {
  try {
    const { id: paymentId, reference, approved_on } = paymentData

    console.log('✅ Payment approved:', {
      paymentId,
      reference,
      approved_on
    })

    // Update booking in database
    const { data, error } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        payment_date: new Date(approved_on).toISOString()
      })
      .eq('payment_id', paymentId)
      .select()

    if (error) {
      console.error('❌ Failed to update booking:', error)
      return
    }

    if (data && data.length > 0) {
      console.log('✅ Booking updated:', data[0].booking_reference)
      
      // TODO: Send confirmation email/SMS
      // TODO: Update GHL contact status
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
async function handlePaymentFailure(paymentData) {
  try {
    const { id: paymentId, reference } = paymentData

    console.log('❌ Payment failed:', {
      paymentId,
      reference
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
      
      // TODO: Send failure notification
      // TODO: Auto-cancel booking after X hours
    } else {
      console.warn('⚠️ No booking found for payment:', paymentId)
    }

  } catch (error) {
    console.error('❌ Error handling payment failure:', error)
  }
}
