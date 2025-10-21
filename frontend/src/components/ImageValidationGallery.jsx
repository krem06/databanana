import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, ChevronDown, ChevronRight, FolderOpen, Package } from 'lucide-react'

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
      <Card className="text-center py-12">
        <CardContent className="flex flex-col items-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No images available for validation.</p>
        </CardContent>
      </Card>
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
          <Card key={dataset.id} className="overflow-hidden">
            {/* Dataset Header */}
            {showDatasetHeaders && (
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleDataset(dataset.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{dataset.name}</CardTitle>
                      <CardDescription>
                        Created {formatDate(dataset.created_at)} • {dataset.batches.length} batches
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="default" className="bg-green-500 hover:bg-green-500/80 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {totalCounts.selected}
                    </Badge>
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      {totalCounts.rejected}
                    </Badge>
                    <Badge variant="outline">
                      {allImages.length} total
                    </Badge>
                    <Badge variant="default">
                      ${totalCost.toFixed(2)}
                    </Badge>
                    {onSaveDataset && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSaveDataset(dataset)
                        }}
                      >
                        Save
                      </Button>
                    )}
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </div>
              </CardHeader>
            )}

            {/* Batches */}
            <CardContent className={`p-0 space-y-0 ${showDatasetHeaders && !isExpanded ? 'hidden' : ''}`}>
              {dataset.batches.map((batch, batchIndex) => {
                const isBatchExpanded = expandedBatches.has(batch.id)
                const batchCounts = getImageCounts(batch.images)
                
                return (
                  <Card key={batch.id} className="border-0 rounded-none border-b last:border-b-0">
                    {/* Batch Header */}
                    <CardHeader 
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        isBatchExpanded 
                          ? 'bg-muted border-b' 
                          : 'bg-background'
                      }`}
                      onClick={() => toggleBatch(batch.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <CardTitle className="text-base">
                              Batch {batchIndex + 1}: {batch.context}
                            </CardTitle>
                            <CardDescription>
                              Generated {formatDate(batch.timestamp)}
                              {batch.excludeTags && (
                                <span className="ml-2">• Excluded: {batch.excludeTags}</span>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="default" className="bg-green-500 hover:bg-green-500/80 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {batchCounts.selected}
                          </Badge>
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            {batchCounts.rejected}
                          </Badge>
                          <Badge variant="outline">
                            {batch.images.length} total
                          </Badge>
                          <Badge variant="default">
                            ${batch.cost.toFixed(2)}
                          </Badge>
                          {isBatchExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      </div>
                    </CardHeader>

                    {/* Images Grid */}
                    {isBatchExpanded && (
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                          {batch.images.map((image) => {
                            const isSelected = selectedImages.has(image.id)
                            const isRejected = rejectedImages.has(image.id)
                            
                            return (
                              <Card 
                                key={image.id}
                                className={`relative overflow-hidden cursor-pointer transition-all hover:scale-105 hover:shadow-md ${
                                  isSelected 
                                    ? 'ring-2 ring-green-500' 
                                    : isRejected
                                    ? 'ring-2 ring-red-500 opacity-60'
                                    : 'hover:ring-2 hover:ring-primary/20'
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
                                    <Badge 
                                      variant={isSelected ? "default" : "destructive"} 
                                      className="w-6 h-6 p-0 flex items-center justify-center rounded-full"
                                    >
                                      {isSelected ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                    </Badge>
                                  </div>
                                )}
                                
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all duration-200 flex items-center justify-center">
                                  <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                                    <Badge variant="secondary" className="text-xs">
                                      {isSelected ? 'Selected' : isRejected ? 'Rejected' : 'Click to select'}
                                    </Badge>
                                  </div>
                                </div>
                              </Card>
                            )
                          })}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default ImageValidationGallery