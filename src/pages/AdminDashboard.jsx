import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LayoutDashboard, Car, Users, BarChart3, LogOut } from 'lucide-react'
import KanbanBoard from '../components/admin/KanbanBoard'
import CarsManagement from '../components/admin/CarsManagement'
import DriversManagement from '../components/admin/DriversManagement'
import Analytics from '../components/admin/Analytics'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Cars', href: '/admin/cars', icon: Car },
    { name: 'Drivers', href: '/admin/drivers', icon: Users },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-primary">CarBook Admin</h1>
            <p className="text-sm text-gray-600 mt-1">Welcome, {user?.username}</p>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={logout}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="ml-64 p-8">
        <Routes>
          <Route path="dashboard" element={<KanbanBoard />} />
          <Route path="cars" element={<CarsManagement />} />
          <Route path="drivers" element={<DriversManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  )
}
