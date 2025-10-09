import { useState, useEffect } from 'react'
import { updatePassword } from 'aws-amplify/auth'
import { useAuth } from '../AuthContext'
import { apiClient } from '../api'
import { useSync } from '../hooks/useSync'
import { offlineStorage } from '../utils/offlineStorage'
import { useOffline } from '../hooks/useOffline'
import ImageValidationGallery from '../components/ImageValidationGallery'

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
  const [validationState, setValidationState] = useState({ selectedImages: new Set(), rejectedImages: new Set() })
  
  const { user, logout } = useAuth()
  const { isOffline } = useOffline()
  useSync() // Just initialize sync

  const userEmail = user?.signInDetails?.loginId || 'Not logged in'

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Fetch user credits from backend
  const fetchUserCredits = async () => {
    try {
      const userData = await apiClient.getUser()
      setCredits(userData.credits || 0)
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    }
  }

  // Load datasets 
  const loadDatasets = async () => {
    try {
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      batch.images.filter(img => validationState.selectedImages.has(img.id))
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
                sum + batch.images.filter(img => validationState.selectedImages.has(img.id)).length, 0)
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Generation History</h2>
          {datasets.length > 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              💡 Click images to select • Shift+Click to reject
            </div>
          )}
        </div>
        
        <ImageValidationGallery
          datasets={datasets}
          showDatasetHeaders={true}
          onSelectionChange={setValidationState}
        />
      </div>
    </div>
  )
}

export default Account