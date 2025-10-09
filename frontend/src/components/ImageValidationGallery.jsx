import { useState, useEffect } from 'react'

function ImageValidationGallery({ 
  datasets = [], 
  showDatasetHeaders = true,
  className = "",
  onSelectionChange = () => {},
  exposeValidationMethods = null,
  onImageClick = null,
  onSaveDataset = null,
  initialValidationState = null
}) {
  const [expandedDatasets, setExpandedDatasets] = useState(new Set())
  const [expandedBatches, setExpandedBatches] = useState(() => {
    // Auto-expand first batch of first dataset
    if (datasets.length > 0 && datasets[0].batches?.length > 0) {
      return new Set([datasets[0].batches[0].id])
    }
    return new Set()
  })
  const [selectedImages, setSelectedImages] = useState(() => {
    // Use initial state if provided, otherwise load from localStorage
    if (initialValidationState) {
      return initialValidationState.selectedImages
    }
    try {
      const saved = localStorage.getItem('databanana_selected')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })
  
  const [rejectedImages, setRejectedImages] = useState(() => {
    // Use initial state if provided, otherwise load from localStorage  
    if (initialValidationState) {
      return initialValidationState.rejectedImages
    }
    try {
      const saved = localStorage.getItem('databanana_rejected')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })


  // Save validation state and notify parent
  useEffect(() => {
    localStorage.setItem('databanana_selected', JSON.stringify(Array.from(selectedImages)))
    localStorage.setItem('databanana_rejected', JSON.stringify(Array.from(rejectedImages)))
    onSelectionChange({ selectedImages, rejectedImages })
  }, [selectedImages, rejectedImages, onSelectionChange])

  // Expose methods to parent component
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
        }
      }
    }
  }, [selectedImages, rejectedImages, exposeValidationMethods])

  const toggleSet = (setState, id) => {
    setState(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleDataset = (datasetId) => toggleSet(setExpandedDatasets, datasetId)
  const toggleBatch = (batchId) => toggleSet(setExpandedBatches, batchId)

  const toggleImageSelection = (imageId) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(imageId)) {
        newSet.delete(imageId)
      } else {
        newSet.add(imageId)
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
        setSelectedImages(prevSelected => {
          const newSelected = new Set(prevSelected)
          newSelected.delete(imageId)
          return newSelected
        })
      }
      return newSet
    })
  }

  const handleImageClick = (imageId, event, imageData) => {
    if (onImageClick) {
      onImageClick(imageData, event)
    } else if (event.shiftKey) {
      toggleImageRejection(imageId)
    } else {
      toggleImageSelection(imageId)
    }
  }

  const getImageCounts = (images) => ({
    selected: images.filter(img => selectedImages.has(img.id)).length,
    rejected: images.filter(img => rejectedImages.has(img.id)).length
  })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
        const allImages = dataset.batches.flatMap(batch => batch.images)
        const totalCounts = getImageCounts(allImages)
        const totalCost = dataset.batches.reduce((sum, batch) => sum + batch.cost, 0)
        
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
                      ✓{totalCounts.selected} selected
                    </span>
                    <span className="text-red-500 dark:text-red-400 font-medium">
                      ✗{totalCounts.rejected} rejected
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">
                      {allImages.length} total images
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ${totalCost.toFixed(2)}
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
                const batchCounts = getImageCounts(batch.images)
                
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
                            ✓{batchCounts.selected} selected
                          </span>
                          <span className="text-red-500 dark:text-red-400 font-medium">
                            ✗{batchCounts.rejected} rejected
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
                          {batch.images.map((image) => {
                            const isSelected = selectedImages.has(image.id)
                            const isRejected = rejectedImages.has(image.id)
                            
                            return (
                              <div 
                                key={image.id}
                                className={`relative rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                                  isSelected 
                                    ? 'ring-2 ring-green-500' 
                                    : isRejected
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
                                
                                {/* Selection/Rejection badge */}
                                {(isSelected || isRejected) && (
                                  <div className="absolute top-2 right-2">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                      isSelected ? 'bg-green-500' : 'bg-red-500'
                                    }`}>
                                      {isSelected ? '✓' : '✗'}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                                  <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                                    <div className="bg-white bg-opacity-90 rounded-full p-1 text-gray-700 text-xs">
                                      {isSelected ? 'Selected' : isRejected ? 'Rejected' : 'Click to select'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
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