import { Car } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Car className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-gray-900">CarBook</span>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#home" className="text-gray-700 hover:text-primary transition">Home</a>
            <a href="#fleet" className="text-gray-700 hover:text-primary transition">Our Fleet</a>
            <a href="#about" className="text-gray-700 hover:text-primary transition">About</a>
            <a href="#contact" className="text-gray-700 hover:text-primary transition">Contact</a>
          </div>
        </div>
      </div>
    </nav>
  )
}
