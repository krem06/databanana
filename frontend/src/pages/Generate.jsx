import { useState } from "react"
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
import { ImageUpload } from "../components/ImageUpload"
import { Sparkles, Trash2, User, X, ImageIcon, Download } from "lucide-react"

function Generate() {
  const [context, setContext] = useState("")
  const [template, setTemplate] = useState("")
  const [uploadedImage, setUploadedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [progress, setProgress] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [imageBatches, setImageBatches] = useState([])
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [visualCount, setVisualCount] = useState(4)
  const [exclusiveOwnership, setExclusiveOwnership] = useState(false)
  const [zoomedImage, setZoomedImage] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)

  const handleImageSelect = (file) => {
    setUploadedImage(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setUploadedImage(null)
    setPreviewUrl(null)
  }

  const handleGenerate = async () => {
    if (!context || !template || !acceptedTerms) return

    setIsGenerating(true)
    setProgress(0)

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 300)

    // Simulate generation
    setTimeout(() => {
      const batchId = `batch-${Date.now()}`
      const newImages = Array.from({ length: visualCount }, (_, i) => ({
        id: `${batchId}-img-${i}`,
        url: uploadedImage ? previewUrl || `https://picsum.photos/400/300?random=${Date.now()}-${i}` : `https://picsum.photos/400/300?random=${Date.now()}-${i}`,
        prompt: `${template}: ${context}`,
      }))
      
      const newBatch = {
        id: batchId,
        date: new Date().toISOString().split('T')[0],
        datasetName: `Images ${new Date().toLocaleDateString()}`,
        context,
        template,
        images: newImages
      }
      
      setImageBatches((prev) => [newBatch, ...prev])
      setIsGenerating(false)
      setProgress(0)
    }, 3000)
  }

  const handleDeleteBatch = (batchId) => {
    setImageBatches((prev) => prev.filter((batch) => batch.id !== batchId))
  }

  const handleDownloadZip = () => {
    // Simple zip download placeholder
    alert('Zip download feature coming soon!')
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Data Banana
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Generate up to 100 images at a time based on a template.
          </p>
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
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                For large batches, processing may take several minutes. An email notification will be sent to your account when ready.
              </p>
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

            {/* Generate Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={!context || !template || !acceptedTerms || isGenerating}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
          </CardContent>
        </Card>

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

        {/* Generated Image Batches */}
        {imageBatches.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Generated Batches</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadZip}
              >
                <Download className="w-4 h-4 mr-2" />
                Download ZIP
              </Button>
            </div>
            {imageBatches.map((batch) => (
              <Card key={batch.id} className="overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium mb-1">{batch.datasetName}</h3>
                      <p className="text-sm text-muted-foreground mb-1">{batch.context}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{batch.date}</span>
                        <span>•</span>
                        <span>{batch.template}</span>
                        <span>•</span>
                        <span>{batch.images.length} images</span>
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
                    {batch.images.map((image) => (
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
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setZoomedImage(null)}
              >
                <X className="w-4 h-4" />
              </Button>
              
              <div className="absolute bottom-4 left-4 bg-black/50 text-white text-sm px-2 py-1 rounded">
                {Math.round(zoomLevel * 100)}%
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default Generate