import { fetchAuthSession } from 'aws-amplify/auth'

let cachedToken = null
let tokenExpiry = null

export const getAuthHeaders = async () => {
  // Check if cached token is still valid (with 5min buffer)
  const now = Date.now()
  if (cachedToken && tokenExpiry && now < (tokenExpiry - 300000)) {
    return {
      'Authorization': `Bearer ${cachedToken}`,
      'Content-Type': 'application/json'
    }
  }

  try {
    const session = await fetchAuthSession()
    if (session.tokens?.idToken) {
      cachedToken = session.tokens.idToken.toString()
      // JWT tokens have exp claim, but we'll use a 1-hour cache as fallback
      tokenExpiry = now + (60 * 60 * 1000)
      
      return {
        'Authorization': `Bearer ${cachedToken}`,
        'Content-Type': 'application/json'
      }
    }
    throw new Error('No valid token')
  } catch (error) {
    // Clear cache on error
    cachedToken = null
    tokenExpiry = null
    throw new Error(`Authentication failed: ${error.message}`)
  }
}

// Clear token cache (useful for logout)
export const clearTokenCache = () => {
  cachedToken = null
  tokenExpiry = null
}