import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
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
            }, 0)
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
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
