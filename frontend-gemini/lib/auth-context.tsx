"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
    getCurrentUser,
    signIn,
    signUp,
    signOut,
    confirmSignUp,
    resetPassword,
    confirmResetPassword,
    SignInInput,
    SignUpInput,
    ConfirmSignUpInput,
    ResetPasswordInput,
    ConfirmResetPasswordInput,
    AuthUser,
    SignInOutput,
    SignUpOutput,
    ResetPasswordOutput
} from 'aws-amplify/auth'
import { Amplify } from 'aws-amplify'
import { awsConfig } from './config'

// Initialize Amplify
Amplify.configure(awsConfig)

interface AuthContextType {
    user: AuthUser | null
    isAuthenticated: boolean
    loading: boolean
    login: (input: SignInInput) => Promise<SignInOutput>
    signup: (input: SignUpInput) => Promise<SignUpOutput>
    confirmEmail: (input: ConfirmSignUpInput) => Promise<any>
    forgotPassword: (input: ResetPasswordInput) => Promise<ResetPasswordOutput>
    confirmForgotPassword: (input: ConfirmResetPasswordInput) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAuthState()
    }, [])

    const checkAuthState = async () => {
        try {
            const currentUser = await getCurrentUser()
            setUser(currentUser)
        } catch (err) {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    const login = async (input: SignInInput) => {
        const result = await signIn(input)
        if (result.isSignedIn) {
            await checkAuthState()
        }
        return result
    }

    const signup = async (input: SignUpInput) => {
        return await signUp(input)
    }

    const confirmEmail = async (input: ConfirmSignUpInput) => {
        const result = await confirmSignUp(input)
        if (result.isSignUpComplete) {
            await checkAuthState()
        }
        return result
    }

    const forgotPassword = async (input: ResetPasswordInput) => {
        return await resetPassword(input)
    }

    const confirmForgotPassword = async (input: ConfirmResetPasswordInput) => {
        return await confirmResetPassword(input)
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
