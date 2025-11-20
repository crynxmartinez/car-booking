import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import { Card, CardContent } from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Label from '../ui/Label'
import Select from '../ui/Select'
import { Plus, Edit, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react'

export default function CarsManagement() {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCar, setEditingCar] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    license_plate: '',
    seats: 4,
    luggage_capacity: 2,
    features: { ac: true, gps: false, bluetooth: true, fuel_type: 'petrol' },
    city_only: false,
    price_6hrs: 0,
    price_12hrs: 0,
    price_24hrs: 0,
    images: [],
    status: 'active',
  })

  useEffect(() => {
    fetchCars()
  }, [])

  const fetchCars = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCars(data || [])
    } catch (error) {
      console.error('Error fetching cars:', error)
    }
    setLoading(false)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `cars/${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('car-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('car-images')
        .getPublicUrl(filePath)

      setFormData({ ...formData, images: [publicUrl] })
      alert('Image uploaded successfully!')
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Make sure the "car-images" bucket exists in Supabase Storage.')
    }
    setUploading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingCar) {
        const { error } = await supabase
          .from('cars')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCar.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('cars')
          .insert([formData])

        if (error) throw error
      }

      resetForm()
      fetchCars()
      alert(editingCar ? 'Car updated successfully!' : 'Car added successfully!')
    } catch (error) {
      console.error('Error saving car:', error)
      alert('Failed to save car')
    }
    setLoading(false)
  }

  const handleEdit = (car) => {
    setEditingCar(car)
    setFormData({
      name: car.name,
      brand: car.brand,
      model: car.model,
      year: car.year,
      color: car.color,
      license_plate: car.license_plate,
      seats: car.seats,
      luggage_capacity: car.luggage_capacity,
      features: car.features || { ac: true, gps: false, bluetooth: true, fuel_type: 'petrol' },
      city_only: car.city_only,
      price_6hrs: car.price_6hrs,
      price_12hrs: car.price_12hrs,
      price_24hrs: car.price_24hrs,
      images: car.images || [],
      status: car.status,
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this car?')) return

    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchCars()
      alert('Car deleted successfully!')
    } catch (error) {
      console.error('Error deleting car:', error)
      alert('Failed to delete car')
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingCar(null)
    setFormData({
      name: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      license_plate: '',
      seats: 4,
      luggage_capacity: 2,
      features: { ac: true, gps: false, bluetooth: true, fuel_type: 'petrol' },
      city_only: false,
      price_6hrs: 0,
      price_12hrs: 0,
      price_24hrs: 0,
      images: [],
      status: 'active',
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cars Management</h1>
          <p className="text-gray-600 mt-1">Manage your fleet of vehicles</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Car
        </Button>
      </div>

      {loading && !showForm ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : cars.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 text-lg">No cars added yet. Click "Add New Car" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <Card key={car.id}>
              <CardContent className="p-4">
                {car.images && car.images[0] && (
                  <img
                    src={car.images[0]}
                    alt={car.name}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                )}
                <h3 className="text-xl font-bold mb-1">{car.name}</h3>
                <p className="text-gray-600 text-sm mb-3">
                  {car.brand} {car.model} • {car.year}
                </p>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">License Plate:</span>
                    <span className="font-medium">{car.license_plate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seats:</span>
                    <span className="font-medium">{car.seats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{car.city_only ? 'City Only' : 'City & Outside'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${car.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                      {car.status}
                    </span>
                  </div>
                </div>
                <div className="border-t pt-3 space-y-1 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>6 Hours:</span>
                    <span className="font-semibold">{formatCurrency(car.price_6hrs)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>12 Hours:</span>
                    <span className="font-semibold">{formatCurrency(car.price_12hrs)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>24 Hours:</span>
                    <span className="font-semibold">{formatCurrency(car.price_24hrs)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(car)} className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(car.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="max-w-2xl w-full my-8">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold">{editingCar ? 'Edit Car' : 'Add New Car'}</h2>
              <button onClick={resetForm}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Car Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({...formData, model: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="license_plate">License Plate</Label>
                    <Input
                      id="license_plate"
                      value={formData.license_plate}
                      onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="seats">Seats</Label>
                    <Input
                      id="seats"
                      type="number"
                      value={formData.seats}
                      onChange={(e) => setFormData({...formData, seats: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="luggage_capacity">Luggage Capacity</Label>
                    <Input
                      id="luggage_capacity"
                      type="number"
                      value={formData.luggage_capacity}
                      onChange={(e) => setFormData({...formData, luggage_capacity: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price_6hrs">Price (6 Hours)</Label>
                    <Input
                      id="price_6hrs"
                      type="number"
                      step="0.01"
                      value={formData.price_6hrs}
                      onChange={(e) => setFormData({...formData, price_6hrs: parseFloat(e.target.value)})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price_12hrs">Price (12 Hours)</Label>
                    <Input
                      id="price_12hrs"
                      type="number"
                      step="0.01"
                      value={formData.price_12hrs}
                      onChange={(e) => setFormData({...formData, price_12hrs: parseFloat(e.target.value)})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price_24hrs">Price (24 Hours)</Label>
                    <Input
                      id="price_24hrs"
                      type="number"
                      step="0.01"
                      value={formData.price_24hrs}
                      onChange={(e) => setFormData({...formData, price_24hrs: parseFloat(e.target.value)})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inactive">Inactive</option>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="city_only"
                      checked={formData.city_only}
                      onChange={(e) => setFormData({...formData, city_only: e.target.checked})}
                    />
                    <Label htmlFor="city_only">City Only (Cannot go outside city)</Label>
                  </div>
                </div>

                <div>
                  <Label>Car Image</Label>
                  <div className="mt-2 space-y-3">
                    {formData.images && formData.images[0] && (
                      <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                        <img 
                          src={formData.images[0]} 
                          alt="Car preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, images: []})}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="car-image"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('car-image').click()}
                        disabled={uploading}
                        className="w-full"
                      >
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            {formData.images && formData.images[0] ? 'Change Image' : 'Upload Image'}
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Upload a photo of the car (JPG, PNG, max 5MB)</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Saving...' : (editingCar ? 'Update Car' : 'Add Car')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
