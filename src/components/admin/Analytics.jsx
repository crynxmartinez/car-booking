import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { TrendingUp, DollarSign, Car, Users, Calendar, CheckCircle } from 'lucide-react'

export default function Analytics() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthRevenue: 0,
    weekRevenue: 0,
    todayRevenue: 0,
    totalBookings: 0,
    completedBookings: 0,
    activeBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    averageBookingValue: 0,
    topCars: [],
    revenueByDuration: { '6hrs': 0, '12hrs': 0, '24hrs': 0 },
    revenueByType: { city: 0, outside: 0 },
    driverRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (name, brand, model)
        `)

      if (error) throw error

      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const completedBookings = bookings.filter(b => b.status === 'completed')
      
      const totalRevenue = completedBookings.reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0)
      const monthRevenue = completedBookings
        .filter(b => b.created_at >= monthAgo)
        .reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0)
      const weekRevenue = completedBookings
        .filter(b => b.created_at >= weekAgo)
        .reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0)
      const todayRevenue = completedBookings
        .filter(b => b.created_at.split('T')[0] === today)
        .reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0)

      const totalBookings = bookings.length
      const completed = bookings.filter(b => b.status === 'completed').length
      const active = bookings.filter(b => ['approved', 'confirmed', 'in_progress'].includes(b.status)).length
      const pending = bookings.filter(b => b.status === 'pending_review').length
      const cancelled = bookings.filter(b => b.status === 'cancelled').length

      const averageBookingValue = completed > 0 ? totalRevenue / completed : 0

      const carBookings = {}
      bookings.forEach(b => {
        if (b.cars) {
          const carName = b.cars.name
          if (!carBookings[carName]) {
            carBookings[carName] = { name: carName, count: 0, revenue: 0 }
          }
          carBookings[carName].count++
          if (b.status === 'completed') {
            carBookings[carName].revenue += parseFloat(b.car_price || 0)
          }
        }
      })
      const topCars = Object.values(carBookings)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      const revenueByDuration = {
        '6hrs': completedBookings.filter(b => b.rental_duration === '6hrs').reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0),
        '12hrs': completedBookings.filter(b => b.rental_duration === '12hrs').reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0),
        '24hrs': completedBookings.filter(b => b.rental_duration === '24hrs').reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0),
      }

      const revenueByType = {
        city: completedBookings.filter(b => !b.is_outside_city).reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0),
        outside: completedBookings.filter(b => b.is_outside_city).reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0),
      }

      const driverRevenue = completedBookings
        .filter(b => b.needs_driver)
        .reduce((sum, b) => sum + parseFloat(b.driver_price || 0), 0)

      setStats({
        totalRevenue,
        monthRevenue,
        weekRevenue,
        todayRevenue,
        totalBookings,
        completedBookings: completed,
        activeBookings: active,
        pendingBookings: pending,
        cancelledBookings: cancelled,
        averageBookingValue,
        topCars,
        revenueByDuration,
        revenueByType,
        driverRevenue,
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
    setLoading(false)
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
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Statistics</h1>
        <p className="text-gray-600 mt-1">Revenue tracking and business insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            <DollarSign className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-gray-500 mt-1">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
            <Calendar className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.monthRevenue)}</div>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.weekRevenue)}</div>
            <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today</CardTitle>
            <CheckCircle className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.todayRevenue)}</div>
            <p className="text-xs text-gray-500 mt-1">Today's earnings</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Bookings</div>
            <div className="text-2xl font-bold mt-1">{stats.totalBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{stats.completedBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{stats.activeBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.pendingBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Cancelled</div>
            <div className="text-2xl font-bold text-red-600 mt-1">{stats.cancelledBookings}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">6 Hours</span>
                <span className="font-bold text-lg">{formatCurrency(stats.revenueByDuration['6hrs'])}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ 
                    width: `${(stats.revenueByDuration['6hrs'] / stats.totalRevenue * 100) || 0}%` 
                  }}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">12 Hours</span>
                <span className="font-bold text-lg">{formatCurrency(stats.revenueByDuration['12hrs'])}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ 
                    width: `${(stats.revenueByDuration['12hrs'] / stats.totalRevenue * 100) || 0}%` 
                  }}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">24 Hours</span>
                <span className="font-bold text-lg">{formatCurrency(stats.revenueByDuration['24hrs'])}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ 
                    width: `${(stats.revenueByDuration['24hrs'] / stats.totalRevenue * 100) || 0}%` 
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Trip Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Within City</span>
                  <span className="font-bold text-lg">{formatCurrency(stats.revenueByType.city)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full" 
                    style={{ 
                      width: `${(stats.revenueByType.city / stats.totalRevenue * 100) || 0}%` 
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Outside City</span>
                  <span className="font-bold text-lg">{formatCurrency(stats.revenueByType.outside)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full" 
                    style={{ 
                      width: `${(stats.revenueByType.outside / stats.totalRevenue * 100) || 0}%` 
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Driver Services Revenue</span>
                  <span className="font-bold text-xl text-primary">{formatCurrency(stats.driverRevenue)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Cars</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.topCars.length > 0 ? (
              stats.topCars.map((car, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{car.name}</div>
                      <div className="text-sm text-gray-600">{car.count} bookings</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{formatCurrency(car.revenue)}</div>
                    <div className="text-xs text-gray-500">Revenue</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No booking data available yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-2">Average Booking Value</div>
            <div className="text-3xl font-bold text-primary">{formatCurrency(stats.averageBookingValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-2">Completion Rate</div>
            <div className="text-3xl font-bold text-green-600">
              {stats.totalBookings > 0 
                ? `${((stats.completedBookings / stats.totalBookings) * 100).toFixed(1)}%`
                : '0%'
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-2">Cancellation Rate</div>
            <div className="text-3xl font-bold text-red-600">
              {stats.totalBookings > 0 
                ? `${((stats.cancelledBookings / stats.totalBookings) * 100).toFixed(1)}%`
                : '0%'
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
