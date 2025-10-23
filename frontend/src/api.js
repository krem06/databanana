import { get, post } from 'aws-amplify/api'
import { apiName } from './config'
import { getAuthHeaders } from './utils/apiAuth'

export const apiClient = {
  // User endpoints
  getUser: async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await get({ 
        apiName, 
        path: '/user',
        options: { headers }
      })

      const data = await response.response
      return await data.body.json()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  },

  // Batch endpoints
  getBatches: async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await get({ 
        apiName, 
        path: '/batches',
        options: { headers }
      })
      const data = await response.response
      const actualData = await data.body.json()
      return Array.isArray(actualData) ? actualData : []
    } catch (error) {
      console.error('Get Batches Error:', error)
      throw error
    }
  },

  // Generation endpoint
  generateBatch: async (context, excludeTags, imageCount = 10) => {
    try {
      const headers = await getAuthHeaders()
      const response = await post({
        apiName,
        path: '/generate',
        options: {
          headers,
          body: { context, exclude_tags: excludeTags, image_count: imageCount }
        }
      })
      
      const data = await response.response
      return await data.body.json()
    } catch (error) {
      console.error('Generate API Error:', error)
      throw error
    }
  },

  // Payment endpoint
  createPayment: async (amount) => {
    try {
      const headers = await getAuthHeaders()
      const response = await post({
        apiName,
        path: '/payment',
        options: {
          headers,
          body: { amount }
        }
      })
      const data = await response.response
      return await data.body.json()
    } catch (error) {
      console.error('Payment API Error:', error)
      throw error
    }
  }
}