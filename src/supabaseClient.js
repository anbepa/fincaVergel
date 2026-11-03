import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Prevent crash if keys are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Key is missing. Admin features will not work. Please check your .env file.')
}

const NOT_CONFIGURED = { data: null, error: { message: 'Supabase not configured' } }

/* Chainable, awaitable stand-in for any query builder:
   supabase.from('x').select('*').eq(...).order(...) → resolves to an error. */
function mockQuery() {
  const q = new Proxy(function () {}, {
    get(_, prop) {
      if (prop === 'then') return (res, rej) => Promise.resolve(NOT_CONFIGURED).then(res, rej)
      return () => q
    },
    apply() { return q },
  })
  return q
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
      from: () => mockQuery(),
      storage: {
        from: () => ({
          upload: async () => ({ error: { message: 'Supabase not configured' } }),
          getPublicUrl: () => ({ data: { publicUrl: '' } })
        })
      }
    }
