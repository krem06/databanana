import { get, post } from 'aws-amplify/api'
import { fetchAuthSession } from 'aws-amplify/auth'
import { apiName } from './config'

async function getAuthHeaders() {
    const session = await fetchAuthSession()
    const token = session.tokens?.idToken?.toString()
    return {
        Authorization: `Bearer ${token}`
    }
}

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
    generateBatch: async (context: string, excludeTags: string[], imageCount: number = 10) => {
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
    createPayment: async (amount: number) => {
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
