import { fetchAuthSession } from 'aws-amplify/auth'
import { awsConfig } from './config'

// Helper to get auth headers - the proven working approach
const getAuthHeaders = async () => {
  const session = await fetchAuthSession()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.tokens.idToken.toString()}`
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

  updateCredits: async (amount) => {
    const response = await post({
      apiName, 
      path: '/user/credits',
      options: { body: { amount } }
    })
    return response.response
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
      const headers = await getAuthHeaders()
      const response = await fetch(`${awsConfig.API.REST.databanana.endpoint}/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ context, exclude_tags: excludeTags, image_count: imageCount })
      })
      if (response.ok) {
        return await response.json()
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Generate API Error:', error)
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