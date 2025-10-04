import { createClient } from './client'

export async function testSupabaseConnection() {
  try {
    const supabase = createClient()
    
    // Test basic connection by trying to get the session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('Supabase connection test - auth error:', error.message)
      return { success: false, error: error.message }
    }
    
    return { 
      success: true, 
      message: 'Supabase connection successful!',
      session: session ? 'User logged in' : 'No active session'
    }
  } catch (error: any) {
    console.error('Supabase connection failed:', error)
    return { success: false, error: error.message }
  }
}
