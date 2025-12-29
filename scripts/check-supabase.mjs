import { createClient } from '@supabase/supabase-js'

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error('Missing env: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  console.log('Connecting to Supabase:', url)
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  })

  const tables = [
    'perfiles',
    'ejercicios',
    'rutinas',
    'ejercicios_rutina',
    'sesiones_entrenamiento',
    'detalles_sesion',
  ]

  for (const t of tables) {
    const { data, error, count } = await supabase
      .from(t)
      .select('*', { count: 'exact', head: true })
    if (error) {
      console.log(`Table ${t}: ERROR`, error.message)
    } else {
      console.log(`Table ${t}: count=${count}`)
    }
  }

  // Sample data preview
  const preview = async (table, columns = '*') => {
    const { data, error } = await supabase.from(table).select(columns).limit(3)
    if (error) {
      console.log(`Preview ${table}: ERROR`, error.message)
    } else {
      console.log(`Preview ${table}:`, data)
    }
  }

  await preview('ejercicios', 'id,nombre,grupo_muscular,icono,usuario_id')
  await preview('rutinas', 'id,nombre,usuario_id,dia_asignado')

  // Column existence checks for ejercicios_rutina
  const { data: colsDia, error: errDia } = await supabase
    .from('ejercicios_rutina')
    .select('id,dia')
    .limit(1)
  console.log('ejercicios_rutina.dia:', errDia ? 'MISSING' : 'OK')

  const { data: colsPlan, error: errPlan } = await supabase
    .from('ejercicios_rutina')
    .select('id,plan_sets')
    .limit(1)
  console.log('ejercicios_rutina.plan_sets:', errPlan ? 'MISSING' : 'OK')

  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
