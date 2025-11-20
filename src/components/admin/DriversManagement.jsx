import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import { Card, CardContent } from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Label from '../ui/Label'
import Select from '../ui/Select'
import { Plus, Edit, Trash2, X, Upload } from 'lucide-react'

export default function DriversManagement() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    photo_url: '',
    phone_number: '',
    license_number: '',
    years_experience: 0,
    languages: ['English', 'Filipino'],
    price_6hrs: 0,
    price_12hrs: 0,
    price_24hrs: 0,
    rating: 5.0,
    status: 'available',
  })

  useEffect(() => {
    fetchDrivers()
  }, [])

  const fetchDrivers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDrivers(data || [])
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
    setLoading(false)
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `drivers/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('driver-photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('driver-photos')
        .getPublicUrl(filePath)

      setFormData({ ...formData, photo_url: publicUrl })
      alert('Photo uploaded successfully!')
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo. Make sure the "driver-photos" bucket exists in Supabase Storage.')
    }
    setUploading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingDriver) {
        const { error } = await supabase
          .from('drivers')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingDriver.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('drivers')
          .insert([formData])

        if (error) throw error
      }

      resetForm()
      fetchDrivers()
      alert(editingDriver ? 'Driver updated successfully!' : 'Driver added successfully!')
    } catch (error) {
      console.error('Error saving driver:', error)
      alert('Failed to save driver')
    }
    setLoading(false)
  }

  const handleEdit = (driver) => {
    setEditingDriver(driver)
    setFormData({
      name: driver.name,
      photo_url: driver.photo_url || '',
      phone_number: driver.phone_number,
      license_number: driver.license_number,
      years_experience: driver.years_experience,
      languages: driver.languages || ['English', 'Filipino'],
      price_6hrs: driver.price_6hrs,
      price_12hrs: driver.price_12hrs,
      price_24hrs: driver.price_24hrs,
      rating: driver.rating,
      status: driver.status,
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this driver?')) return

    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchDrivers()
      alert('Driver deleted successfully!')
    } catch (error) {
      console.error('Error deleting driver:', error)
      alert('Failed to delete driver')
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingDriver(null)
    setFormData({
      name: '',
      photo_url: '',
      phone_number: '',
      license_number: '',
      years_experience: 0,
      languages: ['English', 'Filipino'],
      price_6hrs: 0,
      price_12hrs: 0,
      price_24hrs: 0,
      rating: 5.0,
      status: 'available',
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Drivers Management</h1>
          <p className="text-gray-600 mt-1">Manage your professional drivers</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Driver
        </Button>
      </div>

      {loading && !showForm ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : drivers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 text-lg">No drivers added yet. Click "Add New Driver" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map((driver) => (
            <Card key={driver.id}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4 mb-4">
                  {driver.photo_url ? (
                    <img
                      src={driver.photo_url}
                      alt={driver.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-500">
                        {driver.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{driver.name}</h3>
                    <p className="text-sm text-gray-600">{driver.years_experience} years exp</p>
                    <div className="flex items-center mt-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm ml-1">{driver.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{driver.phone_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">License:</span>
                    <span className="font-medium">{driver.license_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Languages:</span>
                    <span className="font-medium">{driver.languages?.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      driver.status === 'available' ? 'text-green-600' : 
                      driver.status === 'on_duty' ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {driver.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-1 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>6 Hours:</span>
                    <span className="font-semibold">{formatCurrency(driver.price_6hrs)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>12 Hours:</span>
                    <span className="font-semibold">{formatCurrency(driver.price_12hrs)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>24 Hours:</span>
                    <span className="font-semibold">{formatCurrency(driver.price_24hrs)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(driver)} className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(driver.id)}>
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
              <h2 className="text-2xl font-bold">{editingDriver ? 'Edit Driver' : 'Add New Driver'}</h2>
              <button onClick={resetForm}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="license_number">License Number</Label>
                    <Input
                      id="license_number"
                      value={formData.license_number}
                      onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="years_experience">Years of Experience</Label>
                    <Input
                      id="years_experience"
                      type="number"
                      value={formData.years_experience}
                      onChange={(e) => setFormData({...formData, years_experience: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="rating">Rating (1-5)</Label>
                    <Input
                      id="rating"
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={formData.rating}
                      onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value)})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="available">Available</option>
                      <option value="on_duty">On Duty</option>
                      <option value="off_duty">Off Duty</option>
                    </Select>
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

                <div>
                  <Label>Driver Photo</Label>
                  <div className="mt-2 space-y-3">
                    {formData.photo_url && (
                      <div className="relative w-32 h-32 mx-auto border rounded-full overflow-hidden">
                        <img 
                          src={formData.photo_url} 
                          alt="Driver preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, photo_url: ''})}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="driver-photo"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('driver-photo').click()}
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
                            {formData.photo_url ? 'Change Photo' : 'Upload Photo'}
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Upload driver's photo (JPG, PNG, max 5MB)</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Saving...' : (editingDriver ? 'Update Driver' : 'Add Driver')}
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
