// Service Worker básico para modo offline
const CACHE_NAME = 'sistema-ventas-v1'
const urlsToCache = [
  '/',
  '/administracion/dashboard',
  '/offline',
]

// Instalación
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
})

// Activación
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
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
            return caches.match('/offline')
          }
        })
    })
  )
})

