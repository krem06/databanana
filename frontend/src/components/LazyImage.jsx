import { useState } from 'react'

function LazyImage({ src, alt, className, style }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <div className={`relative ${className || ''}`} style={style}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
          Loading...
        </div>
      )}
      
      {error ? (
        <div className="absolute inset-0 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
          Failed to load
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover rounded-lg transition-opacity duration-200 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  )
}

export default LazyImage