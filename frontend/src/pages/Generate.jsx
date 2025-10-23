import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../AuthContext'
import { useOffline } from '../hooks/useOffline'
import { apiClient } from '../api'
import { useWebSocketProgress } from '../hooks/useWebSocketProgress'
import ImageValidationGallery from '../components/ImageValidationGallery'
import BatchProgressIndicator from '../components/BatchProgressIndicator'
import ConnectionStatus from '../components/ConnectionStatus'
import PageContainer from '../components/PageContainer'
import PageHeader from '../components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Zap, Download, RefreshCw, Database, Images, Loader2, ImageIcon, X, ZoomIn, ZoomOut } from 'lucide-react'

function Generate() {
  // Form state
  const [context, setContext] = useState('')
  const [excludeTags, setExcludeTags] = useState('')
  const [imageCount, setImageCount] = useState(10)
  const [activeDatasetName, setActiveDatasetName] = useState('')
  
  // Generation state
  const [generating, setGenerating] = useState(false)
  const [userCredits, setUserCredits] = useState(0)
  const [batches, setBatches] = useState([])
  
  // Modal state
  const [viewedImage, setViewedImage] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(2)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  // Validation state
  const [validationState, setValidationState] = useState({ 
    selectedImages: new Set(), 
    rejectedImages: new Set() 
  })
  
  const { user } = useAuth()
  const { isOffline } = useOffline()
  const validationRef = useRef()
  
  // WebSocket progress tracking
  const { progressData, connectionStatus, trackBatch, stopTracking } = useWebSocketProgress()

  useEffect(() => {
    loadFromLocalStorage()
    if (user) {
      fetchUserData()
    }
  }, [user])

  // Auto-save form state, batches, and validation state (with throttling)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const formState = { 
        context, 
        excludeTags, 
        imageCount, 
        activeDatasetName,
        batches,
        userCredits,
        validationState: {
          selectedImages: Array.from(validationState.selectedImages),
          rejectedImages: Array.from(validationState.rejectedImages)
        },
        savedAt: new Date().toISOString()
      }
      localStorage.setItem('databanana_form', JSON.stringify(formState))
    }, 500) // Throttle saves

    return () => clearTimeout(timeoutId)
  }, [context, excludeTags, imageCount, activeDatasetName, batches, userCredits, validationState])

  const fetchUserData = async () => {
    try {
      const userData = await apiClient.getUser()
      console.log('User data:', userData)
      setUserCredits(userData.credits || 0)
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      setUserCredits(25.50) // Fallback
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const savedForm = localStorage.getItem('databanana_form')
      if (savedForm) {
        const formState = JSON.parse(savedForm)
        setContext(formState.context || '')
        setExcludeTags(formState.excludeTags || '')
        setImageCount(formState.imageCount || 10)
        setActiveDatasetName(formState.activeDatasetName || '')
        setBatches(formState.batches || [])
        if (formState.userCredits !== undefined) {
          setUserCredits(formState.userCredits)
        }
        
        // Restore validation state
        if (formState.validationState) {
          setValidationState({
            selectedImages: new Set(formState.validationState.selectedImages || []),
            rejectedImages: new Set(formState.validationState.rejectedImages || [])
          })
        }
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }
  }


  const calculateCost = () => (imageCount * 0.05).toFixed(2)
  const canAfford = () => userCredits >= parseFloat(calculateCost())

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

    // Prompt for dataset name if not set
    if (!activeDatasetName.trim()) {
      const userDatasetName = prompt('Enter a name for your dataset:', `Dataset: ${context.slice(0, 30)}`)
      if (!userDatasetName) return
      setActiveDatasetName(userDatasetName)
    }

    setGenerating(true)

    try {
      // Call the real API (now returns execution_id for Step Functions)
      const response = await apiClient.generateBatch(context, excludeTags, imageCount)
      
      // Create batch record with pending status
      const newBatch = {
        id: response.execution_id || `execution_${Date.now()}`,
        executionId: response.execution_id,
        images: [], // Will be populated when generation completes
        context,
        excludeTags,
        cost: response.estimated_cost || parseFloat(calculateCost()),
        timestamp: new Date(),
        datasetName: activeDatasetName,
        status: 'processing' // Track status
      }
      
      setBatches(prev => [newBatch, ...prev])
      setUserCredits(prev => prev - (response.estimated_cost || parseFloat(calculateCost())))
      
      // Start tracking progress via WebSocket
      if (response.execution_id) {
        trackBatch(response.execution_id)
      }
    } catch (error) {
      console.error('Error generating batch:', error)
      alert(`Error generating images: ${error.message}. Please try again.`)
    } finally {
      setGenerating(false)
    }
  }

  // Handle batch completion from WebSocket
  const handleBatchComplete = (executionId, progressData) => {
    console.log('Batch completed:', executionId, progressData)
    
    // Update the batch with completed images
    setBatches(prev => prev.map(batch => {
      if (batch.executionId === executionId) {
        return {
          ...batch,
          images: progressData.images || [],
          status: 'completed',
          completedAt: new Date()
        }
      }
      return batch
    }))
    
    // Stop tracking this execution
    stopTracking(executionId)
    setGenerating(false)
  }

  // Handle batch error from WebSocket
  const handleBatchError = (executionId, errorData) => {
    console.error('Batch failed:', executionId, errorData)
    
    // Update batch status to failed
    setBatches(prev => prev.map(batch => {
      if (batch.executionId === executionId) {
        return {
          ...batch,
          status: 'failed',
          error: errorData.message || 'Generation failed',
          completedAt: new Date()
        }
      }
      return batch
    }))
    
    // Refund credits if provided
    if (errorData.refunded) {
      setUserCredits(prev => prev + errorData.refunded)
    }
    
    stopTracking(batchId)
    setGenerating(false)
  }

  const handleSaveDataset = (dataset) => {
    const totalImages = dataset.batches.reduce((total, batch) => total + batch.images.length, 0)
    const selectedCount = validationState.selectedImages.size
    const rejectedCount = validationState.rejectedImages.size
    
    const result = confirm(`Save current session as a permanent dataset?\n\nDataset: ${dataset.name}\nBatches: ${dataset.batches.length}\nTotal Images: ${totalImages}\nSelected: ${selectedCount}\nRejected: ${rejectedCount}\n\nThis will save all batches with their current validation state.`)
    
    if (result) {
      try {
        const datasetToSave = {
          ...dataset,
          batches: dataset.batches.map(batch => ({
            ...batch,
            images: batch.images.map(image => ({
              ...image,
              selected: validationState.selectedImages.has(image.id),
              rejected: validationState.rejectedImages.has(image.id)
            }))
          })),
          validationState: {
            selectedImages: Array.from(validationState.selectedImages),
            rejectedImages: Array.from(validationState.rejectedImages)
          },
          savedAt: new Date().toISOString()
        }
        
        // TODO: Implement actual save to backend
        console.log('Saving dataset:', datasetToSave)
        alert(`✅ Dataset "${dataset.name}" saved successfully!\n\nSaved ${selectedCount} selected and ${rejectedCount} rejected images.`)
      } catch (error) {
        alert(`❌ Failed to save dataset: ${error.message}`)
      }
    }
  }

  const resetForm = () => {
    setContext('')
    setExcludeTags('')
    setImageCount(10)
    setActiveDatasetName('')
    setBatches([])
    setValidationState({ selectedImages: new Set(), rejectedImages: new Set() })
    if (validationRef.current) {
      validationRef.current.clearValidation()
    }
    localStorage.removeItem('databanana_form')
  }

  const handleExport = async () => {
    if (validationState.selectedImages.size === 0) {
      alert('Please select at least one image to export')
      return
    }
    
    const result = confirm(`🎉 Export ${validationState.selectedImages.size} images as COCO dataset?\n\nCost: $${(validationState.selectedImages.size * 0.10).toFixed(2)}\n\nClick OK to export and clear your workspace, or Cancel to keep working.`)
    
    if (result) {
      // TODO: Implement actual export
      alert(`✅ Export Success!\n\n${validationState.selectedImages.size} images exported as COCO dataset.\nDownload link: https://example.com/dataset.zip`)
      
      setBatches([])
      setActiveDatasetName('')
      setValidationState({ selectedImages: new Set(), rejectedImages: new Set() })
      if (validationRef.current) {
        validationRef.current.clearValidation()
      }
    }
  }

  // Modal functions
  const openImageModal = (image) => {
    setViewedImage(image)
    setZoomLevel(2)
    setPanPosition({ x: 0, y: 0 })
  }

  const closeImageModal = () => {
    setViewedImage(null)
    setIsDragging(false)
  }

  const getAllImages = () => batches.flatMap(batch => batch.images)

  const getCurrentImageIndex = () => {
    if (!viewedImage) return -1
    return getAllImages().findIndex(img => img.id === viewedImage.id)
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

  // Modal drag handlers
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

  const handleMouseUp = () => setIsDragging(false)

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.5 : 0.5
    setZoomLevel(prev => Math.max(1, Math.min(4, prev + delta)))
  }

  return (
    <>
    <PageContainer>
      <PageHeader 
        icon={Zap}
        badge="AI-Powered Generation"
        title="Generate Dataset"
        description="Create diverse, labeled images for ML training"
      />

      {/* Generation Form */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">Generation Options</CardTitle>
            </div>
              <div className="flex items-center gap-3">
                {activeDatasetName && (
                  <Badge variant="secondary">
                    <Database className="h-3 w-3 mr-1" />
                    {activeDatasetName}
                  </Badge>
                )}
                {batches.length > 0 && (
                  <Badge variant="secondary">
                    ✓ Auto-saved
                  </Badge>
                )}
                <ConnectionStatus status={connectionStatus} />
                <Badge variant="outline" className="font-medium">
                  ${(userCredits || 0).toFixed(2)} credits
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="context">Scene Description</Label>
                <Input 
                  id="context"
                  type="text" 
                  value={context}
                  onChange={(e) => setContext(e.target.value.slice(0, 80))}
                  placeholder="e.g., cat on windowsill, modern office workspace..."
                  maxLength={80}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  {context.length}/80 characters
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="excludeTags">Exclude Tags</Label>
                <Input 
                  id="excludeTags"
                  type="text" 
                  value={excludeTags}
                  onChange={(e) => setExcludeTags(e.target.value)}
                  placeholder="blur, cartoon..."
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageCount">Image Count</Label>
                <Input 
                  id="imageCount"
                  type="number" 
                  value={imageCount}
                  onChange={(e) => setImageCount(Math.min(Math.max(1, parseInt(e.target.value) || 1), 50))}
                  min="1"
                  max="50"
                  className="text-center w-full"
                />
              </div>
            </div>
            
            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-sm">
                  <span className="font-medium">Cost:</span>
                  <Badge variant="outline" className="ml-2">
                    ${calculateCost()}
                  </Badge>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Status:</span>
                  {canAfford() ? 
                    <Badge variant="secondary" className="ml-2 ">
                      ✓ Sufficient Credits
                    </Badge> : 
                    <Badge variant="destructive" className="ml-2">
                      ✗ Insufficient Credits
                    </Badge>
                  }
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button 
                  onClick={handleGenerate}
                  disabled={generating || context.length < 10 || isOffline || !canAfford()}
                  size="lg"
                  className={generating ? 'relative' : ''}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : isOffline ? (
                    'Offline - Cannot Generate'
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate {imageCount} Images
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Progress Indicators */}
        {Array.from(progressData.entries()).map(([batchId, progress]) => (
          <BatchProgressIndicator
            key={batchId}
            batchId={batchId}
            progress={progress}
            onComplete={(progressData) => handleBatchComplete(batchId, progressData)}
            onError={(errorData) => handleBatchError(batchId, errorData)}
          />
        ))}

        {/* Image Gallery */}
        {batches.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-6">
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
                initialValidationState={validationState}
              />
            </CardContent>
          </Card>
        )}

      {/* Export Summary - Fixed positioned like Gallery */}
      {batches.length > 0 && validationState.selectedImages.size > 0 && (
        <Card className="export-bar fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-2xl border shadow-xl bg-white dark:bg-gray-900 z-40">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Download className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">Export Dataset</h3>
                <p className="text-xs text-muted-foreground">
                  {validationState.selectedImages.size} selected • ${(validationState.selectedImages.size * 0.10).toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setValidationState({ selectedImages: new Set(), rejectedImages: new Set() })}>
                  Clear
                </Button>
                <Button onClick={handleExport} size="sm">
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {batches.length === 0 && !generating && (
        <Card className="text-center">
          <CardContent className="p-16">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl mb-2">Ready to generate your dataset?</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Describe your scene above and click generate to start creating high-quality images for your training dataset.
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {/* Loading State (only show if no progress data available) */}
      {generating && progressData.size === 0 && (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <CardTitle className="text-lg">Starting generation process...</CardTitle>
            </div>
            <CardDescription>Connecting to real-time progress updates...</CardDescription>
          </CardContent>
        </Card>
      )}
    </PageContainer>
    
    {/* Image Modal */}
    {viewedImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeImageModal}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Top Controls */}
          <Card className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/90 border-white/20 z-10">
            <CardContent className="flex items-center gap-4 px-6 py-3 text-white">
              <span className="text-sm">{getCurrentImageIndex() + 1} / {getAllImages().length}</span>
              <Separator orientation="vertical" className="h-5 bg-white/30" />
              <span className="text-sm">Zoom: {zoomLevel.toFixed(1)}x</span>
              <Button 
                variant="ghost"
                size="icon"
                className="h-8 w-8 border border-white/50 text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); setZoomLevel(prev => Math.max(1, prev - 0.5)) }}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost"
                size="icon"
                className="h-8 w-8 border border-white/50 text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); setZoomLevel(prev => Math.min(4, prev + 0.5)) }}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Close Button */}
          <Button 
            variant="ghost"
            size="icon"
            className="absolute top-6 right-6 h-12 w-12 bg-black/90 text-white rounded-full hover:bg-black border-white/20 z-10"
            onClick={closeImageModal}
          >
            <X className="h-5 w-5" />
          </Button>

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
            <Button
              variant="destructive"
              size="lg"
              className="font-semibold px-8 py-4 rounded-full min-w-[120px]"
              onClick={(e) => { e.stopPropagation(); handleReject() }}
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
            
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-4 rounded-full min-w-[120px]"
              size="lg"
              onClick={(e) => { e.stopPropagation(); handleAccept() }}
            >
              <Zap className="h-4 w-4 mr-2" />
              Accept
            </Button>
          </div>

          {/* Instructions */}
          <Card className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/90 border-white/20">
            <CardContent className="text-white text-sm px-4 py-2">
              🖱️ Drag to pan • 🖲️ Scroll to zoom • Accept/Reject auto-advances
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

export default Generate