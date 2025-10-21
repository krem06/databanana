import LazyImage from '../components/LazyImage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Search, Star, Eye, Images } from 'lucide-react'
import { useState } from 'react'

function Gallery() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedImages, setSelectedImages] = useState(new Set())

  const sampleImages = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    url: `https://picsum.photos/300/200?random=${i + 100}`,
    prompt: `High-quality generated image showing realistic ${['cat on windowsill', 'modern office workspace', 'mountain landscape', 'urban street scene', 'coffee shop interior', 'vintage car', 'garden flowers', 'beach sunset', 'city skyline', 'forest path', 'kitchen interior', 'book collection'][i]} with natural lighting and professional composition`,
    tags: [['nature', 'animals'], ['workspace', 'modern'], ['landscape', 'outdoor'], ['urban', 'street'], ['interior', 'cafe'], ['vehicle', 'vintage'], ['nature', 'flowers'], ['landscape', 'sunset'], ['urban', 'skyline'], ['nature', 'forest'], ['interior', 'kitchen'], ['objects', 'books']][i],
    downloads: Math.floor(Math.random() * 1000) + 50,
    rating: (Math.random() * 2 + 3).toFixed(1)
  }))

  const filteredImages = sampleImages.filter(image => 
    image.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const toggleImageSelection = (imageId) => {
    const newSelected = new Set(selectedImages)
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId)
    } else {
      newSelected.add(imageId)
    }
    setSelectedImages(newSelected)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center mb-6">
            <Badge className="text-sm px-4 py-2" variant="secondary">
              <Images className="h-4 w-4 mr-2" />
              Community Datasets
            </Badge>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Public Gallery
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Browse and download community-validated ML datasets for free
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-12 border-2 border-muted">
          <CardContent className="p-8">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Search by prompt, tags, or concepts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-lg border-0 focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-b from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Images className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-primary mb-2">{filteredImages.length}</div>
              <div className="text-muted-foreground">Available Images</div>
            </CardContent>
          </Card>
          <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-b from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-primary mb-2">{selectedImages.size}</div>
              <div className="text-muted-foreground">Selected for Export</div>
            </CardContent>
          </Card>
          <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-b from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Download className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-primary mb-2">${(selectedImages.size * 0.1).toFixed(2)}</div>
              <div className="text-muted-foreground">Export Cost</div>
            </CardContent>
          </Card>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
          {filteredImages.map((image) => (
            <Card 
              key={image.id} 
              className={`overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group ${
                selectedImages.has(image.id) ? 'ring-2 ring-primary shadow-lg scale-105' : ''
              }`}
              onClick={() => toggleImageSelection(image.id)}
            >
              <div className="relative overflow-hidden">
                <LazyImage
                  src={image.url}
                  alt={image.prompt}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {selectedImages.has(image.id) && (
                  <div className="absolute top-3 right-3 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-primary-foreground text-sm font-bold">✓</span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <Badge variant="secondary" className="text-xs bg-black/80 text-white border-0">
                    <Star className="h-3 w-3 mr-1" />
                    {image.rating}
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-black/80 text-white border-0">
                    <Eye className="h-3 w-3 mr-1" />
                    {image.downloads}
                  </Badge>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>
              
              <CardContent className="p-5">
                <p className="text-sm mb-4 line-clamp-2 text-muted-foreground leading-relaxed">
                  {image.prompt}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {image.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-9 font-medium"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Handle direct download
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Free
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Export Section */}
        {selectedImages.size > 0 && (
          <Card className="sticky bottom-6 border-2 border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                    <Download className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Export Selected Images</h3>
                    <p className="text-muted-foreground">
                      {selectedImages.size} images selected • ${(selectedImages.size * 0.1).toFixed(2)} total
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="lg" onClick={() => setSelectedImages(new Set())}>
                    Clear Selection
                  </Button>
                  <Button size="lg" className="font-medium">
                    <Download className="h-4 w-4 mr-2" />
                    Export with Metadata
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Gallery