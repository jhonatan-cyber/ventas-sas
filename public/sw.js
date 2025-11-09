// Service Worker básico para modo offline
const CACHE_NAME = 'sistema-ventas-v1'
const urlsToCache = [
  '/',
]

// Instalación
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usar Promise.allSettled para que no falle si alguna URL falla
      return Promise.allSettled(
        urlsToCache.map((url) => {
          return cache.add(url).catch((error) => {
            console.warn(`No se pudo cachear ${url}:`, error)
            // No lanzar el error, solo registrar la advertencia
            return null
          })
        })
      )
    })
  )
  // Forzar activación inmediata del nuevo Service Worker
  self.skipWaiting()
})

// Activación
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all([
        // Eliminar caches antiguos
        ...cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
        // Tomar control de todas las páginas inmediatamente
        self.clients.claim()
      ])
    })
  )
})

// Interceptar requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Devolver del cache si está disponible
      if (response) {
        return response
      }

      // Intentar fetch de la red
      return fetch(event.request)
        .then((response) => {
          // No cachear si no es válido
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clonar la respuesta para cachearla
          const responseToCache = response.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // Si falla, devolver página offline para navegación
          if (event.request.mode === 'navigate') {
            return caches.match('/').catch(() => {
              // Si incluso la página principal falla, devolver una respuesta básica
              return new Response('Sin conexión a internet', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain',
                }),
              })
            })
          }
          // Para otros tipos de requests, devolver error
          return new Response('Error de red', {
            status: 408,
            statusText: 'Request Timeout',
          })
        })
    })
  )
})

