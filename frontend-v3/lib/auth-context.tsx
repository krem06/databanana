"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getCurrentUser, signIn, signUp, signOut } from 'aws-amplify/auth'

interface AuthContextType {
  user: any
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<any>
  signup: (email: string, password: string) => Promise<any>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const result = await signIn({ username: email, password })
    if (result.isSignedIn) {
      await checkAuthState()
    }
    return result
  }

  const signup = async (email: string, password: string) => {
    return await signUp({ username: email, password })
  }

  const logout = async () => {
    await signOut()
    setUser(null)
  }

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    signup,
    logout
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