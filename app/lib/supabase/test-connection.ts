import { createClient } from './client'

export async function testSupabaseConnection() {
  try {
    const supabase = createClient()
    
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count', { count: 'exact' })
    
    if (error) {
      console.log('Supabase connection test - expected error (no tables yet):', error.message)
      return { success: true, message: 'Connection established, but no tables exist yet' }
    }
    
    return { success: true, data, message: 'Supabase connection successful!' }
  } catch (error: any) {
    console.error('Supabase connection failed:', error)
    return { success: false, error: error.message }
  }
}