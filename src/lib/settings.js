/**
 * Settings Management
 * Handles fetching and updating system settings from database
 */

import { supabase } from './supabase'

/**
 * Get a setting value by key
 * @param {string} key - Setting key
 * @returns {Promise<string|null>} Setting value
 */
export async function getSetting(key) {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single()

    if (error) {
      console.error(`Error fetching setting ${key}:`, error)
      return null
    }

    return data?.value || null
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error)
    return null
  }
}

/**
 * Get multiple settings at once
 * @param {string[]} keys - Array of setting keys
 * @returns {Promise<Object>} Object with key-value pairs
 */
export async function getSettings(keys) {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', keys)

    if (error) {
      console.error('Error fetching settings:', error)
      return {}
    }

    // Convert array to object
    const settings = {}
    data.forEach(item => {
      settings[item.key] = item.value
    })

    return settings
  } catch (error) {
    console.error('Error fetching settings:', error)
    return {}
  }
}

/**
 * Get all settings
 * @returns {Promise<Object>} All settings as key-value pairs
 */
export async function getAllSettings() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .order('key')

    if (error) {
      console.error('Error fetching all settings:', error)
      return {}
    }

    // Convert to object for easy access
    const settings = {}
    data.forEach(item => {
      settings[item.key] = {
        value: item.value,
        description: item.description,
        updated_at: item.updated_at
      }
    })

    return settings
  } catch (error) {
    console.error('Error fetching all settings:', error)
    return {}
  }
}

/**
 * Update a setting value
 * @param {string} key - Setting key
 * @param {string} value - New value
 * @returns {Promise<boolean>} Success status
 */
export async function updateSetting(key, value) {
  try {
    const { error } = await supabase
      .from('settings')
      .update({ 
        value: value.toString(),
        updated_at: new Date().toISOString()
      })
      .eq('key', key)

    if (error) {
      console.error(`Error updating setting ${key}:`, error)
      return false
    }

    console.log(`✅ Setting ${key} updated to:`, value)
    return true
  } catch (error) {
    console.error(`Error updating setting ${key}:`, error)
    return false
  }
}

/**
 * Get deposit amount (convenience function)
 * @returns {Promise<number>} Deposit amount in PHP
 */
export async function getDepositAmount() {
  const value = await getSetting('deposit_amount')
  return value ? parseFloat(value) : 20 // Default to 20 if not found
}

/**
 * Check if deposit is enabled
 * @returns {Promise<boolean>} Whether deposit is required
 */
export async function isDepositEnabled() {
  const value = await getSetting('deposit_enabled')
  return value === 'true'
}

/**
 * Get booking expiry hours
 * @returns {Promise<number>} Hours until unpaid booking expires
 */
export async function getBookingExpiryHours() {
  const value = await getSetting('booking_expiry_hours')
  return value ? parseInt(value) : 24
}

/**
 * Check if cash payment is allowed
 * @returns {Promise<boolean>} Whether cash payment is allowed
 */
export async function isCashPaymentAllowed() {
  const value = await getSetting('allow_cash_payment')
  return value === 'true'
}
