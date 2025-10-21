import { fetchAuthSession } from 'aws-amplify/auth'
import { awsConfig } from './config'

// Helper to get auth headers - the proven working approach
const getAuthHeaders = async () => {
  try {
    console.log('Fetching auth session...')
    const session = await fetchAuthSession()
    console.log('Auth session:', { hasTokens: !!session.tokens, hasIdToken: !!session.tokens?.idToken })
    
    if (!session.tokens?.idToken) {
      throw new Error('No authentication token available. Please log in again.')
    }
    
    const token = session.tokens.idToken.toString()
    console.log('Auth token length:', token.length)
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  } catch (error) {
    console.error('Auth error:', error)
    throw new Error(`Authentication failed: ${error.message}`)
  }
}

export const apiClient = {
  // User endpoints
  getUser: async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${awsConfig.API.REST.databanana.endpoint}/user`, {
        headers
      })
      if (response.ok) {
        return await response.json()
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  },

  // Batch endpoints  
  getBatches: async () => {
    const response = await get({ apiName, path: '/batches' })
    return response.response
  },

  createBatch: async (context, excludeTags) => {
    const response = await post({
      apiName, 
      path: '/batches',
      options: { body: { context, exclude_tags: excludeTags } }
    })
    return response.response
  },

  // Image endpoints
  getImages: async (batchId = null) => {
    const path = batchId ? `/images?batch_id=${batchId}` : '/images'
    const response = await get({ apiName, path })
    return response.response
  },

  updateImage: async (imageId, updates) => {
    const response = await put({
      apiName, 
      path: `/images/${imageId}`,
      options: { body: updates }
    })
    return response.response
  },

  // Generation endpoint
  generateBatch: async (context, excludeTags, imageCount = 10) => {
    try {
      console.log('Calling generate endpoint:', `${awsConfig.API.REST.databanana.endpoint}/generate`)
      const headers = await getAuthHeaders()
      console.log('Request headers:', headers)
      console.log('Request body:', { context, exclude_tags: excludeTags, image_count: imageCount })
      
      const response = await fetch(`${awsConfig.API.REST.databanana.endpoint}/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ context, exclude_tags: excludeTags, image_count: imageCount })
      })
      
      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Response data:', result)
        return result
      } else {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        
        // Parse JSON error response if possible
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `HTTP ${response.status}: ${errorText}`)
        } catch (parseError) {
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }
      }
    } catch (error) {
      console.error('Generate API Error:', error)
      // Only handle actual network/fetch errors, not HTTP error responses
      if (error.message === 'Failed to fetch') {
        throw new Error('Network error: Could not connect to the server. Please check your internet connection and try again.')
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('CORS error: The server may not be configured to accept requests from this domain.')
      }
      // Re-throw HTTP errors and other errors as-is
      throw error
    }
  },

  // Payment endpoint
  createPayment: async (amount) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${awsConfig.API.REST.databanana.endpoint}/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount })
      })
      if (response.ok) {
        return await response.json()
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Payment API Error:', error)
      throw error
    }
  },

  // Upload endpoint
  getUploadUrl: async (filename, contentType) => {
    const response = await post({
      apiName, 
      path: '/upload',
      options: { body: { filename, content_type: contentType } }
    })
    return response.response
  }
}