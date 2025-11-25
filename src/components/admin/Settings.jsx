import { useState, useEffect } from 'react'
import { getAllSettings, updateSetting } from '../../lib/settings'
import { showToast } from '../ui/Toast'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Label from '../ui/Label'
import { Save, DollarSign, Clock, CreditCard } from 'lucide-react'

export default function Settings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [depositAmount, setDepositAmount] = useState('20')
  const [depositEnabled, setDepositEnabled] = useState(true)
  const [bookingExpiryHours, setBookingExpiryHours] = useState('24')
  const [allowCashPayment, setAllowCashPayment] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const data = await getAllSettings()
      setSettings(data)

      // Populate form
      if (data.deposit_amount) {
        setDepositAmount(data.deposit_amount.value)
      }
      if (data.deposit_enabled) {
        setDepositEnabled(data.deposit_enabled.value === 'true')
      }
      if (data.booking_expiry_hours) {
        setBookingExpiryHours(data.booking_expiry_hours.value)
      }
      if (data.allow_cash_payment) {
        setAllowCashPayment(data.allow_cash_payment.value === 'true')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      showToast('Failed to load settings', 'error')
    }
    setLoading(false)
  }

  const handleSaveSettings = async () => {
    setSaving(true)

    try {
      // Update all settings
      const updates = [
        updateSetting('deposit_amount', depositAmount),
        updateSetting('deposit_enabled', depositEnabled.toString()),
        updateSetting('booking_expiry_hours', bookingExpiryHours),
        updateSetting('allow_cash_payment', allowCashPayment.toString())
      ]

      await Promise.all(updates)

      showToast('Settings saved successfully', 'success')
      fetchSettings() // Refresh
    } catch (error) {
      console.error('Error saving settings:', error)
      showToast('Failed to save settings', 'error')
    }

    setSaving(false)
  }

  const setPresetAmount = (amount) => {
    setDepositAmount(amount.toString())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Booking Settings
        </h2>

        <div className="space-y-8">
          {/* Deposit Amount */}
          <div className="border-b pb-6">
            <div className="flex items-center mb-4">
              <DollarSign className="w-5 h-5 text-primary mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Deposit Amount
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="depositAmount">Amount (PHP)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-700">₱</span>
                  <Input
                    id="depositAmount"
                    type="number"
                    min="0"
                    step="10"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Current: ₱{depositAmount}
                </p>
              </div>

              <div>
                <Label>Quick Presets</Label>
                <div className="flex gap-2 mt-2">
                  {[20, 50, 100, 200, 500].map((amount) => (
                    <Button
                      key={amount}
                      variant={depositAmount === amount.toString() ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPresetAmount(amount)}
                    >
                      ₱{amount}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="depositEnabled"
                  checked={depositEnabled}
                  onChange={(e) => setDepositEnabled(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <Label htmlFor="depositEnabled" className="mb-0">
                  Require deposit for all bookings
                </Label>
              </div>
            </div>
          </div>

          {/* Booking Expiry */}
          <div className="border-b pb-6">
            <div className="flex items-center mb-4">
              <Clock className="w-5 h-5 text-primary mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Booking Expiry
              </h3>
            </div>

            <div>
              <Label htmlFor="bookingExpiryHours">
                Auto-cancel unpaid bookings after (hours)
              </Label>
              <Input
                id="bookingExpiryHours"
                type="number"
                min="1"
                max="168"
                value={bookingExpiryHours}
                onChange={(e) => setBookingExpiryHours(e.target.value)}
                className="max-w-xs"
              />
              <p className="text-sm text-gray-500 mt-1">
                Unpaid bookings will be automatically cancelled after {bookingExpiryHours} hours
              </p>
            </div>
          </div>

          {/* Payment Options */}
          <div className="border-b pb-6">
            <div className="flex items-center mb-4">
              <CreditCard className="w-5 h-5 text-primary mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Payment Options
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allowCashPayment"
                  checked={allowCashPayment}
                  onChange={(e) => setAllowCashPayment(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <Label htmlFor="allowCashPayment" className="mb-0">
                  Allow cash payment on pickup
                </Label>
              </div>

              <p className="text-sm text-gray-500 ml-6">
                If enabled, customers can choose to pay the full amount in cash when picking up the vehicle
              </p>
            </div>
          </div>

          {/* Last Updated Info */}
          {settings.deposit_amount && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                Last updated: {new Date(settings.deposit_amount.updated_at).toLocaleString()}
              </p>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="min-w-[150px]"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 How it works</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Changes take effect immediately for new bookings</li>
          <li>• Existing bookings are not affected by setting changes</li>
          <li>• Deposit amount can be changed based on demand or season</li>
          <li>• Unpaid bookings are automatically cancelled after expiry time</li>
        </ul>
      </div>
    </div>
  )
}
