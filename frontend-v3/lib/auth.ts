import { fetchAuthSession } from 'aws-amplify/auth'

export const getAuthHeaders = async () => {
  try {
    const session = await fetchAuthSession()
    if (session.tokens?.idToken) {
      return {
        'Authorization': `Bearer ${session.tokens.idToken.toString()}`,
        'Content-Type': 'application/json'
      }
    }
    throw new Error('No token')
  } catch (error) {
    throw new Error(`Auth failed: ${error.message}`)
  }
}