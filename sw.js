// Service Worker للتطبيق
const CACHE_NAME = 'accounting-app-v1';
const urlsToCache = [
    '/',
    '/mobile/index.html',
    '/assets/css/mobile.css',
    '/assets/js/mobile-app.js',
    '/assets/js/i18n.js',
    '/assets/js/main.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // إرجاع الملف المخبأ إذا وجد، أو جلب من الشبكة
                return response || fetch(event.request);
            }
        )
    );
});

self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // مزامنة البيانات في الخلفية
    console.log('Background sync started');
}