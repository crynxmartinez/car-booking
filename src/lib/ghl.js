const GHL_API_KEY = import.meta.env.VITE_GHL_API_KEY
const GHL_LOCATION_ID = import.meta.env.VITE_GHL_LOCATION_ID
const GHL_API_BASE = 'https://services.leadconnectorhq.com'

export async function sendBookingToGHL(bookingData) {
  try {
    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      console.warn('GHL credentials not configured')
      return { success: false, error: 'GHL not configured' }
    }

    const {
      customer_name,
      customer_email,
      customer_phone,
      pickup_date,
      pickup_time,
      status,
      car_name,
      driver_name,
      total_price,
      booking_reference,
    } = bookingData

    // Format date and time for GHL
    const bookingDateTime = `${pickup_date} ${pickup_time}`
    const driverInfo = driver_name || 'No Driver'
    const priceFormatted = `₱${parseFloat(total_price || 0).toFixed(2)}`

    // Prepare contact data with custom fields
    const contactData = {
      locationId: GHL_LOCATION_ID,
      email: customer_email,
      phone: customer_phone,
      name: customer_name,
      tags: ['car', status], // Add both 'car' and status tag
      customFields: [
        { key: 'car', value: car_name || 'N/A' },
        { key: 'booking_date_and_time', value: bookingDateTime },
        { key: 'booking_time', value: pickup_time },
        { key: 'driver', value: driverInfo },
        { key: 'price', value: priceFormatted },
        { key: 'booking_reference', value: booking_reference || 'N/A' },
      ],
    }

    console.log('Sending to GHL:', contactData)

    const contactResponse = await fetch(`${GHL_API_BASE}/contacts/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify(contactData),
    })

    if (!contactResponse.ok) {
      const errorText = await contactResponse.text()
      console.error('GHL API Error:', errorText)
      throw new Error(`Failed to create GHL contact: ${contactResponse.status}`)
    }

    const contact = await contactResponse.json()
    console.log('GHL Contact created:', contact)

    return {
      success: true,
      contactId: contact.contact?.id,
    }
  } catch (error) {
    console.error('GHL Integration Error:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function updateGHLContactTag(contactId, newStatus) {
  try {
    if (!contactId) return { success: false, error: 'No contact ID' }
    
    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      console.warn('GHL credentials not configured')
      return { success: false, error: 'GHL not configured' }
    }

    console.log(`Updating GHL contact ${contactId} with status: ${newStatus}`)

    const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify({
        tags: ['car', newStatus], // Keep 'car' tag and add new status
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('GHL Tag Update Error:', errorText)
      throw new Error(`Failed to update GHL contact tag: ${response.status}`)
    }

    console.log('GHL contact updated successfully')
    return { success: true }
  } catch (error) {
    console.error('GHL Tag Update Error:', error)
    return { success: false, error: error.message }
  }
}
