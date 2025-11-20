import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase
if (!supabaseUrl || !supabaseAnonKey) {
  // Avoid throwing to keep the app running in development — warn instead.
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set; supabase client will be a noop stub.')

  const noop = async () => ({ data: null, error: null })

  const fakeSupabase = {
    auth: {
      getUser: async () => ({ data: null, error: null }),
      onAuthStateChange: () => ({ data: null, error: null, subscription: { unsubscribe: () => {} } }),
      signUp: noop,
      signInWithPassword: noop,
      signOut: async () => ({ error: null }),
    },
    from: () => ({ select: noop, insert: noop, update: noop, delete: noop }),
    rpc: noop,
  }

  supabase = fakeSupabase
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }
