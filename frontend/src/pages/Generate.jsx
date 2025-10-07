import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../AuthContext'
import { useOffline } from '../hooks/useOffline'
import ImageValidationGallery from '../components/ImageValidationGallery'

function Generate() {
  const [context, setContext] = useState('')
  const [excludeTags, setExcludeTags] = useState('')
  const [imageCount, setImageCount] = useState(10)
  const [generating, setGenerating] = useState(false)
  const [userCredits, setUserCredits] = useState(25.50)
  const [batches, setBatches] = useState([])
  const [viewedImage, setViewedImage] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(2)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  // Simple active dataset tracking
  const [activeDatasetName, setActiveDatasetName] = useState('')
  const { user } = useAuth()
  const { isOffline } = useOffline()
  const validationRef = useRef()
  const [validationState, setValidationState] = useState({ selectedImages: new Set(), rejectedImages: new Set() })

  useEffect(() => {
    if (user) {
      fetchUserData()
      loadFromLocalStorage()
    }
  }, [user])


  // Save form state including active dataset
  useEffect(() => {
    const formState = { context, excludeTags, imageCount, activeDatasetName }
    localStorage.setItem('databanana_form', JSON.stringify(formState))
  }, [context, excludeTags, imageCount, activeDatasetName])


  const fetchUserData = async () => {
    setUserCredits(25.50) // Mock credits
  }

  const loadFromLocalStorage = () => {
    try {
      // Load form state only (validation state handled by ImageValidationGallery component)
      const savedForm = localStorage.getItem('databanana_form')
      if (savedForm) {
        const formState = JSON.parse(savedForm)
        setContext(formState.context || '')
        setExcludeTags(formState.excludeTags || '')
        setImageCount(formState.imageCount || 10)
        setActiveDatasetName(formState.activeDatasetName || '')
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      localStorage.clear() // Simple cleanup
    }
  }

  const generateMockImages = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `img_${Date.now()}_${i}`,
      prompt: `${context} - variation ${i + 1}: A ${['orange', 'black', 'white', 'gray', 'calico'][i % 5]} cat ${['sitting', 'lying', 'perched', 'resting'][i % 4]} on a ${['windowsill', 'wooden sill', 'marble ledge'][i % 3]}`,
      url: `https://picsum.photos/400/300?random=${Date.now() + i}`,
      tags: ['generated', 'mock']
    }))
  }

  const calculateCost = () => {
    return (imageCount * 0.05).toFixed(2)
  }

  const canAfford = () => {
    return userCredits >= parseFloat(calculateCost())
  }

  const handleGenerate = async () => {
    if (context.length < 10) {
      alert('Context must be at least 10 characters')
      return
    }

    if (isOffline) {
      alert('Cannot generate images while offline. Please connect to the internet.')
      return
    }

    if (!canAfford()) {
      alert(`Insufficient credits. Need $${calculateCost()} but you have $${userCredits.toFixed(2)}`)
      return
    }

    // If no active dataset, prompt user for name
    if (!activeDatasetName.trim()) {
      const userDatasetName = prompt('Enter a name for your dataset:', `Dataset: ${context.slice(0, 30)}`)
      if (!userDatasetName) return
      setActiveDatasetName(userDatasetName)
    }

    setGenerating(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    try {
      const mockImages = generateMockImages(imageCount)
      const cost = parseFloat(calculateCost())
      
      const newBatch = {
        id: `batch_${Date.now()}`,
        images: mockImages,
        context,
        excludeTags,
        cost,
        timestamp: new Date(),
        isOpen: true,
        datasetName: activeDatasetName
      }
      
      setBatches(prev => [
        newBatch,
        ...prev.map(batch => ({ ...batch, isOpen: false }))
      ])
      
      setUserCredits(prev => prev - cost)
    } catch (error) {
      console.error('Error generating batch:', error)
      alert('Error generating images. Please try again.')
    } finally {
      setGenerating(false)
    }
  }




  const handleSaveDataset = (dataset) => {
    // Save the current session as a permanent dataset
    const result = confirm(`Save current session as a permanent dataset?\n\nThis will save ${dataset.batches.length} batches with ${dataset.batches.reduce((total, batch) => total + batch.images.length, 0)} total images.`)
    
    if (result) {
      try {
        // TODO: Implement actual save to backend
        alert(`✅ Dataset "${dataset.name}" saved successfully!`)
      } catch (error) {
        alert(`❌ Failed to save dataset: ${error.message}`)
      }
    }
  }

  const resetForm = () => {
    setContext('')
    setExcludeTags('')
    setImageCount(10)
    setActiveDatasetName('')  // Reset active dataset
    localStorage.removeItem('databanana_form')
  }

  const handleExport = async () => {
    if (validationState.selectedImages.size === 0) {
      alert('Please select at least one image to export')
      return
    }
    
    const result = confirm(`🎉 Export ${validationState.selectedImages.size} images as COCO dataset?\n\nCost: $${(validationState.selectedImages.size * 0.10).toFixed(2)}\n\nClick OK to export and clear your workspace, or Cancel to keep working.`)
    
    if (result) {
      // Simulate export
      alert(`✅ Export Success!\n\n${validationState.selectedImages.size} images exported as COCO dataset.\nDownload link: https://example.com/dataset.zip`)
      
      // Clear workspace after successful export
      setBatches([])
      if (validationRef.current) {
        validationRef.current.clearValidation()
      }
    }
  }

  // Zoom Modal Functions
  const openImageModal = (image) => {
    setViewedImage(image)
    setZoomLevel(2)
    setPanPosition({ x: 0, y: 0 })
  }

  const closeImageModal = () => {
    setViewedImage(null)
    setIsDragging(false)
  }

  const getAllImages = () => {
    return batches.flatMap(batch => batch.images)
  }

  const getCurrentImageIndex = () => {
    if (!viewedImage) return -1
    const allImages = getAllImages()
    return allImages.findIndex(img => img.id === viewedImage.id)
  }

  const goToNextImage = () => {
    const allImages = getAllImages()
    const currentIndex = getCurrentImageIndex()
    if (currentIndex < allImages.length - 1) {
      const nextImage = allImages[currentIndex + 1]
      setViewedImage(nextImage)
      setZoomLevel(2)
      setPanPosition({ x: 0, y: 0 })
    } else {
      closeImageModal()
    }
  }

  const handleAccept = () => {
    if (validationRef.current && !validationState.selectedImages.has(viewedImage.id)) {
      validationRef.current.toggleImageSelection(viewedImage.id)
    }
    setTimeout(goToNextImage, 300)
  }

  const handleReject = () => {
    if (validationRef.current && !validationState.rejectedImages.has(viewedImage.id)) {
      validationRef.current.toggleImageRejection(viewedImage.id)
    }
    setTimeout(goToNextImage, 300)
  }

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.5 : 0.5
    setZoomLevel(prev => Math.max(1, Math.min(4, prev + delta)))
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        {/* Compact Header */}
        <div className="card-manual p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-manual">Generate</h1>
              {activeDatasetName && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  📁 {activeDatasetName}
                </span>
              )}
              {batches.length > 0 && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  ✓ Auto-saved
                </span>
              )}
            </div>
            <span className="text-sm text-gray-600">Credits: <span className="font-medium text-blue-600">${userCredits.toFixed(2)}</span></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div className="md:col-span-2">
              <input 
                type="text" 
                value={context}
                onChange={(e) => setContext(e.target.value.slice(0, 80))}
                placeholder="Scene description (e.g., cat on windowsill)..."
                maxLength={80}
                className="input-manual text-sm"
              />
            </div>
            <div>
              <input 
                type="text" 
                value={excludeTags}
                onChange={(e) => setExcludeTags(e.target.value)}
                placeholder="Exclude tags..."
                className="input-manual text-sm"
              />
            </div>
            <div>
              <input 
                type="number" 
                value={imageCount}
                onChange={(e) => setImageCount(Math.min(Math.max(1, parseInt(e.target.value) || 1), 50))}
                min="1"
                max="50"
                className="input-field text-center text-sm"
                placeholder="Count"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {context.length}/80 chars • Cost: ${calculateCost()} • {canAfford() ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗ Insufficient</span>}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                {activeDatasetName && (
                  <button 
                    onClick={() => {
                      alert(`Dataset "${activeDatasetName}" exported successfully!`)
                      setActiveDatasetName('')
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded"
                  >
                    Export Dataset
                  </button>
                )}
                <button 
                  onClick={resetForm}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded"
                >
                  Reset
                </button>
              </div>
              <button 
                onClick={handleGenerate}
                disabled={generating || context.length < 10 || isOffline || !canAfford()}
                className={`text-sm px-4 py-2 ${isOffline ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'btn-primary'}`}
              >
                {generating ? 'Generating...' : isOffline ? 'Offline - Cannot Generate' : `Generate ${imageCount}`}
              </button>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        {batches.length > 0 && (
          <div className="card p-6">
            <ImageValidationGallery
              datasets={[{ 
                id: 'current-session', 
                name: activeDatasetName || 'Current Session',
                created_at: new Date().toISOString(),
                batches: batches
              }]}
              showDatasetHeaders={true}
              onSelectionChange={setValidationState}
              exposeValidationMethods={validationRef}
              onImageClick={openImageModal}
              onSaveDataset={handleSaveDataset}
            />
          </div>
        )}

        {/* Export Summary */}
        {batches.length > 0 && (
          <div className="card p-6 sticky bottom-6 bg-white border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Total Images:</span> {batches.reduce((total, batch) => total + batch.images.length, 0)}
                </div>
                <div className="text-sm text-green-600">
                  <span className="font-medium">Selected:</span> {validationState.selectedImages.size}
                </div>
                <div className="text-sm text-red-500">
                  <span className="font-medium">Rejected:</span> {validationState.rejectedImages.size}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Export Cost:</span> ${(validationState.selectedImages.size * 0.10).toFixed(2)}
                </div>
              </div>
              <button 
                onClick={handleExport} 
                disabled={validationState.selectedImages.size === 0}
                className={`font-medium px-6 py-3 rounded-lg transition-colors ${
                  validationState.selectedImages.size > 0 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Export {validationState.selectedImages.size} Images
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {batches.length === 0 && !generating && (
          <div className="card-manual p-16 text-center bg-gray-400 dark:bg-gray-700 border-b">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Ready to generate your dataset?</h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">Describe your scene above and click generate to start creating high-quality images for your training dataset.</p>
          </div>
        )}

        {/* Loading State */}
        {generating && (
          <div className="card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-lg font-medium text-gray-700">Generating your images...</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(imageCount)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      {viewedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
          onClick={closeImageModal}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Top Controls */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black bg-opacity-80 text-white px-6 py-3 rounded-full z-10">
            <span className="text-sm">{getCurrentImageIndex() + 1} / {getAllImages().length}</span>
            <div className="w-px h-5 bg-white bg-opacity-30"></div>
            <span className="text-sm">Zoom: {zoomLevel.toFixed(1)}x</span>
            <button 
              onClick={(e) => { e.stopPropagation(); setZoomLevel(prev => Math.max(1, prev - 0.5)) }}
              className="w-8 h-8 border border-white border-opacity-50 text-white rounded hover:bg-white hover:bg-opacity-20 transition-colors flex items-center justify-center"
            >
              -
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setZoomLevel(prev => Math.min(4, prev + 0.5)) }}
              className="w-8 h-8 border border-white border-opacity-50 text-white rounded hover:bg-white hover:bg-opacity-20 transition-colors flex items-center justify-center"
            >
              +
            </button>
          </div>

          {/* Close Button */}
          <button 
            onClick={closeImageModal}
            className="absolute top-6 right-6 w-12 h-12 bg-black bg-opacity-80 text-white rounded-full hover:bg-opacity-100 transition-colors z-10 flex items-center justify-center"
          >
            ✕
          </button>

          {/* Image */}
          <img 
            src={viewedImage.url}
            alt={viewedImage.prompt}
            className="max-w-[90vw] max-h-[80vh] object-contain transition-transform duration-100"
            style={{
              transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            draggable={false}
          />

          {/* Bottom Controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-10">
            <button
              onClick={(e) => { e.stopPropagation(); handleReject() }}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-full transition-colors min-w-[120px]"
            >
              ✗ Reject
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); handleAccept() }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-full transition-colors min-w-[120px]"
            >
              ✓ Accept
            </button>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white text-sm px-4 py-2 rounded-full">
            🖱️ Drag to pan • 🖲️ Scroll to zoom • Accept/Reject auto-advances
          </div>
        </div>
      )}
    </div>
  )
}

export default Generate