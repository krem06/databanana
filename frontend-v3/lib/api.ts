import { get, post } from 'aws-amplify/api'
import { apiName } from './config'
import { getAuthHeaders } from './auth'

export const apiClient = {
  // User endpoints
  async getUser() {
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
  async getBatches() {
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
  async generateBatch(context: string, excludeTags: string, imageCount: number = 10) {
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
  async createPayment(amount: number) {
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