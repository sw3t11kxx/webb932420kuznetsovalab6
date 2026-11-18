'use strict';

/*
 * Service worker (ЛР №6): кеширует статику и позволяет открыть сайт без сети.
 * Если поменяли файлы сайта — увеличьте номер версии в CACHE_NAME (v1 -> v2),
 * тогда браузер скачает свежие файлы и удалит старый кеш.
 */

const CACHE_NAME = 'astro-static-v1';

const ASSETS = [
	'/',
	'/about',
	'/style.css',
	'/script.js',
	'/pwa.js',
	'/manifest.json',
	'/images/myphoto.jpg',
	'/images/icon-192.png',
	'/images/icon-512.png',
	'/images/icon-maskable-512.png'
];

// Установка: кладём статику в кеш
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => self.skipWaiting())
	);
});

// Активация: удаляем старые кеши
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys()
			.then((keys) => Promise.all(
				keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
			))
			.then(() => self.clients.claim())
	);
});

// Запросы
self.addEventListener('fetch', (event) => {
	const request = event.request;

	// Работаем только с GET-запросами к нашему сайту
	if (request.method !== 'GET') { return; }
	const url = new URL(request.url);
	if (url.origin !== self.location.origin) { return; }

	// API не кешируем: счётчик должен приходить с сервера
	if (url.pathname.startsWith('/api/')) { return; }

	// Страницы: сначала сеть, при ошибке (офлайн) — копия из кеша
	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request)
				.then((response) => {
					if (response.ok) {
						const copy = response.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
					}
					return response;
				})
				.catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
		);
		return;
	}

	// Остальная статика: из кеша, в фоне обновляем
	event.respondWith(
		caches.match(request).then((cached) => {
			const network = fetch(request)
				.then((response) => {
					if (response && response.ok) {
						const copy = response.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
					}
					return response;
				})
				.catch(() => cached);
			return cached || network;
		})
	);
});
