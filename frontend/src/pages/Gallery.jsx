import LazyImage from '../components/LazyImage'

function Gallery() {
  const sampleImages = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    url: `https://picsum.photos/300/200?random=${i + 100}`,
    prompt: `Generated image ${i + 1}`,
    tags: ['demo', 'placeholder']
  }))

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="card p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Public Gallery</h2>
        <input 
          type="text" 
          placeholder="Search by tags..." 
          className="input-field mb-8" 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sampleImages.map((image) => (
            <div key={image.id} className="card p-4">
              <LazyImage
                src={image.url}
                alt={image.prompt}
                className="w-full h-40 object-cover rounded-lg mb-3"
              />
              <p className="text-sm text-gray-600 mb-3 overflow-hidden text-ellipsis">
                {image.prompt}
              </p>
              <button className="btn-secondary w-full text-sm">
                Download Free
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <button className="btn-primary">Export Selected with Metadata ($0.10 each)</button>
        </div>
      </div>
    </div>
  )
}

export default Gallery