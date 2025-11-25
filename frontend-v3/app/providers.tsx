"use client"

import { Amplify } from 'aws-amplify'
import { AuthProvider } from '@/lib/auth-context'
import { awsConfig } from '@/lib/config'

Amplify.configure(awsConfig)

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}