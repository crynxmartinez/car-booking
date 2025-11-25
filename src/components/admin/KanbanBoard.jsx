import { useState, useEffect } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import { supabase } from '../../lib/supabase'
import { updateGHLContactTag } from '../../lib/ghl'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import { showToast } from '../ui/Toast'
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

function DroppableColumn({ status, bookings, onCardClick }) {
  const { setNodeRef } = useDroppable({
    id: status.id,
  })

  return (
    <div ref={setNodeRef} className="flex flex-col min-w-0">
      <div className={`p-3 rounded-t-lg border-2 ${status.color}`}>
        <h3 className="font-semibold text-sm">{status.label}</h3>
        <span className="text-xs text-gray-600">{bookings.length} bookings</span>
      </div>
      <SortableContext items={bookings.map(b => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 p-2 bg-gray-50 rounded-b-lg min-h-[200px] max-h-[600px] overflow-y-auto overflow-x-hidden">
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              No bookings
            </div>
          ) : (
            bookings.map((booking) => (
              <DraggableBookingCard
                key={booking.id}
                booking={booking}
                onClick={onCardClick}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

function DraggableBookingCard({ booking, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: booking.id,
    data: { booking },
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className="cursor-move hover:shadow-md transition-shadow"
        onClick={(e) => {
          e.stopPropagation()
          if (!isDragging) {
            onClick(booking)
          }
        }}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="font-semibold text-sm">{booking.booking_reference}</div>
            {booking.payment_status && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                booking.payment_status === 'paid' 
                  ? 'bg-green-100 text-green-700' 
                  : booking.payment_status === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {booking.payment_status === 'paid' ? '✓ Paid' : 
                 booking.payment_status === 'pending' ? '⏳ Pending' : '✗ Failed'}
              </span>
            )}
          </div>
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
    </div>
  )
}

export default function KanbanBoard() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [activeBooking, setActiveBooking] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

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
    console.log('🔄 Kanban: Updating booking status')
    console.log('Booking ID:', bookingId)
    console.log('New Status:', newStatus)
    console.log('GHL Contact ID:', ghlContactId)
    
    // Optimistic update - update UI immediately
    setBookings(prevBookings => 
      prevBookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus, updated_at: new Date().toISOString() }
          : booking
      )
    )

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (error) {
        console.error('❌ Supabase update failed:', error)
        throw error
      }
      
      console.log('✅ Supabase booking status updated successfully')

      // Update GHL in background (non-blocking)
      if (ghlContactId) {
        console.log('📤 Sending tag update to GHL...')
        console.log('Contact ID:', ghlContactId)
        console.log('New tag will be:', `${newStatus.replace(/_/g, ' ')} - car`)
        
        updateGHLContactTag(ghlContactId, newStatus)
          .then(result => {
            console.log('✅ GHL tag update result:', result)
          })
          .catch(err => {
            console.error('❌ GHL update failed (non-critical):', err)
          })
      } else {
        console.warn('⚠️ No GHL Contact ID - skipping GHL update')
      }
    } catch (error) {
      console.error('❌ Error updating booking:', error)
      showToast('Failed to update booking status', 'error')
      // Revert on error
      fetchBookings()
    }
  }

  const getBookingsByStatus = (status) => {
    return bookings.filter(b => b.status === status)
  }

  const handleDragStart = (event) => {
    const booking = event.active.data.current?.booking
    setActiveBooking(booking)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    
    console.log('🎯 Drag ended')
    console.log('Active (dragged):', active.data.current?.booking)
    console.log('Over (target):', over?.id)
    
    setActiveBooking(null)
    
    if (!over) {
      console.log('⚠️ No drop target')
      return
    }

    const draggedBooking = active.data.current?.booking
    
    // Check if dropped on a column (status ID)
    let targetStatus = over.id
    
    // If dropped on another card, get that card's status
    if (over.data.current?.booking) {
      targetStatus = over.data.current.booking.status
      console.log('📍 Dropped on another card, using its status:', targetStatus)
    } else {
      console.log('📍 Dropped on column:', targetStatus)
    }

    // Update if it's a valid status and different from current
    if (draggedBooking && STATUSES.find(s => s.id === targetStatus)) {
      if (draggedBooking.status !== targetStatus) {
        console.log(`✅ Status change detected: ${draggedBooking.status} → ${targetStatus}`)
        updateBookingStatus(draggedBooking.id, targetStatus, draggedBooking.ghl_contact_id)
      } else {
        console.log('ℹ️ Same status, no update needed')
      }
    } else {
      console.log('❌ Invalid target status or no booking data')
    }
  }

  const handleDragCancel = () => {
    setActiveBooking(null)
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
        <p className="text-gray-600 mt-1">Manage all car rental bookings. Drag cards to change status.</p>
      </div>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => {
            const statusBookings = getBookingsByStatus(status.id)
            return (
              <DroppableColumn key={status.id} status={status} bookings={statusBookings} onCardClick={setSelectedBooking} />
            )
          })}
        </div>
        <DragOverlay 
          dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
        >
          {activeBooking ? (
            <Card className="cursor-move shadow-2xl rotate-3 scale-105 opacity-90">
              <CardContent className="p-3">
                <div className="font-semibold text-sm mb-1">{activeBooking.booking_reference}</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {activeBooking.customer_name}
                  </div>
                  <div className="flex items-center">
                    <CarIcon className="w-3 h-3 mr-1" />
                    {activeBooking.cars?.name}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {activeBooking.pickup_date}
                  </div>
                  <div className="font-semibold text-primary mt-2">
                    {formatCurrency(activeBooking.total_price)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
