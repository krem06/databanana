import { useState, useEffect } from 'react'
import { updatePassword } from 'aws-amplify/auth'
import { useAuth } from '../AuthContext'
import { apiClient } from '../api'
import { useSync } from '../hooks/useSync'
import { offlineStorage } from '../utils/offlineStorage'
import { useOffline } from '../hooks/useOffline'

function Account() {
  const [credits, setCredits] = useState(0)
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [isExporting, setIsExporting] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [processingPayment, setProcessingPayment] = useState(null) // null, 5, 10, or 25
  const [paymentMessage, setPaymentMessage] = useState('')
  const [datasets, setDatasets] = useState([])
  const [selectedImages, setSelectedImages] = useState(new Set())
  const [rejectedImages, setRejectedImages] = useState(new Set())
  
  const { user, logout } = useAuth()
  const { isOffline } = useOffline()
  useSync() // Just initialize sync

  const userEmail = user?.signInDetails?.loginId || 'Not logged in'

  // Fetch user credits from backend
  const fetchUserCredits = async () => {
    try {
      const userData = await apiClient.getUser()
      setCredits(userData.credits || 0)
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    }
  }

  // Load datasets and validation state
  const loadDatasets = async () => {
    try {
      const savedSelected = localStorage.getItem('databanana_selected')
      const savedRejected = localStorage.getItem('databanana_rejected')
      
      if (savedSelected) {
        setSelectedImages(new Set(JSON.parse(savedSelected)))
      }
      
      if (savedRejected) {
        setRejectedImages(new Set(JSON.parse(savedRejected)))
      }
      
      // Simple: online = API, offline = cache
      if (isOffline) {
        setDatasets(offlineStorage.getCachedDatasets())
      } else {
        const datasetsData = await apiClient.getBatches()
        offlineStorage.cacheDatasets(datasetsData) // Always cache for offline
        setDatasets(datasetsData)
      }
    } catch (error) {
      console.error('Error loading datasets:', error)
      setDatasets([])
    }
  }

  // Fetch user credits on mount
  useEffect(() => {
    fetchUserCredits()
    loadDatasets()
  }, [])

  // Handle payment success/cancel from URL (run once on mount)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment')
    
    if (paymentStatus === 'success') {
      setPaymentMessage('Payment successful! Your credits have been updated.')
      fetchUserCredits()
      window.history.replaceState({}, '', window.location.pathname)
      setTimeout(() => setPaymentMessage(''), 5000)
    } else if (paymentStatus === 'cancelled') {
      setPaymentMessage('Payment was cancelled.')
      setTimeout(() => setPaymentMessage(''), 5000)
    }
  }, [])

  const handleDatasetExport = async (dataset, format) => {
    // Get all selected images across all batches in the dataset
    const allSelectedImages = dataset.batches.flatMap(batch => 
      batch.images.filter(img => selectedImages.has(img.id))
    )
    const exportCost = allSelectedImages.length * 0.10
    
    if (allSelectedImages.length === 0) {
      alert('No images selected in this dataset for export')
      return
    }
    
    const result = confirm(`Export ${allSelectedImages.length} images from "${dataset.name}" dataset in ${format.toUpperCase()} format?\n\nCost: $${exportCost.toFixed(2)}`)
    
    if (!result) return
    
    setIsExporting(true)
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate download
      const filename = `${dataset.name.replace(/[^a-zA-Z0-9]/g, '_')}_${format}_${new Date().toISOString().split('T')[0]}.zip`
      
      alert(`✅ Export Complete!\n\nDataset: ${dataset.name}\nFormat: ${format.toUpperCase()}\nImages: ${allSelectedImages.length}\nDownload: ${filename}\n\nCost: $${exportCost.toFixed(2)} deducted from your account.`)
    } catch (error) {
      alert(`Export error: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    setIsUpdatingPassword(true)
    setPasswordMessage('')

    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordMessage('New passwords do not match')
      setIsUpdatingPassword(false)
      return
    }

    try {
      await updatePassword({ oldPassword: passwordForm.current, newPassword: passwordForm.new })
      setPasswordMessage('Password updated successfully!')
      setPasswordForm({ current: '', new: '', confirm: '' })
    } catch (error) {
      setPasswordMessage(error.message || 'Failed to update password')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const getSelectedCountForBatch = (batchImages) => {
    return batchImages.filter(img => selectedImages.has(img.id)).length
  }

  const getRejectedCountForBatch = (batchImages) => {
    return batchImages.filter(img => rejectedImages.has(img.id)).length
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const toggleImageSelection = (imageId) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(imageId)) {
        newSet.delete(imageId)
        // Also remove from rejected if it was there
        setRejectedImages(prevRejected => {
          const newRejected = new Set(prevRejected)
          newRejected.delete(imageId)
          return newRejected
        })
      } else {
        newSet.add(imageId)
        // Remove from rejected if it was there
        setRejectedImages(prevRejected => {
          const newRejected = new Set(prevRejected)
          newRejected.delete(imageId)
          return newRejected
        })
      }
      // Update localStorage
      localStorage.setItem('databanana_selected', JSON.stringify(Array.from(newSet)))
      return newSet
    })
  }

  const toggleImageRejection = (imageId) => {
    setRejectedImages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(imageId)) {
        newSet.delete(imageId)
      } else {
        newSet.add(imageId)
        // Remove from selected if it was there
        setSelectedImages(prevSelected => {
          const newSelected = new Set(prevSelected)
          newSelected.delete(imageId)
          localStorage.setItem('databanana_selected', JSON.stringify(Array.from(newSelected)))
          return newSelected
        })
      }
      // Update localStorage
      localStorage.setItem('databanana_rejected', JSON.stringify(Array.from(newSet)))
      return newSet
    })
  }

  const handleImageClick = (imageId, event) => {
    if (event.shiftKey) {
      toggleImageRejection(imageId)
    } else {
      toggleImageSelection(imageId)
    }
  }

  const handlePayment = async (amount) => {
    setProcessingPayment(amount)
    try {
      const data = await apiClient.createPayment(amount)
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        alert('Payment setup failed: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment error: ' + error.message)
    } finally {
      setProcessingPayment(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Details</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email:</label>
            <input 
              type="email" 
              value={userEmail}
              className="input-field bg-gray-50 text-gray-500"
              disabled
            />
            <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          
          <form onSubmit={handlePasswordUpdate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password:</label>
                <input 
                  type="password" 
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password:</label>
                <input 
                  type="password" 
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                  className="input-field"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password:</label>
                <input 
                  type="password" 
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                  className={`input-field ${
                    passwordForm.new && passwordForm.confirm && passwordForm.new !== passwordForm.confirm 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : ''
                  }`}
                  required
                  minLength={6}
                />
                {passwordForm.new && passwordForm.confirm && passwordForm.new !== passwordForm.confirm && (
                  <p className="text-red-600 text-sm mt-1">
                    Passwords do not match
                  </p>
                )}
              </div>
              
              {passwordMessage && (
                <p className={`text-sm mb-4 ${
                  passwordMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {passwordMessage}
                </p>
              )}
              
              <button 
                type="submit" 
                className={`w-full ${isUpdatingPassword ? 'bg-gray-400 cursor-not-allowed' : 'btn-primary'}`}
                disabled={isUpdatingPassword}
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button 
              onClick={logout}
              className="w-full btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
        
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Credits</h2>
          <p className="text-lg mb-2">Current balance: <strong>${credits}</strong></p>
          <p className="text-gray-600 mb-6">100 images = $5</p>
          
          {paymentMessage && (
            <div className={`p-3 mb-4 rounded-lg border ${
              paymentMessage.includes('successful') 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {paymentMessage}
            </div>
          )}
          
          <div className="flex flex-wrap gap-3">
            <button 
              className={`flex-1 ${processingPayment === 5 ? 'bg-gray-400 cursor-not-allowed' : 'btn-primary'}`}
              onClick={() => handlePayment(5)}
              disabled={processingPayment === 5}
            >
              {processingPayment === 5 ? 'Processing...' : 'Add $5'}
            </button>
            <button 
              className={`flex-1 ${processingPayment === 10 ? 'bg-gray-400 cursor-not-allowed' : 'btn-primary'}`}
              onClick={() => handlePayment(10)}
              disabled={processingPayment === 10}
            >
              {processingPayment === 10 ? 'Processing...' : 'Add $10'}
            </button>
            <button 
              className={`flex-1 ${processingPayment === 25 ? 'bg-gray-400 cursor-not-allowed' : 'btn-primary'}`}
              onClick={() => handlePayment(25)}
              disabled={processingPayment === 25}
            >
              {processingPayment === 25 ? 'Processing...' : 'Add $25'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="card p-6 mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Datasets</h2>
        <p className="text-gray-600 mb-6">
          Export your curated datasets in standard machine learning formats
        </p>
        
        {datasets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No datasets available for export. Generate some images first.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {datasets.map((dataset) => {
              const totalSelectedInDataset = dataset.batches.reduce((sum, batch) => 
                sum + getSelectedCountForBatch(batch.images), 0)
              const exportCost = totalSelectedInDataset * 0.10
              
              return (
                <div key={dataset.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {dataset.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {dataset.batches.length} batches • {totalSelectedInDataset} selected images • Cost: ${exportCost.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      Created {formatDate(new Date(dataset.created_at))}
                    </div>
                  </div>
                  
                  {totalSelectedInDataset === 0 ? (
                    <p className="text-sm text-gray-500 italic">No images selected for export</p>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleDatasetExport(dataset, 'coco')}
                        disabled={isExporting}
                        className="btn-secondary text-sm"
                      >
                        Export COCO
                      </button>
                      <button 
                        onClick={() => handleDatasetExport(dataset, 'yolo')}
                        disabled={isExporting}
                        className="btn-secondary text-sm"
                      >
                        Export YOLO
                      </button>
                      <button 
                        onClick={() => handleDatasetExport(dataset, 'pascal')}
                        disabled={isExporting}
                        className="btn-secondary text-sm"
                      >
                        Export Pascal VOC
                      </button>
                      <button 
                        onClick={() => handleDatasetExport(dataset, 'csv')}
                        disabled={isExporting}
                        className="btn-secondary text-sm"
                      >
                        Export CSV
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        
        <div className="mt-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Export Formats:</h4>
          <ul className="space-y-1">
            <li>• <strong>COCO:</strong> JSON format with bounding boxes and metadata</li>
            <li>• <strong>YOLO:</strong> TXT files with normalized coordinates</li>
            <li>• <strong>Pascal VOC:</strong> XML annotations with image metadata</li>
            <li>• <strong>CSV:</strong> Simple tabular format with image paths and labels</li>
          </ul>
        </div>
      </div>

      <div className="card p-6 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Generation History</h2>
          {datasets.length > 0 && (
            <div className="text-sm text-gray-500">
              💡 Click images to select • Shift+Click to reject
            </div>
          )}
        </div>
        
        {datasets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500">No generation history yet. Visit the Generate page to create your first dataset.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {datasets.map((dataset) => {
              const totalImagesInDataset = dataset.batches.reduce((sum, batch) => sum + batch.images.length, 0)
              const totalSelectedInDataset = dataset.batches.reduce((sum, batch) => 
                sum + getSelectedCountForBatch(batch.images), 0)
              const totalRejectedInDataset = dataset.batches.reduce((sum, batch) => 
                sum + getRejectedCountForBatch(batch.images), 0)
              const totalCostInDataset = dataset.batches.reduce((sum, batch) => sum + batch.cost, 0)
              
              return (
                <div key={dataset.id} className="border border-gray-300 rounded-xl overflow-hidden">
                  {/* Dataset Header */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-5 border-b border-gray-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          📁 {dataset.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Created {formatDate(new Date(dataset.created_at))} • {dataset.batches.length} batches
                        </p>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          ✓{totalSelectedInDataset} selected
                        </span>
                        <span className="text-red-500 dark:text-red-400 font-medium">
                          ✗{totalRejectedInDataset} rejected
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {totalImagesInDataset} total images
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${totalCostInDataset.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Batches */}
                  <div className="space-y-0">
                    {dataset.batches.map((batch, batchIndex) => (
                      <div key={batch.id} className="border-b border-gray-200 last:border-b-0">
                        {/* Batch Header */}
                        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                📦 Batch {batchIndex + 1}: {batch.context}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Generated {formatDate(new Date(batch.timestamp))}
                                {batch.excludeTags && (
                                  <span className="ml-2">• Excluded: {batch.excludeTags}</span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                ✓{getSelectedCountForBatch(batch.images)} selected
                              </span>
                              <span className="text-red-500 dark:text-red-400 font-medium">
                                ✗{getRejectedCountForBatch(batch.images)} rejected
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">
                                {batch.images.length} total
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                ${batch.cost.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Images Grid */}
                        <div className="p-6">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {batch.images.map((image) => (
                              <div 
                                key={image.id}
                                className={`relative rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                                  selectedImages.has(image.id) 
                                    ? 'ring-2 ring-green-500' 
                                    : rejectedImages.has(image.id)
                                    ? 'ring-2 ring-red-500 opacity-60'
                                    : 'hover:ring-2 hover:ring-blue-300'
                                }`}
                                onClick={(e) => handleImageClick(image.id, e)}
                                title="Click to select • Shift+Click to reject"
                              >
                                <img 
                                  src={image.url} 
                                  alt={image.prompt}
                                  className="w-full h-32 object-cover"
                                />
                                
                                {/* Selection/Rejection badges */}
                                {(selectedImages.has(image.id) || rejectedImages.has(image.id)) && (
                                  <div className="absolute top-2 right-2">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                      selectedImages.has(image.id) ? 'bg-green-500' : 'bg-red-500'
                                    }`}>
                                      {selectedImages.has(image.id) ? '✓' : '✗'}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                                  <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                                    <div className="bg-white bg-opacity-90 rounded-full p-1 text-gray-700 text-xs">
                                      {selectedImages.has(image.id) ? 'Selected' : rejectedImages.has(image.id) ? 'Rejected' : 'Click to select'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Account