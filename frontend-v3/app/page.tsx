"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { ImageUpload } from "@/components/image-upload"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sparkles, Trash2, User, X, ImageIcon } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import { useProgress } from "@/hooks/useProgress"

interface GeneratedImage {
  id: string
  url: string
  prompt: string
}

interface ImageBatch {
  id: string
  date: string
  context: string
  template: string
  images: GeneratedImage[]
}

export default function Home() {
  const [context, setContext] = useState("")
  const [template, setTemplate] = useState("")
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [imageBatches, setImageBatches] = useState<ImageBatch[]>([])
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [visualCount, setVisualCount] = useState(4)
  const [exclusiveOwnership, setExclusiveOwnership] = useState(false)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showAuth, setShowAuth] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [authForm, setAuthForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [userCredits, setUserCredits] = useState(0)
  const [notification, setNotification] = useState<{type: 'success' | 'error', title: string, message: string} | null>(null)
  const [activeExecution, setActiveExecution] = useState<string | null>(null)
  
  const { isAuthenticated, login, signup } = useAuth()
  const progressData = useProgress(activeExecution)
  
  // Clear progress and fetch results when WebSocket indicates completion
  useEffect(() => {
    if (progressData?.status === 'completed') {
      setTimeout(async () => {
        setActiveExecution(null)
        setIsGenerating(false)
        // Fetch updated batches to show new results
        try {
          const batchData = await apiClient.getBatches()
          setImageBatches(Array.isArray(batchData) ? batchData : [])
        } catch (error) {
          console.error('Failed to fetch batches after completion:', error)
        }
      }, 2000)
    }
  }, [progressData?.status])

  // Fetch user credits and batches when authenticated
  useEffect(() => {
    const fetchData = async () => {
      if (isAuthenticated) {
        try {
          const userData = await apiClient.getUser()
          setUserCredits(userData.credits || 0)
          
          // Also fetch existing batches
          const batchData = await apiClient.getBatches()
          setImageBatches(Array.isArray(batchData) ? batchData : [])
        } catch (error) {
          console.error('Failed to fetch user data:', error)
        }
      } else {
        setUserCredits(0)
        setImageBatches([])
      }
    }
    
    fetchData()
  }, [isAuthenticated])


  const handleImageSelect = (file: File) => {
    setUploadedImage(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setUploadedImage(null)
    setPreviewUrl(null)
  }

  const handleGenerate = async () => {
    if (!context || !template || !acceptedTerms || !isAuthenticated) return

    // Calculate cost and check credits
    const cost = visualCount * (exclusiveOwnership ? 0.20 : 0.10)
    if (userCredits < cost) {
      setNotification({
        type: 'error',
        title: 'Insufficient Credits',
        message: `You need $${cost.toFixed(2)} but have $${userCredits.toFixed(2)}. Please add funds to your account.`
      })
      return
    }

    setIsGenerating(true)

    try {
      // Start image generation (backend will deduct credits)
      const generateResponse = await apiClient.generateBatch(
        context,
        '', // excludeTags - empty for now
        visualCount
      )
      
      // Immediately refresh credits (backend deducted them)
      try {
        const updatedUserData = await apiClient.getUser()
        setUserCredits((updatedUserData as any)?.credits || 0)
      } catch (error) {
        console.error('Failed to refresh credits:', error)
      }
      
      const executionId = (generateResponse as any)?.execution_id
      
      if (executionId) {
        // Start tracking WebSocket progress
        setActiveExecution(executionId)
        
        // No notification popup - just show progress
        
        // Reset form
        setContext('')
        setTemplate('')
        setUploadedImage(null)
        setPreviewUrl(null)
        
      } else {
        throw new Error('Generation failed to start')
      }
      
    } catch (error: any) {
      console.error('Generation failed:', error)
      
      // Check if it's insufficient credits error from backend
      if (error?.status === 402 || error?.message?.includes('Insufficient')) {
        setNotification({
          type: 'error',
          title: 'Insufficient Credits',
          message: 'Please add funds to your account.'
        })
      } else {
        setNotification({
          type: 'error',
          title: 'Generation Failed',
          message: error?.message || 'Failed to generate images. Please try again.'
        })
      }
      
      setIsGenerating(false)
      setActiveExecution(null)
    }
  }

  const handleDeleteBatch = (batchId: string) => {
    setImageBatches((prev) => prev.filter((batch) => batch.id !== batchId))
  }

  const handleAccountClick = () => {
    if (isAuthenticated) {
      window.location.href = '/account'
    } else {
      setShowAuth(true)
    }
  }


  const handleAuthSubmit = async () => {
    setAuthError('')
    
    // Validation
    if (!authForm.email || !authForm.password) {
      setAuthError('Please fill in all fields')
      return
    }
    
    if (!isLogin) {
      if (!authForm.confirmPassword) {
        setAuthError('Please confirm your password')
        return
      }
      if (authForm.password !== authForm.confirmPassword) {
        setAuthError('Passwords do not match')
        return
      }
      if (authForm.password.length < 8) {
        setAuthError('Password must be at least 8 characters')
        return
      }
    }

    setAuthLoading(true)
    
    try {
      if (isLogin) {
        await login(authForm.email, authForm.password)
      } else {
        await signup(authForm.email, authForm.password)
      }
      setShowAuth(false)
      setAuthForm({ email: '', password: '', confirmPassword: '' })
    } catch (error: any) {
      let errorMessage = 'Something went wrong. Please try again.'
      
      if (error?.message) {
        const msg = error.message.toLowerCase()
        if (msg.includes('incorrect') || msg.includes('invalid')) {
          errorMessage = 'Invalid email or password'
        } else if (msg.includes('user already exists') || msg.includes('already')) {
          errorMessage = 'An account with this email already exists'
        } else if (msg.includes('weak') || msg.includes('password')) {
          errorMessage = 'Password must be at least 8 characters with numbers and letters'
        } else if (msg.includes('email') || msg.includes('username')) {
          errorMessage = 'Please enter a valid email address'
        } else {
          errorMessage = error.message
        }
      }
      
      setAuthError(errorMessage)
    } finally {
      setAuthLoading(false)
    }
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
              <Button variant="outline" size="icon" asChild>
                <Link href="/gallery">
                  <ImageIcon className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="icon" onClick={handleAccountClick}>
                <User className="h-4 w-4" />
              </Button>
              {isAuthenticated && (
                <div className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-md border border-primary/20">
                  ${userCredits.toFixed(2)}
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="mb-8">
          <CardContent className="pt-6 space-y-6">
            {/* Context Field */}
            <div className="space-y-2">
              <Label htmlFor="context">Context</Label>
              <Input
                id="context"
                placeholder="Describe your vision..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Template and Count */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Choose a style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realistic">Realistic</SelectItem>
                    <SelectItem value="artistic">Artistic</SelectItem>
                    <SelectItem value="abstract">Abstract</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                    <SelectItem value="vintage">Vintage</SelectItem>
                    <SelectItem value="futuristic">Futuristic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="count">Images</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="100"
                  value={visualCount}
                  onChange={(e) => setVisualCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Upload Image</Label>
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <ImageUpload onImageSelect={handleImageSelect} />
              )}
            </div>

            {/* Ownership Options */}
            <div className="space-y-2">
              <Label>Ownership Options</Label>
              <div className="space-y-3">
                <div className="p-4 border rounded-lg bg-muted/30">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="ownership"
                      value="standard"
                      checked={!exclusiveOwnership}
                      onChange={() => setExclusiveOwnership(false)}
                      className="mt-0.5 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-sm font-medium">Standard License ($0.10 per image)</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Images are hosted on Data Banana platform and accessible through your gallery.
                        You're free to use them for any purpose while Data Banana retains platform rights.
                      </p>
                    </div>
                  </label>
                </div>
                
                <div className="p-4 border rounded-lg bg-muted/30">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="ownership"
                      value="exclusive"
                      checked={exclusiveOwnership}
                      onChange={() => setExclusiveOwnership(true)}
                      className="mt-0.5 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-sm font-medium">Exclusive Ownership ($0.20 per image)</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Images are not hosted in the gallery. Download .zip available for 30 days, then all copies 
                        are permanently removed ensuring complete privacy and exclusive ownership.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-primary underline hover:no-underline"
                  >
                    Terms of Service
                  </button>
                </span>
              </label>
            </div>

            {/* Pricing Summary */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span>Images: {visualCount} × ${exclusiveOwnership ? '0.20' : '0.10'}</span>
                <span className="font-medium">${(visualCount * (exclusiveOwnership ? 0.20 : 0.10)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-1 text-muted-foreground">
                <span>{exclusiveOwnership ? 'Exclusive ownership' : 'Standard license'}</span>
                <span>{exclusiveOwnership ? 'No gallery hosting' : 'Gallery hosted'}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold pt-2 border-t mt-2">
                <span>Total</span>
                <span>${(visualCount * (exclusiveOwnership ? 0.20 : 0.10)).toFixed(2)}</span>
              </div>
            </div>

            {/* Processing Info */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                For large batches, processing may take several minutes. An email notification will be sent to your account when ready.
              </p>
            </div>

            {/* Generate Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={isAuthenticated ? handleGenerate : () => setShowAuth(true)}
              disabled={isAuthenticated ? (!context || !template || !acceptedTerms || isGenerating || userCredits < (visualCount * (exclusiveOwnership ? 0.20 : 0.10))) : false}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : 
               !isAuthenticated ? "Login to Generate" :
               userCredits < (visualCount * (exclusiveOwnership ? 0.20 : 0.10)) ? 
               `Need $${((visualCount * (exclusiveOwnership ? 0.20 : 0.10)) - userCredits).toFixed(2)} more` :
               "Generate"}
            </Button>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        {(isGenerating || progressData) && (
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {progressData?.step || 'Generating'}
                  </span>
                  <span className="font-medium">
                    {progressData?.progress || progress}%
                  </span>
                </div>
                <Progress value={progressData?.progress || progress} className="w-full" />
                <div className="text-xs text-muted-foreground">
                  {progressData?.message || 'Processing...'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Image Batches */}
        {imageBatches && imageBatches.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Generated Batches</h2>
            {imageBatches.map((batch) => (
              <Card key={batch.id} className="overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium mb-1">{batch.context}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{batch.date}</span>
                        <span>•</span>
                        <span>{batch.template}</span>
                        <span>•</span>
                        <span>{batch.images?.length || 0} images</span>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteBatch(batch.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(batch.images || []).map((image) => (
                      <div 
                        key={image.id} 
                        className="relative group cursor-pointer"
                        onClick={() => {
                          setZoomedImage(image.url)
                          setZoomLevel(1)
                        }}
                      >
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Terms Modal */}
        {showTerms && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTerms(false)}>
            <div className="bg-background rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Terms of Service</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowTerms(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>By using our service, you agree to the following terms:</p>
                <div className="space-y-2">
                  <p>• You will use generated images responsibly and legally</p>
                  <p>• You will not generate inappropriate or harmful content</p>
                  <p>• Generated images are provided as-is without warranty</p>
                  <p>• You retain rights to your uploaded images</p>
                  <p>• We may store images temporarily for processing</p>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => {
                      setAcceptedTerms(true)
                      setShowTerms(false)
                    }}
                    className="flex-1"
                  >
                    Accept Terms
                  </Button>
                  <Button variant="outline" onClick={() => setShowTerms(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Zoom Modal */}
        {zoomedImage && (
          <div 
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" 
            onClick={() => setZoomedImage(null)}
          >
            <div 
              className="relative w-full h-full flex items-center justify-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => {
                e.preventDefault()
                const delta = e.deltaY > 0 ? -0.1 : 0.1
                setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)))
              }}
            >
              <img
                src={zoomedImage}
                alt="Zoomed image"
                className="transition-transform duration-200 cursor-grab active:cursor-grabbing rounded-lg"
                style={{
                  transform: `scale(${zoomLevel})`,
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  objectFit: 'contain'
                }}
                draggable={false}
              />
              
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.2))}
                >
                  -
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setZoomLevel(1)}
                >
                  1:1
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.2))}
                >
                  +
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setZoomedImage(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="absolute bottom-4 left-4 bg-black/50 text-white text-sm px-2 py-1 rounded">
                {Math.round(zoomLevel * 100)}%
              </div>
            </div>
          </div>
        )}

        {/* Auth Modal */}
        {showAuth && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAuth(false)}>
            <div className="bg-background rounded-lg p-6 w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{isLogin ? "Login" : "Create Account"}</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowAuth(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                {authError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">{authError}</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter your email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm(prev => ({...prev, email: e.target.value}))}
                    disabled={authLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder=""
                    value={authForm.password}
                    onChange={(e) => setAuthForm(prev => ({...prev, password: e.target.value}))}
                    disabled={authLoading}
                  />
                  {!isLogin && (
                    <p className="text-xs text-muted-foreground">
                      Use 8+ characters with letters and numbers
                    </p>
                  )}
                </div>
                
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      placeholder=""
                      value={authForm.confirmPassword}
                      onChange={(e) => setAuthForm(prev => ({...prev, confirmPassword: e.target.value}))}
                      disabled={authLoading}
                    />
                  </div>
                )}
                
                <Button 
                  className="w-full" 
                  onClick={handleAuthSubmit}
                  disabled={authLoading || !authForm.email || !authForm.password || (!isLogin && !authForm.confirmPassword)}
                >
                  {authLoading ? "Please wait..." : (isLogin ? "Login" : "Create Account")}
                </Button>
                
                <div className="text-center text-sm text-muted-foreground">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin)
                      setAuthError('')
                      setAuthForm({ email: '', password: '', confirmPassword: '' })
                    }}
                    className="text-primary underline hover:no-underline"
                  >
                    {isLogin ? "Sign up" : "Login"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        {notification && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setNotification(null)}>
            <div className="bg-background rounded-lg p-6 max-w-md m-4 border" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${
                    notification.type === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  }`}>
                    {notification.title}
                  </h3>
                  <p className="text-muted-foreground mt-2">{notification.message}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setNotification(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2 justify-end">
                <Button onClick={() => setNotification(null)}>
                  OK
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
