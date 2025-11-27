"use client"

import { useState, useCallback } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  onImagesChange: (files: File[]) => void
  maxFiles?: number
  className?: string
  existingImages?: File[]
}

export function ImageUpload({ 
  onImagesChange, 
  maxFiles = 14, 
  className, 
  existingImages = [] 
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [images, setImages] = useState<File[]>(existingImages)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const addImages = useCallback(
    (newFiles: File[]) => {
      const maxSize = 50 * 1024 * 1024 // 50MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      
      const validFiles = newFiles.filter(file => {
        if (file.size > maxSize) {
          console.warn(`File ${file.name} too large (${(file.size/1024/1024).toFixed(1)}MB). Max 50MB.`)
          return false
        }
        if (!allowedTypes.includes(file.type)) {
          console.warn(`File ${file.name} type ${file.type} not allowed. Use JPEG, PNG, or WebP.`)
          return false
        }
        return true
      })
      
      const updatedImages = [...images, ...validFiles].slice(0, maxFiles)
      setImages(updatedImages)
      onImagesChange(updatedImages)
    },
    [images, maxFiles, onImagesChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addImages(Array.from(e.dataTransfer.files))
      }
    },
    [addImages]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addImages(Array.from(e.target.files))
      }
    },
    [addImages]
  )

  const removeImage = useCallback(
    (index: number) => {
      const updatedImages = images.filter((_, i) => i !== index)
      setImages(updatedImages)
      onImagesChange(updatedImages)
    },
    [images, onImagesChange]
  )

  return (
    <div className={className}>
      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={URL.createObjectURL(image)}
                alt={`Reference ${index + 1}`}
                className="w-full h-20 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxFiles && (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Drop reference images here, or{" "}
              <span className="text-primary">browse</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {images.length}/{maxFiles} • JPEG, PNG, WebP up to 50MB each
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
