export default function DebugEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  const mask = (val: string) => {
    if (!val) return 'MISSING'
    if (val.length <= 8) return `${val.slice(0, 4)}****`
    return `${val.slice(0, 6)}…${val.slice(-4)} (len=${val.length})`
  }

  return (
    <div style={{ fontFamily: 'monospace', padding: 20 }}>
      <h1>Debug Env</h1>
      <p>Solo desarrollo: muestra variables públicas enmascaradas.</p>
      <ul>
        <li>NEXT_PUBLIC_SUPABASE_URL: {url ? url : 'MISSING'}</li>
        <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: {mask(anon)}</li>
      </ul>
      <p style={{ marginTop: 16, color: '#888' }}>
        Si aparece MISSING, reinicia el dev server para recargar .env.local.
      </p>
    </div>
  )
}
