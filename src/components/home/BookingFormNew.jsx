import { useState, useEffect } from 'react'
import { X, Calendar as CalendarIcon, MapPin, Car as CarIcon, User, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { sendBookingToGHL } from '../../lib/ghl'
import { formatCurrency, generateBookingReference } from '../../lib/utils'
import { showToast } from '../ui/Toast'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Label from '../ui/Label'
import { Card, CardContent } from '../ui/Card'
import Calendar from './Calendar'

export default function BookingFormNew({ isOpen, onClose }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Step 1: Date & Time
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  
  // Step 2: Trip Type
  const [tripType, setTripType] = useState(null)
  
  // Step 3: Cars
  const [cars, setCars] = useState([])
  const [selectedCar, setSelectedCar] = useState(null)
  
  // Step 4: Driver
  const [needDriver, setNeedDriver] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [selectedDriver, setSelectedDriver] = useState(null)
  
  // Step 5: Duration
  const [duration, setDuration] = useState(null)
  
  // Step 6: Customer Details
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    special_requests: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchCars()
      fetchDrivers()
    }
  }, [isOpen])

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('name')
      
      console.log('Cars fetch result:', { data, error, count: data?.length })
      
      if (error) {
        console.error('Error fetching cars:', error)
      }
      
      setCars(data || [])
    } catch (err) {
      console.error('Failed to fetch cars:', err)
    }
  }

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('name')
      
      console.log('Drivers fetch result:', { data, error, count: data?.length })
      
      if (error) {
        console.error('Error fetching drivers:', error)
      }
      
      setDrivers(data || [])
    } catch (err) {
      console.error('Failed to fetch drivers:', err)
    }
  }

  const calculatePrice = () => {
    if (!selectedCar || !duration) return 0
    
    const baseRate = selectedCar.price_per_day
    let price = 0
    
    if (duration === 6) {
      price = baseRate * 0.3
    } else if (duration === 12) {
      price = baseRate * 0.5
    } else if (duration === 24) {
      price = baseRate
    }
    
    if (needDriver && selectedDriver) {
      const driverRate = selectedDriver.rate_per_day
      if (duration === 6) {
        price += driverRate * 0.3
      } else if (duration === 12) {
        price += driverRate * 0.5
      } else if (duration === 24) {
        price += driverRate
      }
    }
    
    if (tripType === 'outside_city') {
      price *= 1.2
    }
    
    return price
  }

  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      const bookingReference = generateBookingReference()
      const pickupDateTime = new Date(selectedDate)
      pickupDateTime.setHours(selectedTime)
      
      const dropoffDateTime = new Date(pickupDateTime)
      dropoffDateTime.setHours(pickupDateTime.getHours() + duration)
      
      const newBooking = {
        booking_reference: bookingReference,
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
        car_id: selectedCar.id,
        driver_id: needDriver ? selectedDriver?.id : null,
        pickup_date: pickupDateTime.toISOString().split('T')[0],
        pickup_time: pickupDateTime.toTimeString().split(' ')[0],
        pickup_location: 'Office',
        dropoff_date: dropoffDateTime.toISOString().split('T')[0],
        dropoff_time: dropoffDateTime.toTimeString().split(' ')[0],
        dropoff_location: tripType === 'within_city' ? 'Office' : 'Outside City',
        trip_type: tripType,
        duration_hours: duration,
        total_price: calculatePrice(),
        special_requests: customerData.special_requests,
        status: 'pending_review'
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert([newBooking])
        .select()
        .single()

      if (error) throw error

      sendBookingToGHL({
        ...newBooking,
        status: 'pending_review',
      }).catch(err => console.error('GHL integration failed (non-critical):', err))

      showToast(`Booking successful! Your reference number is: ${bookingReference}`, 'success', 8000)
      resetForm()
      onClose()
    } catch (error) {
      console.error('Error creating booking:', error)
      showToast('Failed to create booking. Please try again.', 'error')
    }
    setLoading(false)
  }

  const resetForm = () => {
    setStep(1)
    setSelectedDate(null)
    setSelectedTime(null)
    setTripType(null)
    setSelectedCar(null)
    setNeedDriver(null)
    setSelectedDriver(null)
    setDuration(null)
    setCustomerData({
      name: '',
      email: '',
      phone: '',
      special_requests: ''
    })
  }

  if (!isOpen) return null

  const stepLabels = ['Date', 'Trip Type', 'Car', 'Driver', 'Duration', 'Details']

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Book Your Ride</h2>
            <p className="text-sm text-gray-600">Step {step} of 6</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm
                  ${s <= step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}
                `}>
                  {s}
                </div>
                {s < 6 && (
                  <div className={`flex-1 h-1 mx-2 ${s < step ? 'bg-primary' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            {stepLabels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Date & Time */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <CalendarIcon className="w-12 h-12 text-primary mx-auto mb-2" />
                <h3 className="text-xl font-semibold">When do you need the car?</h3>
                <p className="text-gray-600">Select a date and time for pickup</p>
              </div>
              
              <Calendar
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onSelectTime={setSelectedTime}
              />

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedDate || selectedTime === null}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Trip Type */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <MapPin className="w-12 h-12 text-primary mx-auto mb-2" />
                <h3 className="text-xl font-semibold">Where are you going?</h3>
                <p className="text-gray-600">Select your trip type</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Card
                  className={`cursor-pointer transition-all ${
                    tripType === 'within_city'
                      ? 'ring-2 ring-primary shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setTripType('within_city')}
                >
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl mb-4">🏙️</div>
                    <h4 className="font-semibold text-lg">Within City</h4>
                    <p className="text-sm text-gray-600 mt-2">Local trips around the city</p>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${
                    tripType === 'outside_city'
                      ? 'ring-2 ring-primary shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setTripType('outside_city')}
                >
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl mb-4">🌄</div>
                    <h4 className="font-semibold text-lg">Outside City</h4>
                    <p className="text-sm text-gray-600 mt-2">+20% surcharge</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!tripType}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Car Selection */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <CarIcon className="w-12 h-12 text-primary mx-auto mb-2" />
                <h3 className="text-xl font-semibold">Choose Your Car</h3>
                <p className="text-gray-600">Select from our available vehicles</p>
              </div>

              {/* Debug info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                <p className="text-sm">
                  <strong>Debug:</strong> Found {cars.length} car(s). 
                  {cars.length > 0 && ` First car: ${cars[0]?.name || 'No name'}`}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cars.map(car => (
                  <Card
                    key={car.id}
                    className={`cursor-pointer transition-all ${
                      selectedCar?.id === car.id
                        ? 'ring-2 ring-primary shadow-lg'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedCar(car)}
                  >
                    <CardContent className="p-4">
                      {car.image_url && (
                        <img
                          src={car.image_url}
                          alt={car.name}
                          className="w-full h-40 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h4 className="font-semibold text-lg">{car.name}</h4>
                      <p className="text-sm text-gray-600">{car.brand} {car.model}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500">{car.year} • {car.transmission}</span>
                        <span className="font-semibold text-primary">{formatCurrency(car.price_per_day)}/day</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                        <span>👥 {car.seating_capacity} seats</span>
                        <span>⛽ {car.fuel_type}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {cars.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">No cars available. Please add cars in the admin panel.</p>
                  <p className="text-xs">Check browser console (F12) for more details.</p>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  disabled={!selectedCar}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Driver Selection */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <User className="w-12 h-12 text-primary mx-auto mb-2" />
                <h3 className="text-xl font-semibold">Do you need a driver?</h3>
                <p className="text-gray-600">Choose to drive solo or with a professional driver</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Card
                  className={`cursor-pointer transition-all ${
                    needDriver === false
                      ? 'ring-2 ring-primary shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => {
                    setNeedDriver(false)
                    setSelectedDriver(null)
                  }}
                >
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl mb-4">🚗</div>
                    <h4 className="font-semibold text-lg">Drive Solo</h4>
                    <p className="text-sm text-gray-600 mt-2">Self-drive</p>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${
                    needDriver === true
                      ? 'ring-2 ring-primary shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setNeedDriver(true)}
                >
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl mb-4">👨‍✈️</div>
                    <h4 className="font-semibold text-lg">With Driver</h4>
                    <p className="text-sm text-gray-600 mt-2">Professional service</p>
                  </CardContent>
                </Card>
              </div>

              {needDriver === true && (
                <div>
                  <Label className="mb-3 block text-lg font-semibold">Select Your Driver</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {drivers.map(driver => (
                      <Card
                        key={driver.id}
                        className={`cursor-pointer transition-all ${
                          selectedDriver?.id === driver.id
                            ? 'ring-2 ring-primary shadow-lg'
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedDriver(driver)}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          {driver.photo_url ? (
                            <img
                              src={driver.photo_url}
                              alt={driver.name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold">{driver.name}</h4>
                            <p className="text-sm text-gray-600">{driver.license_number}</p>
                            <p className="text-sm font-medium text-primary mt-1">
                              +{formatCurrency(driver.rate_per_day)}/day
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {drivers.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No drivers available. Please add drivers in the admin panel.
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(5)}
                  disabled={needDriver === null || (needDriver === true && !selectedDriver)}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Duration */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Clock className="w-12 h-12 text-primary mx-auto mb-2" />
                <h3 className="text-xl font-semibold">How long do you need the car?</h3>
                <p className="text-gray-600">Select rental duration</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {tripType === 'within_city' && (
                  <Card
                    className={`cursor-pointer transition-all ${
                      duration === 6
                        ? 'ring-2 ring-primary shadow-lg'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setDuration(6)}
                  >
                    <CardContent className="p-8 text-center">
                      <Clock className="w-12 h-12 text-primary mx-auto mb-3" />
                      <h4 className="font-semibold text-xl">6 Hours</h4>
                      <p className="text-sm text-gray-600 mt-2">Half day</p>
                      <p className="text-lg font-bold text-primary mt-3">
                        {formatCurrency(selectedCar.price_per_day * 0.3)}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card
                  className={`cursor-pointer transition-all ${
                    duration === 12
                      ? 'ring-2 ring-primary shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setDuration(12)}
                >
                  <CardContent className="p-8 text-center">
                    <Clock className="w-12 h-12 text-primary mx-auto mb-3" />
                    <h4 className="font-semibold text-xl">12 Hours</h4>
                    <p className="text-sm text-gray-600 mt-2">Extended</p>
                    <p className="text-lg font-bold text-primary mt-3">
                      {formatCurrency(selectedCar.price_per_day * 0.5)}
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${
                    duration === 24
                      ? 'ring-2 ring-primary shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setDuration(24)}
                >
                  <CardContent className="p-8 text-center">
                    <Clock className="w-12 h-12 text-primary mx-auto mb-3" />
                    <h4 className="font-semibold text-xl">24 Hours</h4>
                    <p className="text-sm text-gray-600 mt-2">Full day</p>
                    <p className="text-lg font-bold text-primary mt-3">
                      {formatCurrency(selectedCar.price_per_day)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {duration && (
                <div className="bg-primary/10 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">Total Estimated Price</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(calculatePrice())}</p>
                  {tripType === 'outside_city' && (
                    <p className="text-xs text-gray-500 mt-2">(includes 20% outside city surcharge)</p>
                  )}
                  {needDriver && selectedDriver && (
                    <p className="text-xs text-gray-500 mt-1">
                      (includes driver fee)
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(4)}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(6)}
                  disabled={!duration}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 6: Customer Details */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <User className="w-12 h-12 text-primary mx-auto mb-2" />
                <h3 className="text-xl font-semibold">Your Information</h3>
                <p className="text-gray-600">We need your details to confirm the booking</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={customerData.name}
                    onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                    placeholder="+63 912 345 6789"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="special_requests">Special Requests (Optional)</Label>
                  <textarea
                    id="special_requests"
                    value={customerData.special_requests}
                    onChange={(e) => setCustomerData({ ...customerData, special_requests: e.target.value })}
                    placeholder="Any special requirements or notes..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Booking Summary */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <h4 className="font-semibold text-lg mb-4">Booking Summary</h4>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="font-medium">
                    {selectedDate?.toLocaleDateString()} at {selectedTime}:00
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Trip Type:</span>
                  <span className="font-medium">
                    {tripType === 'within_city' ? 'Within City' : 'Outside City'}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Car:</span>
                  <span className="font-medium">{selectedCar?.name}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Driver:</span>
                  <span className="font-medium">
                    {needDriver ? selectedDriver?.name : 'Self-drive'}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{duration} hours</span>
                </div>

                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-lg">Total Price:</span>
                    <span className="font-bold text-2xl text-primary">
                      {formatCurrency(calculatePrice())}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(5)}>
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!customerData.name || !customerData.email || !customerData.phone || loading}
                >
                  {loading ? 'Processing...' : 'Confirm Booking'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
