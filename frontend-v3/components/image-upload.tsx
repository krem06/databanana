"use client"

import { useState, useCallback } from "react"
import { Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  className?: string
}

export function ImageUpload({ onImageSelect, className }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0]
        if (file.type.startsWith("image/")) {
          onImageSelect(file)
        }
      }
    },
    [onImageSelect]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0]
        if (file.type.startsWith("image/")) {
          onImageSelect(file)
        }
      }
    },
    [onImageSelect]
  )

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50",
        className
      )}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">
          Drop your image here, or{" "}
          <span className="text-primary">browse</span>
        </p>
        <p className="text-xs text-muted-foreground">
          PNG, JPG, GIF up to 10MB
        </p>
      </div>
    </div>
  )
}
