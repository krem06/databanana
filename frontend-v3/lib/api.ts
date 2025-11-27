import { get, post } from 'aws-amplify/api'
import { apiName, awsConfig } from './config'
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

  // Upload reference images to S3
  async uploadReferenceImages(files: File[]): Promise<string[]> {
    if (files.length === 0) return []
    
    // Validate files on frontend first
    const maxSize = 50 * 1024 * 1024 // 50MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    
    for (const file of files) {
      if (file.size > maxSize) {
        throw new Error(`File ${file.name} is too large. Max size is 50MB.`)
      }
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`File ${file.name} has invalid type. Only JPEG, PNG, and WebP allowed.`)
      }
    }
    
    try {
      // Get presigned URLs
      const headers = await getAuthHeaders()
      const response = await post({
        apiName,
        path: '/upload-urls',
        options: {
          headers,
          body: { 
            file_count: files.length,
            file_types: files.map(f => f.type)
          }
        }
      })
      const data = await response.response
      const result = await data.body.json() as any
      const { upload_urls } = result
      
      // Upload files to S3
      const uploadPromises = files.map(async (file, index) => {
        const { upload_url, s3_key } = upload_urls[index]
        
        const uploadResponse = await fetch(upload_url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type
          }
        })
        
        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload file ${index}`)
        }
        
        return s3_key
      })
      
      return await Promise.all(uploadPromises)
      
    } catch (error) {
      console.error('Upload Error:', error)
      throw error
    }
  },

  // Generation endpoint
  async generateBatch(context: string, template: string, excludeTags: string, imageCount: number = 10, exclusiveOwnership: boolean = false, referenceImages: File[] = []) {
    try {
      // Upload reference images first if any
      const s3Keys = await this.uploadReferenceImages(referenceImages)
      
      const headers = await getAuthHeaders()
      const response = await post({
        apiName,
        path: '/generate',
        options: {
          headers,
          body: { 
            context,
            template,
            exclude_tags: excludeTags, 
            image_count: imageCount,
            exclusive_ownership: exclusiveOwnership,
            reference_images: s3Keys
          }
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
  },

  // Get signed URLs for private images
  async getSignedUrls(s3Keys: string[]): Promise<Record<string, string>> {
    try {
      const headers = await getAuthHeaders()
      const response = await post({
        apiName,
        path: '/signed-urls',
        options: {
          headers,
          body: { s3_keys: s3Keys }
        }
      })
      const data = await response.response
      const result = await data.body.json() as any
      return result.signed_urls || {}
    } catch (error) {
      console.error('Signed URLs Error:', error)
      throw error
    }
  }
}