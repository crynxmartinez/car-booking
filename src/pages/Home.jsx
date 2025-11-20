import { useState } from 'react'
import Navbar from '../components/home/Navbar'
import Hero from '../components/home/Hero'
import NewBookingForm from '../components/home/NewBookingForm'
import Footer from '../components/home/Footer'

export default function Home() {
  const [showBooking, setShowBooking] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero onBookNow={() => setShowBooking(true)} />
        <NewBookingForm isOpen={showBooking} onClose={() => setShowBooking(false)} />
      </main>
      <Footer />
    </div>
  )
}
