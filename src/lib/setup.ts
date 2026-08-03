import { getSupabase } from './supabase'

const supabase = getSupabase()

export async function initializeApp() {
  if (!navigator.onLine) return true
  const { error } = await supabase.from('misiones').select('id', { count: 'exact', head: true })
  if (error && error.code === 'PGRST301') {
    console.warn(
      'Supabase tables not found. Run migrations with: supabase db push',
    )
    return false
  }
  return true
}
