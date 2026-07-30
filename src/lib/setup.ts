import { getSupabase } from './supabase'

const supabase = getSupabase()

export async function initializeApp() {
  if (!navigator.onLine) return true
  const { error } = await supabase.from('misiones').select('id', { count: 'exact', head: true })
  if (error && error.code === 'PGRST301') {
    console.warn(
      'Supabase tables not found. Please run the migration SQL in your Supabase dashboard:\n' +
      '1. Go to https://supabase.com/dashboard/project/nsuskftwonycndueahqd/sql/new\n' +
      '2. Copy the contents of supabase/migration.sql\n' +
      '3. Paste and run in the SQL Editor\n' +
      '4. Refresh this page',
    )
    return false
  }
  return true
}
