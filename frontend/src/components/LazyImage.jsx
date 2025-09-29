import { useState } from 'react'

function LazyImage({ src, alt, className, style }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <div className={className} style={{ position: 'relative', ...style }}>
      {!loaded && !error && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: '#f1f5f9',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b'
        }}>
          Loading...
        </div>
      )}
      
      {error ? (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: '#fef2f2',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#dc2626'
        }}>
          Failed to load
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '8px',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.2s ease'
          }}
        />
      )}
    </div>
  )
}

export default LazyImage