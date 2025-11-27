import { get, post } from 'aws-amplify/api'
import { apiName, awsConfig, cdnDomain } from './config'
import { getAuthHeaders } from './auth'

// Helper function to get proper image URL
function getImageUrl(s3Key: string): string {
  // If it's a public image (starts with 'public/'), use CloudFront
  if (s3Key.startsWith('public/')) {
    return `${cdnDomain}/${s3Key}`
  }
  // For private images, we'll need to get signed URLs
  return s3Key
}

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
      
      if (!Array.isArray(actualData)) return []
      
      // Process image URLs and get signed URLs for private images
      const processedData = await Promise.all(actualData.map(async (dataset: any) => {
        const processedBatches = await Promise.all(dataset.batches.map(async (batch: any) => {
          if (!batch.images || !Array.isArray(batch.images)) return batch
          
          // Separate public and private images
          const publicImages: any[] = []
          const privateImageKeys: string[] = []
          
          batch.images.forEach((image: any) => {
            if (image.url.startsWith('public/')) {
              publicImages.push({
                ...image,
                url: getImageUrl(image.url)
              })
            } else {
              privateImageKeys.push(image.url)
            }
          })
          
          // Get signed URLs for private images if any
          let privateImages: any[] = []
          if (privateImageKeys.length > 0) {
            try {
              const signedUrls = await this.getSignedUrls(privateImageKeys)
              privateImages = batch.images
                .filter((img: any) => privateImageKeys.includes(img.url))
                .map((img: any) => ({
                  ...img,
                  url: signedUrls[img.url] || img.url
                }))
            } catch (error) {
              console.error('Failed to get signed URLs:', error)
              // Fallback to original URLs
              privateImages = batch.images
                .filter((img: any) => privateImageKeys.includes(img.url))
            }
          }
          
          return {
            ...batch,
            images: [...publicImages, ...privateImages]
          }
        }))
        
        return {
          ...dataset,
          batches: processedBatches
        }
      }))
      
      return processedData
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