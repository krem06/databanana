"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import { Search, ArrowLeft, Calendar, Filter, X, Download, Grid3X3, Grid2X2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"

interface GeneratedImage {
  id: string
  url: string
  prompt: string
  batchId: string
  date: string
  template: string
  context: string
}


export default function Gallery() {
  const { isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid")
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [loading, setLoading] = useState(true)
  
  // Fetch real images from backend
  useEffect(() => {
    const fetchImages = async () => {
      if (!isAuthenticated) {
        setImages([])
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        const batches = await apiClient.getBatches()
        console.log('Batches response:', batches)
        
        // Flatten batches into individual images
        const allImages: GeneratedImage[] = []
        batches.forEach((dataset: any) => {
          dataset.batches.forEach((batch: any) => {
            if (batch.images && batch.images.length > 0) {
              batch.images.forEach((image: any) => {
                allImages.push({
                  id: image.id,
                  url: image.url,
                  prompt: image.prompt || batch.context,
                  batchId: batch.id,
                  date: batch.timestamp?.split('T')[0] || new Date().toISOString().split('T')[0],
                  template: '',
                  context: batch.context
                })
              })
            }
          })
        })
        
        console.log('Processed images:', allImages)
        setImages(allImages)
        
      } catch (error) {
        console.error('Failed to fetch images:', error)
        setImages([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchImages()
  }, [isAuthenticated])


  // Filter images based on search and filters
  const filteredImages = images.filter((image) => {
    const matchesSearch = image.context.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         image.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDate = !selectedDate || selectedDate === "all" || image.date === selectedDate
    
    return matchesSearch && matchesDate
  })

  // Get unique values for filters
  const uniqueDates = Array.from(new Set(images.map(img => img.date))).sort().reverse()

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedDate("")
  }

  const hasActiveFilters = searchQuery || (selectedDate && selectedDate !== "all")

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gallery</h1>
              <p className="text-muted-foreground">
                {filteredImages.length} of {images.length} images
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "compact" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("compact")}
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by context or prompt..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Select value={selectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger id="date">
                    <SelectValue placeholder="All dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All dates</SelectItem>
                    {uniqueDates.map((date) => (
                      <SelectItem key={date} value={date}>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {date}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images Grid */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-muted-foreground">
                <p>Loading your images...</p>
              </div>
            </CardContent>
          </Card>
        ) : !isAuthenticated ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-muted-foreground">
                <p className="mb-4">Please log in to view your gallery</p>
                <Button asChild>
                  <Link href="/">Go to Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredImages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-muted-foreground">
                {hasActiveFilters ? (
                  <>
                    <p className="mb-2">No images match your current filters</p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="mb-4">No images found. Start generating some!</p>
                    <Button asChild>
                      <Link href="/">Start Generating</Link>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-4 ${
            viewMode === "grid" 
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          }`}>
            {filteredImages.map((image) => (
              <Card key={image.id} className="overflow-hidden group">
                <div className="relative">
                  <img
                    src={image.url}
                    alt={image.context}
                    className={`w-full object-cover cursor-pointer hover:opacity-90 transition-opacity ${
                      viewMode === "grid" ? "h-48" : "h-32"
                    }`}
                    onClick={() => {
                      setZoomedImage(image.url)
                      setZoomLevel(1)
                    }}
                  />
                  {viewMode === "grid" && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end">
                      <div className="w-full p-3 bg-gradient-to-t from-black/60 to-transparent text-white transform translate-y-full group-hover:translate-y-0 transition-transform">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{image.context}</p>
                            <p className="text-xs text-gray-300 truncate">{image.date}</p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-white hover:bg-white/20"
                            asChild
                          >
                            <a href={image.url} download>
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {viewMode === "compact" && (
                  <CardContent className="p-2">
                    <p className="text-xs text-muted-foreground truncate">{image.context}</p>
                  </CardContent>
                )}
              </Card>
            ))}
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
                  asChild
                >
                  <a href={zoomedImage} download>
                    <Download className="w-4 h-4" />
                  </a>
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
      </div>
    </main>
  )
}