const CACHE_NAME = 'databanana-v3'
const STATIC_CACHE = [
  '/',
  '/index.html',
  '/src/index.css',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/assets/databanana-top.jpg',
  '/manifest.json'
]

// Install - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_CACHE))
      .then(() => self.skipWaiting())
  )
})

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  )
})

// Fetch - network first, fallback to cache
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return

  // Skip API calls - let them fail naturally offline
  if (event.request.url.includes('/api/')) return

  // Cache images from external sources (DataBanana, etc)
  const isImage = event.request.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  const isExternalImage = isImage && !event.request.url.includes(location.origin)

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone))
        }
        return response
      })
      .catch(async () => {
        // Fallback to cache when offline
        const response = await caches.match(event.request)
        if (response) return response
        
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html')
        }
        
        // For external images, return a placeholder
        if (isExternalImage) {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f3f4f6"/><text x="200" y="150" text-anchor="middle" fill="#6b7280" font-family="sans-serif" font-size="14">Image unavailable offline</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          )
        }
        
        throw new Error('No cache match')
      })
  )
})

// Listen for skip waiting message
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})