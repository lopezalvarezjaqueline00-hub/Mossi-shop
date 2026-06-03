import { createClient } from '@supabase/supabase-js'

export const SUPABASE_STATE_TABLE = 'mossi_state'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const normalizedSupabaseUrl = supabaseUrl.trim()
const normalizedSupabaseAnonKey = supabaseAnonKey.trim()

let supabaseClient

const normalizeSupabaseUrl = (url) =>
  url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')

export const isSupabaseConfigured = () =>
  Boolean(normalizedSupabaseUrl && normalizedSupabaseAnonKey)

export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    return null
  }

  if (!supabaseClient) {
    supabaseClient = createClient(
      normalizeSupabaseUrl(normalizedSupabaseUrl),
      normalizedSupabaseAnonKey,
      {
        auth: {
          persistSession: false,
        },
      },
    )
  }

  return supabaseClient
}
