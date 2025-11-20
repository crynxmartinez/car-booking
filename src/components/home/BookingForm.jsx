import { useState, useEffect } from 'react'
import { X, Calendar, MapPin, Clock, Car as CarIcon, User, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { sendBookingToGHL } from '../../lib/ghl'
import { formatCurrency, generateBookingReference } from '../../lib/utils'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Label from '../ui/Label'
import Select from '../ui/Select'
import Textarea from '../ui/Textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

export default function BookingForm({ isOpen, onClose }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [cars, setCars] = useState([])
  const [drivers, setDrivers] = useState([])
  const [bookingData, setBookingData] = useState({
    pickup_date: '',
    pickup_time: '',
    pickup_location: '',
    dropoff_location: '',
    is_outside_city: false,
    rental_duration: '6hrs',
    selected_car: null,
    needs_driver: false,
    selected_driver: null,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    special_requests: '',
    terms_accepted: false,
  })

  useEffect(() => {
    if (isOpen && step === 3) {
      fetchAvailableCars()
    }
  }, [isOpen, step, bookingData.pickup_date, bookingData.is_outside_city])

  useEffect(() => {
    if (bookingData.needs_driver) {
      fetchAvailableDrivers()
    }
  }, [bookingData.needs_driver])

  const fetchAvailableCars = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('cars')
        .select('*')
        .eq('status', 'active')

      if (bookingData.is_outside_city === false) {
        // Show all cars for city trips
      } else {
        // Only show cars that can go outside city
        query = query.eq('city_only', false)
      }

      const { data, error } = await query

      if (error) throw error

      const availableCars = await filterBookedCars(data)
      setCars(availableCars)
    } catch (error) {
      console.error('Error fetching cars:', error)
    }
    setLoading(false)
  }

  const filterBookedCars = async (allCars) => {
    if (!bookingData.pickup_date) return allCars

    try {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('car_id')
        .eq('pickup_date', bookingData.pickup_date)
        .in('status', ['pending_review', 'approved', 'confirmed', 'in_progress'])

      const bookedCarIds = bookings?.map(b => b.car_id) || []
      return allCars.filter(car => !bookedCarIds.includes(car.id))
    } catch (error) {
      console.error('Error filtering booked cars:', error)
      return allCars
    }
  }

  const fetchAvailableDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'available')

      if (error) throw error
      setDrivers(data || [])
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  const calculateTotalPrice = () => {
    let total = 0
    const duration = bookingData.rental_duration

    if (bookingData.selected_car) {
      const car = cars.find(c => c.id === bookingData.selected_car)
      if (car) {
        total += parseFloat(car[`price_${duration}`] || 0)
      }
    }

    if (bookingData.needs_driver && bookingData.selected_driver) {
      const driver = drivers.find(d => d.id === bookingData.selected_driver)
      if (driver) {
        total += parseFloat(driver[`price_${duration}`] || 0)
      }
    }

    return total
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const car = cars.find(c => c.id === bookingData.selected_car)
      const driver = bookingData.needs_driver 
        ? drivers.find(d => d.id === bookingData.selected_driver)
        : null

      const bookingReference = generateBookingReference()
      const totalPrice = calculateTotalPrice()
      const carPrice = car ? parseFloat(car[`price_${bookingData.rental_duration}`]) : 0
      const driverPrice = driver ? parseFloat(driver[`price_${bookingData.rental_duration}`]) : 0

      const newBooking = {
        booking_reference: bookingReference,
        car_id: bookingData.selected_car,
        driver_id: bookingData.selected_driver,
        customer_name: bookingData.customer_name,
        customer_email: bookingData.customer_email,
        customer_phone: bookingData.customer_phone,
        pickup_location: bookingData.pickup_location,
        dropoff_location: bookingData.dropoff_location,
        pickup_date: bookingData.pickup_date,
        pickup_time: bookingData.pickup_time,
        rental_duration: bookingData.rental_duration,
        is_outside_city: bookingData.is_outside_city,
        needs_driver: bookingData.needs_driver,
        car_price: carPrice,
        driver_price: driverPrice,
        total_price: totalPrice,
        special_requests: bookingData.special_requests,
        status: 'pending_review',
        terms_accepted: bookingData.terms_accepted,
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert([newBooking])
        .select()
        .single()

      if (error) throw error

      await sendBookingToGHL({
        ...newBooking,
        status: 'pending_review',
      })

      alert(`Booking successful! Your reference number is: ${bookingReference}`)
      resetForm()
      onClose()
    } catch (error) {
      console.error('Error creating booking:', error)
      alert('Failed to create booking. Please try again.')
    }
    setLoading(false)
  }

  const resetForm = () => {
    setStep(1)
    setBookingData({
      pickup_date: '',
      pickup_time: '',
      pickup_location: '',
      dropoff_location: '',
      is_outside_city: false,
      rental_duration: '6hrs',
      selected_car: null,
      needs_driver: false,
      selected_driver: null,
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      special_requests: '',
      terms_accepted: false,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-8">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Book Your Car</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {s}
                </div>
                {s < 5 && <div className={`w-12 h-1 mx-2 ${step > s ? 'bg-primary' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">When and where?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pickup_date">Pickup Date</Label>
                  <Input
                    id="pickup_date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingData.pickup_date}
                    onChange={(e) => setBookingData({...bookingData, pickup_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pickup_time">Pickup Time</Label>
                  <Input
                    id="pickup_time"
                    type="time"
                    value={bookingData.pickup_time}
                    onChange={(e) => setBookingData({...bookingData, pickup_time: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pickup_location">Pickup Location</Label>
                  <Input
                    id="pickup_location"
                    placeholder="Enter pickup address"
                    value={bookingData.pickup_location}
                    onChange={(e) => setBookingData({...bookingData, pickup_location: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dropoff_location">Drop-off Location</Label>
                  <Input
                    id="dropoff_location"
                    placeholder="Enter drop-off address"
                    value={bookingData.dropoff_location}
                    onChange={(e) => setBookingData({...bookingData, dropoff_location: e.target.value})}
                    required
                  />
                </div>
              </div>
              <Button 
                onClick={() => setStep(2)} 
                className="w-full"
                disabled={!bookingData.pickup_date || !bookingData.pickup_time || !bookingData.pickup_location}
              >
                Next
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Trip details</h3>
              <div>
                <Label>Where are you going?</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <button
                    onClick={() => setBookingData({...bookingData, is_outside_city: false})}
                    className={`p-4 border-2 rounded-lg ${
                      !bookingData.is_outside_city ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                  >
                    <MapPin className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-semibold">Within City</div>
                  </button>
                  <button
                    onClick={() => setBookingData({...bookingData, is_outside_city: true})}
                    className={`p-4 border-2 rounded-lg ${
                      bookingData.is_outside_city ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                  >
                    <MapPin className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-semibold">Outside City</div>
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="rental_duration">Rental Duration</Label>
                <Select
                  id="rental_duration"
                  value={bookingData.rental_duration}
                  onChange={(e) => setBookingData({...bookingData, rental_duration: e.target.value})}
                >
                  <option value="6hrs">6 Hours</option>
                  <option value="12hrs">12 Hours</option>
                  <option value="24hrs">24 Hours</option>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1">
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Choose your car</h3>
              {loading ? (
                <div className="text-center py-8">Loading available cars...</div>
              ) : cars.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No cars available for the selected date and trip type.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {cars.map((car) => (
                    <Card
                      key={car.id}
                      className={`cursor-pointer transition ${
                        bookingData.selected_car === car.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setBookingData({...bookingData, selected_car: car.id})}
                    >
                      <CardContent className="p-4">
                        {car.images && car.images[0] && (
                          <img 
                            src={car.images[0]} 
                            alt={car.name}
                            className="w-full h-40 object-cover rounded-md mb-3"
                          />
                        )}
                        <h4 className="font-semibold text-lg">{car.name}</h4>
                        <p className="text-sm text-gray-600">{car.brand} {car.model} • {car.year}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-sm text-gray-600">{car.seats} seats</span>
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(car[`price_${bookingData.rental_duration}`])}
                          </span>
                        </div>
                        {bookingData.selected_car === car.id && (
                          <div className="mt-2 flex items-center text-primary">
                            <Check className="w-4 h-4 mr-1" />
                            <span className="text-sm">Selected</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(4)} 
                  className="flex-1"
                  disabled={!bookingData.selected_car}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Need a driver?</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setBookingData({...bookingData, needs_driver: false, selected_driver: null})}
                  className={`p-4 border-2 rounded-lg ${
                    !bookingData.needs_driver ? 'border-primary bg-primary/5' : 'border-gray-200'
                  }`}
                >
                  <User className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-semibold">Self Drive</div>
                </button>
                <button
                  onClick={() => setBookingData({...bookingData, needs_driver: true})}
                  className={`p-4 border-2 rounded-lg ${
                    bookingData.needs_driver ? 'border-primary bg-primary/5' : 'border-gray-200'
                  }`}
                >
                  <User className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-semibold">With Driver</div>
                </button>
              </div>

              {bookingData.needs_driver && (
                <div className="mt-4">
                  <Label>Select Driver</Label>
                  <div className="grid grid-cols-1 gap-3 mt-2 max-h-64 overflow-y-auto">
                    {drivers.map((driver) => (
                      <Card
                        key={driver.id}
                        className={`cursor-pointer transition ${
                          bookingData.selected_driver === driver.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setBookingData({...bookingData, selected_driver: driver.id})}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {driver.photo_url && (
                              <img 
                                src={driver.photo_url} 
                                alt={driver.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <h4 className="font-semibold">{driver.name}</h4>
                              <p className="text-sm text-gray-600">{driver.years_experience} years exp</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-primary">
                              {formatCurrency(driver[`price_${bookingData.rental_duration}`])}
                            </div>
                            {bookingData.selected_driver === driver.id && (
                              <Check className="w-5 h-5 text-primary ml-auto mt-1" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(5)} 
                  className="flex-1"
                  disabled={bookingData.needs_driver && !bookingData.selected_driver}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Your details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">Full Name</Label>
                  <Input
                    id="customer_name"
                    placeholder="Enter your full name"
                    value={bookingData.customer_name}
                    onChange={(e) => setBookingData({...bookingData, customer_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customer_phone">Phone Number</Label>
                  <Input
                    id="customer_phone"
                    type="tel"
                    placeholder="+63 XXX XXX XXXX"
                    value={bookingData.customer_phone}
                    onChange={(e) => setBookingData({...bookingData, customer_phone: e.target.value})}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="customer_email">Email Address</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    placeholder="your@email.com"
                    value={bookingData.customer_email}
                    onChange={(e) => setBookingData({...bookingData, customer_email: e.target.value})}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="special_requests">Special Requests (Optional)</Label>
                  <Textarea
                    id="special_requests"
                    placeholder="Any special requirements?"
                    value={bookingData.special_requests}
                    onChange={(e) => setBookingData({...bookingData, special_requests: e.target.value})}
                  />
                </div>
              </div>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Car Rental ({bookingData.rental_duration})</span>
                    <span className="font-semibold">
                      {formatCurrency(cars.find(c => c.id === bookingData.selected_car)?.[`price_${bookingData.rental_duration}`] || 0)}
                    </span>
                  </div>
                  {bookingData.needs_driver && (
                    <div className="flex justify-between">
                      <span>Driver Service ({bookingData.rental_duration})</span>
                      <span className="font-semibold">
                        {formatCurrency(drivers.find(d => d.id === bookingData.selected_driver)?.[`price_${bookingData.rental_duration}`] || 0)}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(calculateTotalPrice())}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={bookingData.terms_accepted}
                  onChange={(e) => setBookingData({...bookingData, terms_accepted: e.target.checked})}
                  className="mt-1"
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the terms and conditions and consent to be contacted for booking confirmation
                </Label>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className="flex-1"
                  disabled={!bookingData.customer_name || !bookingData.customer_email || !bookingData.customer_phone || !bookingData.terms_accepted || loading}
                >
                  {loading ? 'Submitting...' : 'Confirm Booking'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
