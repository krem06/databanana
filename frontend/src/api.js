import { get, post, put } from 'aws-amplify/api'

const apiName = 'databanana'

export const apiClient = {
  // User endpoints
  getUser: async () => {
    const response = await get({ apiName, path: '/user' })
    return response.response
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
  generateBatch: async (context, excludeTags) => {
    const response = await post({
      apiName, 
      path: '/generate',
      options: { body: { context, exclude_tags: excludeTags } }
    })
    return response.response
  },

  // Payment endpoint
  createPayment: async (amount) => {
    const response = await post({
      apiName, 
      path: '/payment',
      options: { body: { amount } }
    })
    return response.response
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