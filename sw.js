const CACHE_NAME = 'dora-gh-pages-v4';
const ASSETS_TO_CACHE = [
  '/dora/',
  '/dora/index.html',
  '/dora/monster_viewer.html',
  '/dora/manifest.json',
  '/dora/css/style.css',
  '/dora/js/audio.js',
  '/dora/js/data.js',
  '/dora/js/graphics.js',
  '/dora/js/battle.js',
  '/dora/js/main.js',
  '/dora/icons/icon-192.png',
  '/dora/icons/icon-512.png',
  '/dora/icons/apple-touch-icon.png',
  '/dora/bgm/battle.mp3',
  '/dora/bgm/boss.mp3',
  '/dora/bgm/castle.mp3',
  '/dora/bgm/dungeon.mp3',
  '/dora/bgm/encounter.wav',
  '/dora/bgm/ending.mp3',
  '/dora/bgm/field.mp3',
  '/dora/bgm/inn.wav',
  '/dora/bgm/opening.mp3',
  '/dora/bgm/town.mp3',
  '/dora/bgm/victory.wav'
];

// インストール時: アセットを安全にキャッシュ
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[Service Worker] Precaching assets safely...');
      await Promise.allSettled(
        ASSETS_TO_CACHE.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'no-cache' });
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch (err) {
            console.warn('[Service Worker] Failed to cache:', url, err);
          }
        })
      );
      console.log('[Service Worker] Precaching completed.');
    })
  );
});

// アクティベート時: 古いキャッシュの削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// フェッチ時: Cache First（完全オフライン対応）
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(async () => {
        // オフライン時のナビゲーション（HTMLリクエスト）は index.html を返す
        if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
          const fallback = await caches.match('/dora/index.html') || await caches.match('/dora/');
          if (fallback) return fallback;
        }
      });
    })
  );
});
