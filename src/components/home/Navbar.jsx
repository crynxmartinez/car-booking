import { Car, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Car className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-gray-900">CarBook</span>
          </div>
          <div className="flex items-center space-x-8">
            <div className="hidden md:flex space-x-8">
              <a href="#home" className="text-gray-700 hover:text-primary transition">Home</a>
              <a href="#fleet" className="text-gray-700 hover:text-primary transition">Our Fleet</a>
              <a href="#about" className="text-gray-700 hover:text-primary transition">About</a>
              <a href="#contact" className="text-gray-700 hover:text-primary transition">Contact</a>
            </div>
            <Link 
              to="/admin/login" 
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
            >
              <LogIn className="w-4 h-4" />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
