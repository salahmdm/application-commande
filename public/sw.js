/**
 * Service Worker pour Blossom Café PWA
 * Gère le cache et le mode offline
 */

const CACHE_NAME = 'blossom-cafe-v1';
const RUNTIME_CACHE = 'blossom-runtime-v1';

// Fichiers à mettre en cache au premier chargement
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Mise en cache des fichiers principaux');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Suppression du cache obsolète:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de cache: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return;
  
  // Ignorer les requêtes vers des domaines externes (sauf images)
  const url = new URL(event.request.url);
  if (url.origin !== location.origin && !event.request.url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Si trouvé en cache, le retourner tout en mettant à jour le cache en arrière-plan
        if (cachedResponse) {
          // Mise à jour en arrière-plan
          fetch(event.request).then((response) => {
            if (response && response.status === 200) {
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(event.request, response);
              });
            }
          }).catch(() => {
            // Échec silencieux si offline
          });
          
          return cachedResponse;
        }
        
        // Sinon, fetch et mettre en cache
        return fetch(event.request).then((response) => {
          // Vérifier si c'est une réponse valide
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          
          // Clone pour pouvoir le mettre en cache et le retourner
          const responseToCache = response.clone();
          
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
      .catch(() => {
        // Si tout échoue, retourner une page offline si disponible
        return caches.match('/offline.html');
      })
  );
});

// Gestion des messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_CLEAR') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

