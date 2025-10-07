import { useState, useEffect } from 'react'

export function useImageValidation() {
  const [selectedImages, setSelectedImages] = useState(new Set())
  const [rejectedImages, setRejectedImages] = useState(new Set())

  // Load from localStorage on mount
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

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('databanana_selected', JSON.stringify(Array.from(selectedImages)))
  }, [selectedImages])

  useEffect(() => {
    localStorage.setItem('databanana_rejected', JSON.stringify(Array.from(rejectedImages)))
  }, [rejectedImages])

  const toggleImageSelection = (imageId) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(imageId)) {
        newSet.delete(imageId)
      } else {
        newSet.add(imageId)
        // Remove from rejected if selecting
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
        // Remove from selected if rejecting
        setSelectedImages(prevSelected => {
          const newSelected = new Set(prevSelected)
          newSelected.delete(imageId)
          return newSelected
        })
      }
      return newSet
    })
  }

  const clearValidation = () => {
    setSelectedImages(new Set())
    setRejectedImages(new Set())
    localStorage.removeItem('databanana_selected')
    localStorage.removeItem('databanana_rejected')
  }

  return {
    selectedImages,
    rejectedImages,
    toggleImageSelection,
    toggleImageRejection,
    clearValidation
  }
}