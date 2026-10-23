/* 单词花园 Service Worker — 离线缓存 */
const CACHE_NAME = "word-garden-v14";
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/app.js',
  './js/data.js',
  './js/state.js',
  './js/sprite-engine.js',
  './js/ui.js',
  './js/util.js',
  './js/wordbank.js',
  './js/pages/friends.js',
  './js/pages/garden.js',
  './js/pages/fish.js',
  './js/pages/orchard.js',
  './js/pages/livestock.js',
  './js/pages/learn.js',
  './js/pages/pet.js',
  './js/pages/profile.js',
  './js/pages/rank.js',
  './js/pages/shop.js',
  './js/pages/tasks.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS).catch(function () {
        // 单个资源失败不阻断安装
        return Promise.all(ASSETS.map(function (url) {
          return cache.add(url).catch(function () {});
        }));
      });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE_NAME) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  // 静态资源：缓存优先，回退网络
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, clone); });
        }
        return res;
      }).catch(function () {
        // 离线且无缓存时，导航请求返回首页
        if (req.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
