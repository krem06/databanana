import LazyImage from '../components/LazyImage'

function Gallery() {
  const sampleImages = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    url: `https://picsum.photos/300/200?random=${i + 100}`,
    prompt: `Generated image ${i + 1}`,
    tags: ['demo', 'placeholder']
  }))

  return (
    <div className="page">
      <div className="card">
        <h2 style={{ color: '#1e293b', marginBottom: '1.5rem' }}>Public Gallery</h2>
        <input 
          type="text" 
          placeholder="Search by tags..." 
          className="input" 
          style={{ marginBottom: '2rem' }} 
        />
        
        <div className="grid">
          {sampleImages.map((image) => (
            <div key={image.id} className="card" style={{ padding: '1rem' }}>
              <LazyImage
                src={image.url}
                alt={image.prompt}
                style={{ height: '150px', marginBottom: '0.75rem' }}
              />
              <p style={{ 
                fontSize: '0.9rem', 
                color: '#64748b', 
                marginBottom: '0.75rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {image.prompt}
              </p>
              <button 
                className="btn" 
                style={{ 
                  width: '100%', 
                  fontSize: '0.85rem',
                  padding: '0.5rem 1rem'
                }}
              >
                Download Free
              </button>
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button className="btn">Export Selected with Metadata ($0.10 each)</button>
        </div>
      </div>
    </div>
  )
}

export default Gallery