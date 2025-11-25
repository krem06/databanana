"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { User, ImageIcon, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import { GenerationForm } from "@/components/generation-form"
import { ImageGallery } from "@/components/image-gallery"
import { AuthModal } from "@/components/auth-modal"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [imageBatches, setImageBatches] = useState<any[]>([])
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (isAuthenticated) {
      loadBatches()
    }
  }, [isAuthenticated])

  const loadBatches = async () => {
    try {
      const batches = await apiClient.getBatches()
      setImageBatches(batches)
    } catch (error) {
      console.error("Failed to load batches:", error)
    }
  }

  const handleGenerate = async (data: {
    context: string
    template: string
    visualCount: number
    exclusiveOwnership: boolean
    uploadedImage: File | null
  }) => {
    if (!isAuthenticated) {
      setShowAuth(true)
      return
    }

    setIsGenerating(true)
    setProgress(0)

    // Simulate progress for better UX while waiting for API
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90
        return prev + 10
      })
    }, 500)

    try {
      // TODO: Handle image upload if present
      // For now we just send the text parameters

      await apiClient.generateBatch(
        `${data.template}: ${data.context}`,
        [], // exclude_tags
        data.visualCount
      )

      // Poll for updates or just reload batches after a delay
      // Since generation is async, we might not see it immediately
      setTimeout(() => {
        loadBatches()
        setProgress(100)
        setIsGenerating(false)
        clearInterval(interval)
      }, 2000)

    } catch (error) {
      console.error("Generation failed:", error)
      setIsGenerating(false)
      clearInterval(interval)
    }
  }

  const handleDeleteBatch = async (batchId: string) => {
    // TODO: Implement delete API
    setImageBatches((prev) => prev.filter((batch) => batch.id !== batchId))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Data Banana
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Generate up to 100 images at a time based on a template.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isAuthenticated ? (
                <Button variant="outline" size="sm" onClick={() => setShowAuth(true)}>
                  Login
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground hidden md:inline">
                    {user?.signInDetails?.loginId}
                  </span>
                  <Button variant="outline" size="icon" asChild>
                    <Link href="/account">
                      <User className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
              <Button variant="outline" size="icon" asChild>
                <Link href="/gallery">
                  <ImageIcon className="h-4 w-4" />
                </Link>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>

        <GenerationForm
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />

        {/* Progress Bar */}
        {isGenerating && (
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Generating</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        <ImageGallery
          batches={imageBatches}
          onDeleteBatch={handleDeleteBatch}
        />

        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
        />
      </div>
    </main>
  )
}
