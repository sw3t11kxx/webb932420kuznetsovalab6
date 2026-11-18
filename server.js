'use strict';

/*
 * Лабораторная работа №6. Введение в Node.js и базовый сервер на Express.
 * Вариант 18: «Статистика посещений» (счётчик в памяти).
 *
 * Маршруты:
 *   GET /            — главная страница (public/index.html)
 *   GET /about       — страница «О себе» (public/about.html)
 *   GET /api/stats   — JSON со счётчиком запросов к этому маршруту
 * Остальные файлы (CSS, JS, картинки, manifest.json, sw.js) отдаются
 * как статика из папки public.
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Счётчик хранится в переменных (в памяти): при перезапуске сервера обнуляется
let totalRequests = 0;
let lastRequest = null;

// ----- Логирование каждого запроса в консоль -----
app.use((req, res, next) => {
	const hasQuery = Object.keys(req.query).length > 0;
	console.log(
		'[' + new Date().toISOString() + '] ' + req.method + ' ' + req.path +
		(hasQuery ? ' query: ' + JSON.stringify(req.query) : '')
	);
	next();
});

// ----- Маршруты -----

// Главная
app.get('/', (req, res) => {
	res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// О себе
app.get('/about', (req, res) => {
	res.sendFile(path.join(PUBLIC_DIR, 'about.html'));
});

// Статистика: каждый запрос увеличивает счётчик
// Дополнительно (query-параметр): /api/stats?reset=true обнуляет счётчик
app.get('/api/stats', (req, res) => {
	if (req.query.reset === 'true') {
		totalRequests = 0;
	}

	totalRequests += 1;
	lastRequest = new Date().toISOString();

	res.set('Cache-Control', 'no-store'); // чтобы браузер не кешировал счётчик
	res.json({
		totalRequests: totalRequests,
		lastRequest: lastRequest,
		endpoint: '/api/stats'
	});
});

// ----- Статические файлы из папки public -----
app.use(express.static(PUBLIC_DIR));

// ----- 404: маршрут не найден -----
app.use((req, res) => {
	if (req.path.startsWith('/api/')) {
		return res.status(404).json({ error: 'Not found' });
	}
	res.status(404).type('html').send(
		'<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">' +
		'<title>404</title></head><body>' +
		'<h1>404 — страница не найдена</h1><p><a href="/">На главную</a></p>' +
		'</body></html>'
	);
});

// ----- Обработка непредвиденных ошибок -----
app.use((err, req, res, next) => {
	console.error('Ошибка сервера:', err);
	res.status(500).json({ error: 'Internal server error' });
});

// ----- Запуск (с обработкой занятого порта) -----
const server = app.listen(PORT, () => {
	console.log('Server started on port ' + PORT);
	console.log('Откройте в браузере: http://localhost:' + PORT);
});

server.on('error', (err) => {
	if (err.code === 'EADDRINUSE') {
		console.error('Порт ' + PORT + ' уже занят. Закройте другую программу или запустите с другим портом.');
	} else {
		console.error('Не удалось запустить сервер:', err);
	}
	process.exit(1);
});
