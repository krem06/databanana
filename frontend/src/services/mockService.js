// Simple mock service for testing expensive API calls
const isTestMode = import.meta.env.VITE_TEST_MODE === 'true'

// Mock data
const mockData = {
  user: { id: 1, email: 'test@example.com', credits: 25.50 },
  paymentSuccess: { checkout_url: 'https://checkout.stripe.com/test_session' },
  generateResult: {
    batch_id: 'test_batch_123',
    images: Array.from({ length: 10 }, (_, i) => ({
      id: `img_${i}`,
      url: `https://picsum.photos/300/200?random=${i}`,
      selected: false
    }))
  },
  exportResult: {
    export_url: 'https://example.com/download/test_export.zip',
    image_count: 5,
    format: 'coco'
  }
}

// Helper to simulate API delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

export const mockService = {
  // Wrap any API call with test mode check
  async call(realApiCall, mockResponse) {
    if (isTestMode) {
      console.log('🧪 TEST MODE: Mocking API call')
      await delay() // Simulate network delay
      return mockResponse
    }
    return realApiCall()
  },

  // Pre-configured mocks for common operations
  async getUserData(realApiCall) {
    return this.call(realApiCall, mockData.user)
  },

  async createPayment(realApiCall) {
    return this.call(realApiCall, mockData.paymentSuccess)
  },

  async generateImages(realApiCall) {
    return this.call(realApiCall, mockData.generateResult)
  },

  async exportImages(realApiCall) {
    return this.call(realApiCall, mockData.exportResult)
  },

  // Test mode indicator
  isTestMode
}