const GHL_API_KEY = import.meta.env.VITE_GHL_API_KEY || import.meta.env.GHL_API_KEY
const GHL_LOCATION_ID = import.meta.env.VITE_GHL_LOCATION_ID || import.meta.env.GHL_LOCATION_ID
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

    // Debug: Log incoming data
    console.log('=== GHL Integration Debug ===')
    console.log('Raw booking data:', bookingData)
    
    // Format date and time for GHL
    const bookingDateTime = `${pickup_date} ${pickup_time}`
    const driverInfo = driver_name || 'No Driver'
    const priceFormatted = `₱${parseFloat(total_price || 0).toFixed(2)}`

    console.log('Formatted values:', {
      bookingDateTime,
      driverInfo,
      priceFormatted,
      car_name,
      booking_reference
    })

    // Format status for tag (e.g., "pending_review" -> "pending review - car")
    const statusLabel = status.replace(/_/g, ' ')
    const tagName = `${statusLabel} - car`

    // Prepare contact data with custom fields
    const contactData = {
      locationId: GHL_LOCATION_ID,
      email: customer_email,
      phone: customer_phone,
      name: customer_name,
      tags: [tagName], // Single combined tag
      customFields: [
        { key: 'car', value: car_name || 'N/A' },
        { key: 'booking_date_and_time', value: bookingDateTime },
        { key: 'booking_time', value: pickup_time },
        { key: 'driver', value: driverInfo },
        { key: 'price', value: priceFormatted },
        { key: 'booking_reference', value: booking_reference || 'N/A' },
        { key: 'patient_phone_number', value: customer_phone },
      ],
    }

    console.log('Sending to GHL:', JSON.stringify(contactData, null, 2))

    console.log('API Key (first 10 chars):', GHL_API_KEY?.substring(0, 10))
    console.log('Location ID:', GHL_LOCATION_ID)

    // Use upsert endpoint to handle existing contacts
    const contactResponse = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify(contactData),
    })
    
    console.log('Response status:', contactResponse.status)
    console.log('Response headers:', Object.fromEntries(contactResponse.headers.entries()))

    if (!contactResponse.ok) {
      const errorText = await contactResponse.text()
      console.error('❌ GHL API Error:', errorText)
      console.error('Response status:', contactResponse.status)
      throw new Error(`Failed to create GHL contact: ${contactResponse.status}`)
    }

    const contact = await contactResponse.json()
    console.log('✅ GHL Contact created successfully!')
    console.log('Contact ID:', contact.contact?.id)
    console.log('Full response:', JSON.stringify(contact, null, 2))

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

    // Format status for tag (e.g., "pending_review" -> "pending review - car")
    const statusLabel = newStatus.replace(/_/g, ' ')
    const tagName = `${statusLabel} - car`

    console.log(`Updating GHL contact ${contactId} with tag: ${tagName}`)

    const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify({
        tags: [tagName], // Single combined tag
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
