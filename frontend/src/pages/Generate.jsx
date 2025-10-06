import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'

function Generate() {
  const [context, setContext] = useState('')
  const [excludeTags, setExcludeTags] = useState('')
  const [imageCount, setImageCount] = useState(10)
  const [generating, setGenerating] = useState(false)
  const [userCredits, setUserCredits] = useState(0)
  const [batches, setBatches] = useState([]) // All generated batches
  const [selectedImages, setSelectedImages] = useState(new Set()) // Selected image IDs across all batches
  const [zoomedImage, setZoomedImage] = useState(null) // Currently zoomed image
  const [zoomLevel, setZoomLevel] = useState(2) // Zoom level (2x, 3x, 4x)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 }) // Pan position
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    // Mock user data for frontend development
    setUserCredits(25.50) // Mock credits
  }

  const calculateCost = () => {
    // Cost: $0.05 per image
    return (imageCount * 0.05).toFixed(2)
  }

  const canAfford = () => {
    return userCredits >= parseFloat(calculateCost())
  }

  const generateMockImages = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `img_${Date.now()}_${i}`,
      prompt: `${context} - variation ${i + 1}: A ${['orange', 'black', 'white', 'gray', 'calico'][i % 5]} cat ${['sitting', 'lying', 'perched', 'resting'][i % 4]} on a ${['windowsill', 'wooden sill', 'marble ledge'][i % 3]}`,
      url: `https://picsum.photos/400/300?random=${Date.now() + i}`,
      tags: ['generated', 'mock']
    }))
  }

  const handleGenerate = async () => {
    if (context.length < 10) {
      alert('Context must be at least 10 characters')
      return
    }

    if (!canAfford()) {
      alert(`Insufficient credits. Need $${calculateCost()} but you have $${userCredits.toFixed(2)}`)
      return
    }

    setGenerating(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    try {
      // Mock API response
      const mockImages = generateMockImages(imageCount)
      const cost = parseFloat(calculateCost())
      
      // Add new batch to the beginning of the list
      const newBatch = {
        id: `batch_${Date.now()}`,
        images: mockImages,
        context,
        excludeTags,
        cost,
        timestamp: new Date(),
        isOpen: true // New batch starts open
      }
      
      // Close previous batches and add new one
      setBatches(prev => [
        newBatch,
        ...prev.map(batch => ({ ...batch, isOpen: false }))
      ])
      
      // Refresh user credits (mock deduction)
      setUserCredits(prev => prev - cost)
    } catch (error) {
      console.error('Error generating batch:', error)
      alert('Error generating images. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const toggleImageSelection = (imageId) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(imageId)) {
        newSet.delete(imageId)
      } else {
        newSet.add(imageId)
      }
      return newSet
    })
  }

  const toggleBatch = (batchId) => {
    setBatches(prev => prev.map(batch => 
      batch.id === batchId ? { ...batch, isOpen: !batch.isOpen } : batch
    ))
  }

  const getSelectedCountForBatch = (batchImages) => {
    return batchImages.filter(img => selectedImages.has(img.id)).length
  }

  const handleExport = async () => {
    if (selectedImages.size === 0) {
      alert('Please select at least one image to export')
      return
    }

    // Mock export
    alert(`🎉 Mock Export Success!\n\n${selectedImages.size} images exported as COCO dataset.\nDownload link: https://example.com/dataset.zip`)
  }

  const openZoom = (image) => {
    setZoomedImage(image)
    setZoomLevel(2)
    setPanPosition({ x: 0, y: 0 })
  }

  const closeZoom = () => {
    setZoomedImage(null)
    setIsDragging(false)
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
    setZoomLevel(prev => Math.max(1, Math.min(5, prev + delta)))
  }

  return (
    <div className="page">
      {/* Generation Form - Sticky at top */}
      <div className="card" style={{ position: 'sticky', top: '1rem', zIndex: 100, marginBottom: '2rem', background: 'var(--card-bg)', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Generate Dataset</h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              ⚠️ Select only realistic visuals without AI artifacts for LLM training datasets
            </p>
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Credits: <strong>${userCredits.toFixed(2)}</strong>
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 100px 100px 140px', gap: '1rem', alignItems: 'end' }}>
          <div>
            <input 
              type="text" 
              value={context}
              onChange={(e) => setContext(e.target.value.slice(0, 80))}
              placeholder="Describe your scene... (e.g., 'A cat on a windowsill')"
              className="input"
              maxLength={80}
            />
            <div className="form-hint">{context.length}/80 chars</div>
          </div>
          
          <div>
            <input 
              type="text" 
              value={excludeTags}
              onChange={(e) => setExcludeTags(e.target.value)}
              placeholder="Exclude: cartoon, anime..."
              className="input"
            />
          </div>

          <div>
            <input 
              type="number" 
              value={imageCount}
              onChange={(e) => setImageCount(Math.min(Math.max(1, parseInt(e.target.value) || 1), 50))}
              min="1"
              max="50"
              className="input"
              style={{ textAlign: 'center' }}
            />
            <div className="form-hint" style={{ textAlign: 'center' }}>images</div>
          </div>
          
          <button 
            className="btn" 
            onClick={handleGenerate}
            disabled={generating || context.length < 10 || !canAfford()}
            style={{ height: '3rem' }}
          >
            {generating ? 'Creating...' : `$${calculateCost()}`}
          </button>
          
          {selectedImages.size > 0 && (
            <button 
              className="btn" 
              onClick={handleExport} 
              style={{ 
                background: 'var(--success)', 
                height: '3rem',
                whiteSpace: 'nowrap'
              }}
            >
              Export {selectedImages.size}
            </button>
          )}
        </div>
      </div>

      {/* Batches Display */}
      {batches.map((batch, batchIndex) => (
        <div key={batch.id} className="card" style={{ marginBottom: '2rem' }}>
          {/* Batch Header */}
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              cursor: 'pointer',
              padding: '1rem',
              margin: '-1.5rem -1.5rem 1rem -1.5rem',
              background: batch.isOpen ? 'var(--primary)' : 'var(--bg-secondary)',
              color: batch.isOpen ? 'white' : 'var(--text-primary)',
              borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
            }}
            onClick={() => toggleBatch(batch.id)}
          >
            <div>
              <strong>Batch {batchIndex + 1}</strong>
              <span style={{ marginLeft: '1rem', opacity: 0.8 }}>
                {batch.context.slice(0, 40)}{batch.context.length > 40 ? '...' : ''}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span>{getSelectedCountForBatch(batch.images)}/{batch.images.length} selected</span>
              <span>${batch.cost.toFixed(2)}</span>
              <span>{batch.isOpen ? '▼' : '▶'}</span>
            </div>
          </div>

          {/* Batch Content */}
          {batch.isOpen && (
            <div className="grid" style={{ gap: '1rem' }}>
              {batch.images.map((image) => (
                <div 
                  key={image.id} 
                  className="card"
                  style={{ 
                    padding: '0.5rem',
                    border: selectedImages.has(image.id) ? '3px solid var(--success)' : '2px solid var(--border-light)',
                    transform: selectedImages.has(image.id) ? 'scale(0.98)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
                    <img 
                      src={image.url} 
                      alt={image.prompt}
                      style={{ 
                        width: '100%', 
                        height: '200px', 
                        objectFit: 'cover', 
                        borderRadius: 'var(--radius-md)',
                        cursor: 'zoom-in',
                        transition: 'transform 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.5)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        openZoom(image)
                      }}
                    />
                    
                    {/* Selection checkbox */}
                    <div 
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: selectedImages.has(image.id) ? 'var(--success)' : 'rgba(0,0,0,0.7)',
                        border: '2px solid white',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        color: 'white',
                        zIndex: 2,
                        transition: 'all 0.2s ease'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleImageSelection(image.id)
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)'
                      }}
                    >
                      {selectedImages.has(image.id) ? '✓' : '+'}
                    </div>
                    
                    {/* Zoom instruction overlay */}
                    <div style={{
                      position: 'absolute',
                      bottom: '0.5rem',
                      left: '0.5rem',
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.7rem',
                      opacity: '0.8'
                    }}>
                      🔍 Hover • Click for details
                    </div>
                  </div>
                  
                  <div style={{ padding: '0.5rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {image.prompt.slice(0, 60)}{image.prompt.length > 60 ? '...' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Empty State */}
      {batches.length === 0 && !generating && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <h3>Ready to generate your dataset?</h3>
          <p>Describe your scene above and click generate to start creating images</p>
        </div>
      )}

      {/* Zoom Modal */}
      {zoomedImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.95)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onClick={closeZoom}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Controls */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.7)',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            color: 'white',
            fontSize: '0.9rem'
          }}>
            <span>Zoom: {zoomLevel.toFixed(1)}x</span>
            <button 
              onClick={(e) => { e.stopPropagation(); setZoomLevel(prev => Math.max(1, prev - 0.5)) }}
              style={{ background: 'none', border: '1px solid white', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}
            >
              -
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setZoomLevel(prev => Math.min(5, prev + 0.5)) }}
              style={{ background: 'none', border: '1px solid white', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}
            >
              +
            </button>
          </div>

          {/* Close button */}
          <button 
            onClick={closeZoom}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid white',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            ✕ Close
          </button>

          {/* Instructions */}
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            color: 'white',
            fontSize: '0.85rem',
            textAlign: 'center'
          }}>
            🖱️ Drag to pan • 🖲️ Scroll to zoom • Click outside to close
          </div>

          {/* Image */}
          <img 
            src={zoomedImage.url}
            alt={zoomedImage.prompt}
            style={{
              maxWidth: 'none',
              maxHeight: 'none',
              width: 'auto',
              height: 'auto',
              transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            draggable={false}
          />

          {/* Selection toggle in zoom view */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleImageSelection(zoomedImage.id)
            }}
            style={{
              position: 'absolute',
              top: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: selectedImages.has(zoomedImage.id) ? 'var(--success)' : 'rgba(0,0,0,0.7)',
              border: '1px solid white',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {selectedImages.has(zoomedImage.id) ? '✓ Selected' : 'Select for dataset'}
          </button>
        </div>
      )}
    </div>
  )
}

export default Generate