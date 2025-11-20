import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
  try {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount)
  } catch (error) {
    return `₱${parseFloat(amount).toFixed(2)}`
  }
}

export function generateBookingReference() {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 7)
  return `BK-${timestamp}-${randomStr}`.toUpperCase()
}

export function formatDate(date) {
  try {
    return new Intl.DateFormat('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date))
  } catch (error) {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
}

export function formatDateTime(date, time) {
  return `${formatDate(date)} at ${time}`
}
