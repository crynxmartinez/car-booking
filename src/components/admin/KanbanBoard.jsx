import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { updateGHLContactTag } from '../../lib/ghl'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import Button from '../ui/Button'
import { Calendar, MapPin, Car as CarIcon, User, Phone, Mail, X } from 'lucide-react'

const STATUSES = [
  { id: 'pending_review', label: 'Pending Review', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'approved', label: 'Approved', color: 'bg-blue-100 border-blue-300' },
  { id: 'confirmed', label: 'Confirmed', color: 'bg-green-100 border-green-300' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-purple-100 border-purple-300' },
  { id: 'completed', label: 'Completed', color: 'bg-gray-100 border-gray-300' },
  { id: 'cancelled', label: 'Cancelled', color: 'bg-red-100 border-red-300' },
]

export default function KanbanBoard() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (name, brand, model, images),
          drivers (name, photo_url)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
    setLoading(false)
  }

  const updateBookingStatus = async (bookingId, newStatus, ghlContactId) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (error) throw error

      if (ghlContactId) {
        await updateGHLContactTag(ghlContactId, newStatus)
      }

      fetchBookings()
    } catch (error) {
      console.error('Error updating booking:', error)
      alert('Failed to update booking status')
    }
  }

  const getBookingsByStatus = (status) => {
    return bookings.filter(b => b.status === status)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Bookings Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage all car rental bookings</p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 text-lg">No bookings yet. Bookings will appear here when customers make reservations.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {STATUSES.map((status) => {
            const statusBookings = getBookingsByStatus(status.id)
            return (
              <div key={status.id} className="flex flex-col">
                <div className={`p-3 rounded-t-lg border-2 ${status.color}`}>
                  <h3 className="font-semibold text-sm">{status.label}</h3>
                  <span className="text-xs text-gray-600">{statusBookings.length} bookings</span>
                </div>
                <div className="space-y-2 p-2 bg-gray-50 rounded-b-lg min-h-[200px] max-h-[600px] overflow-y-auto">
                  {statusBookings.map((booking) => (
                    <Card
                      key={booking.id}
                      className="cursor-pointer hover:shadow-md transition"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <CardContent className="p-3">
                        <div className="font-semibold text-sm mb-1">{booking.booking_reference}</div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {booking.customer_name}
                          </div>
                          <div className="flex items-center">
                            <CarIcon className="w-3 h-3 mr-1" />
                            {booking.cars?.name}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {booking.pickup_date}
                          </div>
                          <div className="font-semibold text-primary mt-2">
                            {formatCurrency(booking.total_price)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Booking Details</CardTitle>
                <p className="text-sm text-gray-600 mt-1">{selectedBooking.booking_reference}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)}>
                <X className="w-6 h-6" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Customer Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{selectedBooking.customer_name}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{selectedBooking.customer_phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{selectedBooking.customer_email}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Booking Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <CarIcon className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{selectedBooking.cars?.brand} {selectedBooking.cars?.model} - {selectedBooking.cars?.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{formatDateTime(selectedBooking.pickup_date, selectedBooking.pickup_time)}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    <span>From: {selectedBooking.pickup_location}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    <span>To: {selectedBooking.dropoff_location}</span>
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {selectedBooking.rental_duration}
                  </div>
                  <div>
                    <span className="font-medium">Trip Type:</span> {selectedBooking.is_outside_city ? 'Outside City' : 'Within City'}
                  </div>
                  {selectedBooking.needs_driver && (
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-500" />
                      <span>Driver: {selectedBooking.drivers?.name || 'Assigned'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Pricing</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Car Rental:</span>
                    <span>{formatCurrency(selectedBooking.car_price)}</span>
                  </div>
                  {selectedBooking.needs_driver && (
                    <div className="flex justify-between">
                      <span>Driver Service:</span>
                      <span>{formatCurrency(selectedBooking.driver_price)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-primary">{formatCurrency(selectedBooking.total_price)}</span>
                  </div>
                </div>
              </div>

              {selectedBooking.special_requests && (
                <div>
                  <h4 className="font-semibold mb-2">Special Requests</h4>
                  <p className="text-sm text-gray-700">{selectedBooking.special_requests}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Update Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  {STATUSES.filter(s => s.id !== selectedBooking.status).map((status) => (
                    <Button
                      key={status.id}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateBookingStatus(selectedBooking.id, status.id, selectedBooking.ghl_contact_id)
                        setSelectedBooking(null)
                      }}
                    >
                      Move to {status.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
