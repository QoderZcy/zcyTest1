// Weather Service Worker - Offline Support
const CACHE_NAME = 'weather-cache-v1';
const WEATHER_API_CACHE = 'weather-api-cache-v1';

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch event - cache weather API responses
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (isWeatherAPIRequest(url)) {
    event.respondWith(handleWeatherAPIRequest(request));
  }
});

// Handle weather API with stale-while-revalidate
async function handleWeatherAPIRequest(request) {
  const cache = await caches.open(WEATHER_API_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse)) {
    updateWeatherCache(request, cache);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseWithTimestamp = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...Object.fromEntries(networkResponse.headers.entries()),
          'sw-cached-time': Date.now().toString()
        }
      });
      await cache.put(request, responseWithTimestamp);
      return networkResponse;
    }
  } catch (error) {
    console.warn('Weather API request failed:', error);
  }

  return cachedResponse || createOfflineResponse();
}

async function updateWeatherCache(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseWithTimestamp = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...Object.fromEntries(networkResponse.headers.entries()),
          'sw-cached-time': Date.now().toString()
        }
      });
      await cache.put(request, responseWithTimestamp);
    }
  } catch (error) {
    console.warn('Background update failed:', error);
  }
}

function isExpired(response) {
  const cachedTime = response.headers.get('sw-cached-time');
  if (!cachedTime) return true;
  const cacheAge = Date.now() - parseInt(cachedTime);
  return cacheAge > 15 * 60 * 1000; // 15 minutes
}

function isWeatherAPIRequest(url) {
  return url.hostname.includes('openweathermap.org');
}

function createOfflineResponse() {
  return new Response(JSON.stringify({
    error: 'offline',
    message: 'Weather data not available offline'
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}