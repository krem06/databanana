// Simple offline storage - minimalist approach
export const offlineStorage = {
  // Simple validation sync - just send current state when online
  async syncValidation() {
    const selected = localStorage.getItem('databanana_selected')
    const rejected = localStorage.getItem('databanana_rejected')
    
    if (selected || rejected) {
      // In real app: single API call with validation state
      console.log('Syncing validation changes...')
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  },

  // Cache datasets for identical offline experience
  cacheDatasets(datasets) {
    localStorage.setItem('databanana_datasets_cache', JSON.stringify(datasets))
  },

  getCachedDatasets() {
    const cached = localStorage.getItem('databanana_datasets_cache')
    return cached ? JSON.parse(cached) : []
  }
}