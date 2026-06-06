import { createClient } from '@supabase/supabase-js'

export const SUPABASE_STATE_TABLE = 'mossi_state'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const normalizedSupabaseUrl = supabaseUrl.trim()
const normalizedSupabaseAnonKey = supabaseAnonKey.trim()

let supabaseClient

const normalizeSupabaseUrl = (url) =>
  url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')

const isPlaceholderValue = (value) =>
  !value ||
  value === '""' ||
  value === "''" ||
  /your-|tu-|supabase-url|supabase-anon-key/i.test(value)

const hasValidSupabaseUrl = (url) => {
  if (isPlaceholderValue(url)) {
    return false
  }

  try {
    const parsedUrl = new URL(normalizeSupabaseUrl(url))
    return ['http:', 'https:'].includes(parsedUrl.protocol)
  } catch {
    return false
  }
}

const hasValidSupabaseAnonKey = (key) =>
  !isPlaceholderValue(key) && key.length > 20

export const isSupabaseConfigured = () =>
  hasValidSupabaseUrl(normalizedSupabaseUrl) &&
  hasValidSupabaseAnonKey(normalizedSupabaseAnonKey)

export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    return null
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(
        normalizeSupabaseUrl(normalizedSupabaseUrl),
        normalizedSupabaseAnonKey,
        {
          auth: {
            persistSession: false,
          },
        },
      )
    } catch (error) {
      console.warn('Supabase client could not be created:', error.message)
      return null
    }
  }

  return supabaseClient
}
