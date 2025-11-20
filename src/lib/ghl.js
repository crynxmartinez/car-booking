const GHL_API_KEY = import.meta.env.VITE_GHL_API_KEY
const GHL_LOCATION_ID = import.meta.env.VITE_GHL_LOCATION_ID
const GHL_API_BASE = 'https://services.leadconnectorhq.com'

export async function sendBookingToGHL(bookingData) {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      pickup_location,
      pickup_date,
      pickup_time,
      status,
    } = bookingData

    const contactResponse = await fetch(`${GHL_API_BASE}/contacts/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify({
        locationId: GHL_LOCATION_ID,
        email: customer_email,
        phone: customer_phone,
        name: customer_name,
        address1: pickup_location,
        tags: [status],
      }),
    })

    if (!contactResponse.ok) {
      throw new Error('Failed to create GHL contact')
    }

    const contact = await contactResponse.json()

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

export async function updateGHLContactTag(contactId, newTag) {
  try {
    if (!contactId) return { success: false, error: 'No contact ID' }

    const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify({
        tags: [newTag],
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to update GHL contact tag')
    }

    return { success: true }
  } catch (error) {
    console.error('GHL Tag Update Error:', error)
    return { success: false, error: error.message }
  }
}
