import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        setLoading(true)
        const {
          data: { user: currentUser },
          error: sessionError,
        } = await supabase.auth.getUser()

        if (sessionError && sessionError.status !== 400) {
          console.error('Session restore error:', sessionError)
          setError(sessionError.message)
        }

        if (currentUser) {
          setUser(currentUser)
        }
      } catch (err) {
        console.error('Unexpected error during session restore:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const signUp = async (email, password) => {
    try {
      setError(null)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
        return { success: false, error: signUpError.message }
      }

      // User is created, but may need to verify email depending on Supabase settings
      return { success: true, user: data.user }
    } catch (err) {
      const message = err.message || 'Sign up failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  const signIn = async (email, password) => {
    try {
      setError(null)
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return { success: false, error: signInError.message }
      }

      if (data.user) {
        setUser(data.user)
      }
      return { success: true, user: data.user }
    } catch (err) {
      const message = err.message || 'Sign in failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        setError(signOutError.message)
        return { success: false, error: signOutError.message }
      }

      setUser(null)
      return { success: true }
    } catch (err) {
      const message = err.message || 'Sign out failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
