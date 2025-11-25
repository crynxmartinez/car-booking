import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import { XCircle, RefreshCw, Home, HelpCircle } from 'lucide-react'

export default function PaymentFailure() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)

  const bookingId = searchParams.get('booking_id')

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails()
    } else {
      setLoading(false)
    }
  }, [bookingId])

  const fetchBookingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()

      if (error) throw error

      setBooking(data)
    } catch (error) {
      console.error('Error fetching booking:', error)
    }
    setLoading(false)
  }

  const handleRetryPayment = async () => {
    setRetrying(true)
    
    try {
      // Call API to create new payment
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: booking.payment_amount || 20,
          currency: 'PHP',
          reference: booking.booking_reference,
          customer: {
            name: booking.customer_name,
            email: booking.customer_email
          }
        })
      })

      const data = await response.json()

      if (data.success && data.redirectUrl) {
        // Update payment ID in booking
        await supabase
          .from('bookings')
          .update({ payment_id: data.paymentId })
          .eq('id', booking.id)

        // Redirect to GCash
        window.location.href = data.redirectUrl
      } else {
        alert('Failed to create payment. Please try again or contact support.')
        setRetrying(false)
      }
    } catch (error) {
      console.error('Error retrying payment:', error)
      alert('An error occurred. Please try again.')
      setRetrying(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', payment_status: 'failed' })
        .eq('id', bookingId)

      if (error) throw error

      alert('Booking cancelled successfully')
      navigate('/')
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Failed to cancel booking. Please contact support.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Failure Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Error Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Failed
          </h1>

          <p className="text-gray-600 mb-6">
            Your payment could not be processed
          </p>

          {/* Booking Reference */}
          {booking && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Booking Reference</p>
              <p className="text-2xl font-bold text-orange-600">
                {booking.booking_reference}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Status: Payment Pending
              </p>
            </div>
          )}

          {/* Common Reasons */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <HelpCircle className="w-4 h-4 mr-2" />
              Common Reasons
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Insufficient GCash balance</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Payment was cancelled</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Network connection issue</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Payment timeout</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleRetryPayment}
              disabled={retrying}
              className="w-full bg-primary hover:bg-primary-dark"
            >
              {retrying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Payment
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Home
            </Button>

            <Button
              variant="outline"
              onClick={handleCancelBooking}
              className="w-full text-red-600 border-red-300 hover:bg-red-50"
            >
              Cancel Booking
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 mt-6">
            Your booking is reserved for 24 hours. Complete payment to confirm.
          </p>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Need help? Contact us at support@carbooking.com</p>
        </div>
      </div>
    </div>
  )
}
