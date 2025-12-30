import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    console.warn('⚠️ Supabase env variables are missing. Check your Cloudflare vars or .env file.')
    // En lugar de lanzar un error que rompa el JS, devolvemos un cliente dummy o null
    // Esto evitará el "Uncaught Error" en el navegador.
    return createBrowserClient('https://placeholder.supabase.co', 'placeholder')
  }

  return createBrowserClient(url, anonKey)
}