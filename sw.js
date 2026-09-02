const CACHE_NAME = 'dora-pwa-v1.1.2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './monster_viewer.html',
  './manifest.json',
  './css/style.css',
  './js/audio.js',
  './js/data.js',
  './js/graphics.js',
  './js/battle.js',
  './js/main.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './bgm/battle.mp3',
  './bgm/boss.mp3',
  './bgm/castle.mp3',
  './bgm/dungeon.mp3',
  './bgm/encounter.wav',
  './bgm/ending.mp3',
  './bgm/field.mp3',
  './bgm/inn.wav',
  './bgm/opening.mp3',
  './bgm/town.mp3',
  './bgm/victory.wav'
];

// インストール時: 全アセットをダウンロード完了後にアクティベート
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[Service Worker] Precaching all assets...');
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
      self.skipWaiting();
    })
  );
});

// アクティベート時: 古いバージョンのキャッシュを安全に削除
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

// フェッチ時: シンプル＆堅牢な Cache-First
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
      }).catch(async (err) => {
        // オフライン時のナビゲーションフォールバック
        if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
          const fallback = await caches.match('./index.html') || await caches.match('./');
          if (fallback) return fallback;
        }
        throw err;
      });
    })
  );
});
