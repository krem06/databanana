import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, ImageIcon, X } from 'lucide-react'

function Gallery() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTemplate, setFilterTemplate] = useState('')
  const [zoomedImage, setZoomedImage] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)

  // Mock data - in real app this would come from API
  const publicImages = Array.from({ length: 24 }, (_, i) => ({
    id: `img-${i}`,
    url: `https://picsum.photos/400/300?random=${i + 200}`,
    prompt: ['cat on windowsill', 'modern office workspace', 'mountain landscape', 'urban street scene', 'coffee shop interior', 'vintage car', 'garden flowers', 'beach sunset'][i % 8],
    template: ['realistic', 'artistic', 'minimalist', 'vintage'][i % 4],
    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
  }))

  const filteredImages = publicImages.filter(image => {
    const matchesSearch = !searchTerm || 
      image.prompt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTemplate = !filterTemplate || filterTemplate === 'all' || image.template === filterTemplate
    return matchesSearch && matchesTemplate
  })

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Gallery
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Browse your images from standard licenses.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Search Images</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Filter by Style</Label>
                <Select value={filterTemplate} onValueChange={setFilterTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="All styles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All styles</SelectItem>
                    <SelectItem value="realistic">Realistic</SelectItem>
                    <SelectItem value="artistic">Artistic</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                    <SelectItem value="vintage">Vintage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredImages.length} image{filteredImages.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Image Grid */}
        {filteredImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="group cursor-pointer"
                onClick={() => {
                  setZoomedImage(image.url)
                  setZoomLevel(1)
                }}
              >
                <div className="relative overflow-hidden rounded-lg bg-muted">
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium line-clamp-1">{image.prompt}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{image.template}</span>
                    <span>•</span>
                    <span>{image.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-16">
            <CardContent>
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No images found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </CardContent>
          </Card>
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
                className="transition-transform duration-200 rounded-lg"
                style={{
                  transform: `scale(${zoomLevel})`,
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  objectFit: 'contain'
                }}
                draggable={false}
              />
              
              <button
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                onClick={() => setZoomedImage(null)}
              >
                <X className="w-4 h-4" />
              </button>
              
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

export default Gallery