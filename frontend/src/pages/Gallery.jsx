import { useState } from 'react'
import LazyImage from '../components/LazyImage'
import PageContainer from '../components/PageContainer'
import PageHeader from '../components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Search, Star, Eye, Images } from 'lucide-react'

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
    <PageContainer>
      <PageHeader 
        icon={Images}
        badge="Community Datasets"
        title="Public Gallery"
        description="Browse and download community-validated ML datasets for free"
      />

      {/* Search Bar */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by prompt, tags, or concepts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-3">
              <Images className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="text-2xl font-bold text-primary mb-1">{filteredImages.length}</div>
            <div className="text-sm text-muted-foreground">Available Images</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-3">
              <Star className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="text-2xl font-bold text-primary mb-1">{selectedImages.size}</div>
            <div className="text-sm text-muted-foreground">Selected</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-3">
              <Download className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="text-2xl font-bold text-primary mb-1">${(selectedImages.size * 0.1).toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Export Cost</div>
          </CardContent>
        </Card>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
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
        <Card className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md border shadow-lg bg-background">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Download className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">Export Selected</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedImages.size} images • ${(selectedImages.size * 0.1).toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedImages(new Set())}>
                  Clear
                </Button>
                <Button size="sm">
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  )
}

export default Gallery