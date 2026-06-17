import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { requestNotificationPermission } from '@/lib/notifications'
import type { User } from '@supabase/supabase-js'

interface AuthContextValue {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)

      // Ensure profile exists for the initial session (covers OAuth logins)
      if (session?.user) {
        ensureProfile(session.user)
        requestNotificationPermission(session.user.id).catch(console.error)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)

        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (session?.user) {
            // Defer to avoid recursion inside onAuthStateChange
            setTimeout(() => {
              ensureProfile(session.user)
              requestNotificationPermission(session.user.id).catch(console.error)
            }, 0)
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

async function ensureProfile(user: User) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Error checking profile:', error)
      return
    }

    if (!data) {
      // Profile does not exist — create it (common for OAuth sign-ins)
      const username =
        user.user_metadata?.username ||
        user.email?.split('@')[0] ||
        'user'

      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        username,
        display_name: username,
      })

      if (insertError) {
        console.error('Error creating profile:', insertError)
      }
    }
  } catch (err) {
    console.error('Unexpected error in ensureProfile:', err)
  }
}
