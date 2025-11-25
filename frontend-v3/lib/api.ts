import { get, post } from 'aws-amplify/api'
import { apiName } from './config'
import { getAuthHeaders } from './auth'

export const api = {
  async getUser() {
    const headers = await getAuthHeaders()
    const response = await get({ 
      apiName, 
      path: '/user',
      options: { headers }
    })
    const data = await response.response
    return await data.body.json()
  },

  async generateBatch(context: string, excludeTags: string, imageCount: number) {
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
  },

  async createPayment(amount: number) {
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
  }
}