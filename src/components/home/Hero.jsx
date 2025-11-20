import Button from '../ui/Button'
import { Calendar, Clock, MapPin } from 'lucide-react'

export default function Hero({ onBookNow }) {
  return (
    <section id="home" className="relative bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Your Journey Starts Here
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Premium car rental service with flexible hours and professional drivers
          </p>
          <Button 
            size="lg" 
            onClick={onBookNow}
            className="bg-white text-primary hover:bg-gray-100"
          >
            Book Your Car Now
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Flexible Booking</h3>
            <p className="text-blue-100">Choose 6, 12, or 24-hour rentals</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">City & Beyond</h3>
            <p className="text-blue-100">Cars for city trips and long journeys</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Professional Drivers</h3>
            <p className="text-blue-100">Optional experienced drivers available</p>
          </div>
        </div>
      </div>
    </section>
  )
}
