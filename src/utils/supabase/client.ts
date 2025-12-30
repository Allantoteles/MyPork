import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!url || !anonKey) {
    console.warn('⚠️ Supabase env variables are missing. The application will not be able to connect to the database.')
  }

  return createBrowserClient(url, anonKey)
}