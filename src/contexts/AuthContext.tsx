import React, { createContext, useState, useEffect, useContext } from 'react'
import { supabase, getCurrentAgent, Agent } from '../services/supabase'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null;
  agent: Agent | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; user?: User; agent?: Agent; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  checkSession: () => Promise<void>;
  isAuthenticated: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        const agentData = await getCurrentAgent()
        setAgent(agentData)
      } else {
        setUser(null)
        setAgent(null)
      }
    } catch (err: any) {
      console.error('Session error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      setUser(data.user)
      const agentData = await getCurrentAgent()
      setAgent(agentData)
      
      return { success: true, user: data.user, agent: agentData! }
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setAgent(null)
      return { success: true }
    } catch (err: any) {
      console.error('Logout error:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    agent,
    loading,
    error,
    signIn,
    signOut,
    checkSession,
    isAuthenticated: !!user,
    isManager: agent?.role === 'manager'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
