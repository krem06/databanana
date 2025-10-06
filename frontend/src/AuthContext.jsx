import { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser, signIn, signUp, signOut, confirmSignUp, resetPassword, confirmResetPassword } from 'aws-amplify/auth'
import { Amplify } from 'aws-amplify'
import { awsConfig } from './config'

// Configure Amplify
Amplify.configure(awsConfig)

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthState()
  }, [])

  async function checkAuthState() {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function login(email, password) {
    const { isSignedIn } = await signIn({ username: email, password })
    if (isSignedIn) {
      await checkAuthState()
    }
    return isSignedIn
  }

  async function signup(email, password) {
    await signUp({ username: email, password })
    // User needs to confirm email before they can sign in
  }

  async function confirmEmail(email, code) {
    await confirmSignUp({ username: email, confirmationCode: code })
  }

  async function logout() {
    await signOut()
    setUser(null)
  }

  async function forgotPassword(email) {
    await resetPassword({ username: email })
  }

  async function confirmForgotPassword(email, code, newPassword) {
    await confirmResetPassword({ username: email, confirmationCode: code, newPassword })
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    confirmEmail,
    logout,
    forgotPassword,
    confirmForgotPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}