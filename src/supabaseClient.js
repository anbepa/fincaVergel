
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Prevent crash if keys are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Key is missing. Admin features will not work. Please check your .env file.')
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : { 
      // Mock client to prevent app crash when not configured
      auth: { 
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ error: { message: 'Supabase URL/Key missing in .env' } }),
        signOut: async () => {} 
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { message: 'Supabase not configured' } })
          })
        }),
        upsert: async () => ({ error: { message: 'Supabase not configured' } })
      }),
      storage: {
        from: () => ({
          upload: async () => ({ error: { message: 'Supabase not configured' } }),
          getPublicUrl: () => ({ data: { publicUrl: '' } })
        })
      }
    }
