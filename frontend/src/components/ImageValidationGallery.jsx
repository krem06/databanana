import { useState, useEffect } from 'react'

function ImageValidationGallery({ 
  datasets = [], 
  showDatasetHeaders = true,
  className = "",
  onSelectionChange = () => {}, // Optional callback for parent components
  exposeValidationMethods = null, // Optional ref to expose validation methods
  onImageClick = null, // Optional custom click handler - if provided, overrides default selection behavior
  onSaveDataset = null // Optional save handler for datasets
}) {
  const [expandedDatasets, setExpandedDatasets] = useState(new Set())
  const [expandedBatches, setExpandedBatches] = useState(() => {
    // Auto-expand the first batch (latest) if there are datasets
    if (datasets.length > 0 && datasets[0].batches.length > 0) {
      return new Set([datasets[0].batches[0].id])
    }
    return new Set()
  })
  const [selectedImages, setSelectedImages] = useState(new Set())
  const [rejectedImages, setRejectedImages] = useState(new Set())

  // Load validation state from localStorage on mount
  useEffect(() => {
    try {
      const savedSelected = localStorage.getItem('databanana_selected')
      if (savedSelected) {
        setSelectedImages(new Set(JSON.parse(savedSelected)))
      }

      const savedRejected = localStorage.getItem('databanana_rejected')
      if (savedRejected) {
        setRejectedImages(new Set(JSON.parse(savedRejected)))
      }
    } catch (error) {
      console.error('Error loading validation state:', error)
    }
  }, [])

  // Save validation state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('databanana_selected', JSON.stringify(Array.from(selectedImages)))
    onSelectionChange({ selectedImages, rejectedImages })
  }, [selectedImages, onSelectionChange])

  useEffect(() => {
    localStorage.setItem('databanana_rejected', JSON.stringify(Array.from(rejectedImages)))
    onSelectionChange({ selectedImages, rejectedImages })
  }, [rejectedImages, selectedImages, onSelectionChange])

  // Expose validation methods to parent if requested
  useEffect(() => {
    if (exposeValidationMethods) {
      exposeValidationMethods.current = {
        toggleImageSelection,
        toggleImageRejection,
        clearValidation: () => {
          setSelectedImages(new Set())
          setRejectedImages(new Set())
          localStorage.removeItem('databanana_selected')
          localStorage.removeItem('databanana_rejected')
        },
        selectedImages,
        rejectedImages
      }
    }
  }, [exposeValidationMethods, selectedImages, rejectedImages])

  const toggleDataset = (datasetId) => {
    setExpandedDatasets(prev => {
      const newSet = new Set(prev)
      if (newSet.has(datasetId)) {
        newSet.delete(datasetId)
      } else {
        newSet.add(datasetId)
      }
      return newSet
    })
  }

  const toggleBatch = (batchId) => {
    setExpandedBatches(prev => {
      const newSet = new Set(prev)
      if (newSet.has(batchId)) {
        newSet.delete(batchId)
      } else {
        newSet.add(batchId)
      }
      return newSet
    })
  }

  const getSelectedCountForBatch = (batchImages) => {
    return batchImages.filter(img => selectedImages.has(img.id)).length
  }

  const getRejectedCountForBatch = (batchImages) => {
    return batchImages.filter(img => rejectedImages.has(img.id)).length
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
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
      } else {
        newSet.add(imageId)
        // Remove from rejected when selecting
        setRejectedImages(prevRejected => {
          const newRejected = new Set(prevRejected)
          newRejected.delete(imageId)
          return newRejected
        })
      }
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
        // Remove from selected when rejecting
        setSelectedImages(prevSelected => {
          const newSelected = new Set(prevSelected)
          newSelected.delete(imageId)
          return newSelected
        })
      }
      return newSet
    })
  }

  const handleImageClick = (imageId, event, imageData = null) => {
    if (onImageClick) {
      // Use custom click handler if provided
      onImageClick(imageData || { id: imageId }, event)
    } else {
      // Default behavior
      if (event.shiftKey) {
        toggleImageRejection(imageId)
      } else {
        toggleImageSelection(imageId)
      }
    }
  }

  if (datasets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400">No images available for validation.</p>
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {datasets.map((dataset) => {
        const isExpanded = expandedDatasets.has(dataset.id)
        const totalImagesInDataset = dataset.batches.reduce((sum, batch) => sum + batch.images.length, 0)
        const totalSelectedInDataset = dataset.batches.reduce((sum, batch) => 
          sum + getSelectedCountForBatch(batch.images), 0)
        const totalRejectedInDataset = dataset.batches.reduce((sum, batch) => 
          sum + getRejectedCountForBatch(batch.images), 0)
        const totalCostInDataset = dataset.batches.reduce((sum, batch) => sum + batch.cost, 0)
        
        return (
          <div key={dataset.id} className="border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden">
            {/* Dataset Header */}
            {showDatasetHeaders && (
              <div 
                className="bg-blue-50 dark:bg-blue-900/20 px-6 py-5 border-b border-gray-300 dark:border-gray-600 cursor-pointer"
                onClick={() => toggleDataset(dataset.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      📁 {dataset.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Created {formatDate(dataset.created_at)} • {dataset.batches.length} batches
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
                    {onSaveDataset && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSaveDataset(dataset)
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                      >
                        Save
                      </button>
                    )}
                    <span className="text-gray-400">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Batches */}
            <div className={`space-y-0 ${showDatasetHeaders && !isExpanded ? 'hidden' : ''}`}>
              {dataset.batches.map((batch, batchIndex) => {
                const isBatchExpanded = expandedBatches.has(batch.id)
                return (
                  <div key={batch.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    {/* Batch Header */}
                    <div 
                      className={`px-6 py-4 cursor-pointer transition-colors ${
                        isBatchExpanded 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800' 
                          : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => toggleBatch(batch.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            📦 Batch {batchIndex + 1}: {batch.context}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Generated {formatDate(batch.timestamp)}
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
                          <span className="text-gray-400">
                            {isBatchExpanded ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Images Grid */}
                    {isBatchExpanded && (
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
                          onClick={(e) => handleImageClick(image.id, e, image)}
                          title={onImageClick ? "Click to view" : "Click to select • Shift+Click to reject"}
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
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ImageValidationGallery