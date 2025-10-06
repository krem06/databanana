import { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser, signIn, signUp, signOut, confirmSignUp, resetPassword, confirmResetPassword } from 'aws-amplify/auth'

const AuthContext = createContext()

export function AuthProvider({ children }) {
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

  const login = async (email, password) => {
    const result = await signIn({ username: email, password })
    if (result.isSignedIn) {
      await checkAuthState()
    }
    return result
  }

  const signup = async (email, password) => {
    return await signUp({ username: email, password })
  }

  const confirmEmail = async (email, code) => {
    const result = await confirmSignUp({ username: email, confirmationCode: code })
    if (result.isSignUpComplete) {
      await checkAuthState()
    }
    return result
  }

  const forgotPassword = async (email) => {
    return await resetPassword({ username: email })
  }

  const confirmForgotPassword = async (email, code, newPassword) => {
    return await confirmResetPassword({ username: email, confirmationCode: code, newPassword })
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
    confirmEmail,
    forgotPassword,
    confirmForgotPassword,
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