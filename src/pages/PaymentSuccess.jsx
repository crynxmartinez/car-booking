import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import { CheckCircle, ArrowRight } from 'lucide-react'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

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

  const openWhatsApp = () => {
    const whatsappUrl = `https://wa.me/639479340392?text=car`
    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>

          <p className="text-gray-600 mb-6">
            Your deposit has been received
          </p>

          {/* Booking Reference */}
          {booking && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Booking Reference</p>
              <p className="text-2xl font-bold text-primary">
                {booking.booking_reference}
              </p>
            </div>
          )}

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Deposit Paid:</span>
                <span className="font-semibold text-green-600">
                  ₱{booking?.payment_amount?.toFixed(2) || '20.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold">GCash</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold text-green-600">Confirmed</span>
              </div>
            </div>
          </div>

          {/* WhatsApp Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 mb-3">
              📱 <strong>Next Step:</strong> Get your booking details on WhatsApp
            </p>
            <p className="text-xs text-gray-600 mb-3">
              Click the button below and chat <strong>"car"</strong> to receive your complete booking information
            </p>
            <Button
              onClick={openWhatsApp}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              💬 Chat on WhatsApp
            </Button>
          </div>

          {/* Return Home Button */}
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full"
          >
            Return to Home
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {/* Additional Info */}
          <p className="text-xs text-gray-500 mt-6">
            A confirmation email has been sent to your registered email address
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
