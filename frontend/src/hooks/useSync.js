import { useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { offlineStorage } from '../utils/offlineStorage'

export function useSync() {
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const handleOnline = () => {
      if (isAuthenticated && navigator.onLine) {
        offlineStorage.syncValidation()
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [isAuthenticated])

  return null
}