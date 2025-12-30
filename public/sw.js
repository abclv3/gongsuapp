// Safety-Pay Service Worker v3 - 캐시 완전 리셋
const CACHE_NAME = 'safety-pay-v3';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

// 설치 이벤트 - 즉시 활성화
self.addEventListener('install', (event) => {
    console.log('SW v3 installing...');
    self.skipWaiting(); // 즉시 활성화
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache v3 opened');
                return cache.addAll(urlsToCache);
            })
    );
});

// 활성화 이벤트 - 이전 캐시 모두 삭제
self.addEventListener('activate', (event) => {
    console.log('SW v3 activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('SW v3 claiming clients');
            return self.clients.claim();
        })
    );
});

// Fetch 이벤트 - Network First 전략 (항상 최신 버전 우선)
self.addEventListener('fetch', (event) => {
    // HTML, JS, CSS 파일은 항상 네트워크 우선
    if (event.request.url.includes('.html') ||
        event.request.url.includes('.js') ||
        event.request.url.includes('.css') ||
        event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // 네트워크 응답을 캐시에 저장
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // 네트워크 실패 시 캐시에서 반환
                    return caches.match(event.request);
                })
        );
    } else {
        // 다른 리소스는 캐시 우선
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    return response || fetch(event.request);
                })
        );
    }
});
