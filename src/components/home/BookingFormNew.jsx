import { useState, useEffect } from 'react'
import { X, Calendar as CalendarIcon, MapPin, Car as CarIcon, User, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { sendBookingToGHL } from '../../lib/ghl'
import { getDepositAmount, isDepositEnabled } from '../../lib/settings'
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
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [bookingRef, setBookingRef] = useState('')
  const [depositAmount, setDepositAmount] = useState(20)
  const [requireDeposit, setRequireDeposit] = useState(true)
  
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
      fetchDepositSettings()
    }
  }, [isOpen])

  const fetchDepositSettings = async () => {
    try {
      const amount = await getDepositAmount()
      const enabled = await isDepositEnabled()
      setDepositAmount(amount)
      setRequireDeposit(enabled)
      console.log('💰 Deposit settings:', { amount, enabled })
    } catch (error) {
      console.error('Error fetching deposit settings:', error)
      // Use defaults if fetch fails
      setDepositAmount(20)
      setRequireDeposit(true)
    }
  }

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
    
    // Get car price based on duration
    let carPrice = 0
    if (duration === 6) {
      carPrice = parseFloat(selectedCar.price_6hrs) || 0
    } else if (duration === 12) {
      carPrice = parseFloat(selectedCar.price_12hrs) || 0
    } else if (duration === 24) {
      carPrice = parseFloat(selectedCar.price_24hrs) || 0
    }
    
    // Add driver price if needed
    if (needDriver && selectedDriver) {
      if (duration === 6) {
        carPrice += parseFloat(selectedDriver.price_6hrs) || 0
      } else if (duration === 12) {
        carPrice += parseFloat(selectedDriver.price_12hrs) || 0
      } else if (duration === 24) {
        carPrice += parseFloat(selectedDriver.price_24hrs) || 0
      }
    }
    
    // Add outside city surcharge
    if (tripType === 'outside_city') {
      carPrice *= 1.2
    }
    
    return carPrice
  }

  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      const bookingReference = generateBookingReference()
      
      // Create date in Philippine timezone (UTC+8)
      const pickupDateTime = new Date(selectedDate)
      pickupDateTime.setHours(selectedTime, 0, 0, 0)
      
      // Calculate individual prices
      let carPrice = 0
      if (duration === 6) {
        carPrice = parseFloat(selectedCar.price_6hrs) || 0
      } else if (duration === 12) {
        carPrice = parseFloat(selectedCar.price_12hrs) || 0
      } else if (duration === 24) {
        carPrice = parseFloat(selectedCar.price_24hrs) || 0
      }
      
      let driverPrice = 0
      if (needDriver && selectedDriver) {
        if (duration === 6) {
          driverPrice = parseFloat(selectedDriver.price_6hrs) || 0
        } else if (duration === 12) {
          driverPrice = parseFloat(selectedDriver.price_12hrs) || 0
        } else if (duration === 24) {
          driverPrice = parseFloat(selectedDriver.price_24hrs) || 0
        }
      }
      
      // Format date in Philippine timezone (YYYY-MM-DD)
      const year = pickupDateTime.getFullYear()
      const month = String(pickupDateTime.getMonth() + 1).padStart(2, '0')
      const day = String(pickupDateTime.getDate()).padStart(2, '0')
      const formattedDate = `${year}-${month}-${day}`
      
      // Format time (HH:MM:SS)
      const hours = String(pickupDateTime.getHours()).padStart(2, '0')
      const formattedTime = `${hours}:00:00`
      
      const newBooking = {
        booking_reference: bookingReference,
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
        car_id: selectedCar.id,
        driver_id: needDriver ? selectedDriver?.id : null,
        pickup_date: formattedDate,
        pickup_time: formattedTime,
        pickup_location: 'Office',
        dropoff_location: tripType === 'within_city' ? 'Office' : 'Outside City',
        rental_duration: `${duration}hrs`,
        is_outside_city: tripType === 'outside_city',
        needs_driver: needDriver === true,
        car_price: carPrice,
        driver_price: driverPrice,
        total_price: calculatePrice(),
        special_requests: customerData.special_requests || null,
        status: 'pending_review',
        payment_status: 'pending',
        payment_amount: depositAmount
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert([newBooking])
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      // Send to GHL with car and driver names
      const ghlData = {
        ...newBooking,
        car_name: selectedCar.name,
        driver_name: needDriver && selectedDriver ? selectedDriver.name : null,
        status: 'pending_review',
      }
      
      console.log('📤 Sending to GHL from BookingForm:', ghlData)
      
      // Send to GHL and save contact ID (non-blocking)
      sendBookingToGHL(ghlData)
        .then(async (result) => {
          if (result.success && result.contactId) {
            console.log('💾 Saving GHL Contact ID to database:', result.contactId)
            await supabase
              .from('bookings')
              .update({ ghl_contact_id: result.contactId })
              .eq('id', data.id)
            console.log('✅ GHL Contact ID saved successfully')
          }
        })
        .catch(err => console.error('❌ GHL integration failed (non-critical):', err))

      // If deposit is required, initiate payment
      if (requireDeposit) {
        console.log('💳 Initiating payment for ₱' + depositAmount)
        
        try {
          // Create payment via API
          const paymentResponse = await fetch('/api/create-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              bookingId: data.id,
              amount: depositAmount,
              currency: 'PHP',
              reference: bookingReference,
              customer: {
                name: customerData.name,
                email: customerData.email,
                phone: customerData.phone
              },
              successUrl: `${window.location.origin}/payment/success?booking_id=${data.id}`,
              failureUrl: `${window.location.origin}/payment/failure?booking_id=${data.id}`
            })
          })

          const paymentData = await paymentResponse.json()

          if (paymentData.success && paymentData.redirectUrl) {
            console.log('✅ Payment created:', paymentData.paymentId)
            
            // Save payment ID to booking
            await supabase
              .from('bookings')
              .update({ payment_id: paymentData.paymentId })
              .eq('id', data.id)

            // Redirect to GCash payment page
            window.location.href = paymentData.redirectUrl
          } else {
            throw new Error(paymentData.error || 'Failed to create payment')
          }
        } catch (paymentError) {
          console.error('❌ Payment creation failed:', paymentError)
          showToast('Booking created but payment failed. Please contact support.', 'error')
          setLoading(false)
        }
      } else {
        // No deposit required, show success modal
        setBookingRef(bookingReference)
        setShowSuccessModal(true)
        resetForm()
      }
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
                <p className="text-gray-600">Click to view pricing details</p>
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
                      {(car.images?.[0] || car.image_url) && (
                        <img
                          src={car.images?.[0] || car.image_url}
                          alt={car.name}
                          className="w-full h-40 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h4 className="font-semibold text-lg">{car.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{car.brand} {car.model} • {car.year}</p>
                      
                      {/* Show pricing when selected */}
                      {selectedCar?.id === car.id && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Pricing:</p>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">6 Hours:</span>
                            <span className="font-semibold text-primary">{formatCurrency(parseFloat(car.price_6hrs) || 0)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">12 Hours:</span>
                            <span className="font-semibold text-primary">{formatCurrency(parseFloat(car.price_12hrs) || 0)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">24 Hours:</span>
                            <span className="font-semibold text-primary">{formatCurrency(parseFloat(car.price_24hrs) || 0)}</span>
                          </div>
                        </div>
                      )}
                      
                      {!selectedCar || selectedCar?.id !== car.id ? (
                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                          <span>👥 {car.seating_capacity} seats</span>
                          <span>⛽ {car.fuel_type}</span>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {cars.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">No cars available. Please add cars in the admin panel.</p>
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
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4 mb-3">
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
                            </div>
                          </div>
                          
                          {/* Show pricing when selected */}
                          {selectedDriver?.id === driver.id && (
                            <div className="pt-3 border-t space-y-2">
                              <p className="text-xs font-semibold text-gray-700 mb-2">Driver Fees:</p>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">6 Hours:</span>
                                <span className="font-semibold text-primary">+{formatCurrency(parseFloat(driver.price_6hrs) || 0)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">12 Hours:</span>
                                <span className="font-semibold text-primary">+{formatCurrency(parseFloat(driver.price_12hrs) || 0)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">24 Hours:</span>
                                <span className="font-semibold text-primary">+{formatCurrency(parseFloat(driver.price_24hrs) || 0)}</span>
                              </div>
                            </div>
                          )}
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
                <p className="text-gray-600">Select rental duration to see your total price</p>
              </div>

              {/* Selected Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-gray-700">Your Selection:</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Car:</span>
                  <span className="font-medium">{selectedCar?.name}</span>
                </div>
                {needDriver && selectedDriver && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Driver:</span>
                    <span className="font-medium">{selectedDriver?.name}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Trip Type:</span>
                  <span className="font-medium">
                    {tripType === 'within_city' ? 'Within City' : 'Outside City (+20%)'}
                  </span>
                </div>
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
                        {formatCurrency(parseFloat(selectedCar.price_6hrs) || 0)}
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
                      {formatCurrency(parseFloat(selectedCar.price_12hrs) || 0)}
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
                      {formatCurrency(parseFloat(selectedCar.price_24hrs) || 0)}
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
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-lg">Total Price:</span>
                    <span className="font-bold text-2xl text-primary">
                      {formatCurrency(calculatePrice())}
                    </span>
                  </div>
                  
                  {requireDeposit && (
                    <>
                      <div className="flex justify-between text-sm text-green-600 mt-2">
                        <span className="font-medium">Deposit Required:</span>
                        <span className="font-semibold">₱{depositAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Balance Due (on pickup):</span>
                        <span className="font-medium">
                          ₱{(calculatePrice() - depositAmount).toFixed(2)}
                        </span>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                        <p className="text-xs text-blue-800">
                          💳 You'll be redirected to GCash to pay the ₱{depositAmount.toFixed(2)} deposit
                        </p>
                      </div>
                    </>
                  )}
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Successful!</h2>
            <p className="text-gray-600 mb-4">Your reference number:</p>
            <p className="text-3xl font-bold text-primary mb-6">{bookingRef}</p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 mb-3">
                📱 <strong>Next Step:</strong> Click the button below and chat <strong>"car"</strong> to get your booking details.
              </p>
            </div>

            <Button
              onClick={() => {
                const whatsappUrl = `https://wa.me/639479340392?text=car`
                window.open(whatsappUrl, '_blank')
              }}
              className="w-full mb-3 bg-green-500 hover:bg-green-600"
            >
              💬 Chat on WhatsApp
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessModal(false)
                onClose()
              }}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
