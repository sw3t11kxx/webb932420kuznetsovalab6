# Лабораторная работа №6. Node.js, Express и PWA

Кузнецова Светлана, вариант 18 — «Статистика посещений» (счётчик в памяти).

## Запуск

```
npm install
npm start
```

Сервер стартует на порту 3000 (`Server started on port 3000`).
Откройте http://localhost:3000

## Маршруты

| Маршрут | Ответ |
|---|---|
| `GET /` | главная страница (`public/index.html`) |
| `GET /about` | страница «О себе» (`public/about.html`) |
| `GET /api/stats` | JSON: `{ totalRequests, lastRequest, endpoint }` |
| любой другой | 404 (для `/api/*` — JSON `{ "error": "Not found" }`) |

Счётчик `totalRequests` хранится в переменной на сервере: каждый запрос
к `/api/stats` увеличивает его на 1, при перезапуске сервера он обнуляется.
Дополнительно: `/api/stats?reset=true` обнуляет счётчик (пример работы с query-параметром).

Статика (HTML, CSS, JS, картинки) отдаётся из папки `public` через `express.static`.
Каждый запрос логируется в консоль.

## PWA

- `public/manifest.json` — манифест с иконками (192, 512 и maskable), подключён в HTML через `<link rel="manifest">`.
- `public/sw.js` — service worker: кеширует статику, страницы открываются без сети.
- `public/pwa.js` — регистрирует service worker на каждой странице.

Проверка: DevTools (F12) → Application → Manifest / Service Workers;
офлайн-режим — вкладка Network → «Offline» и обновить страницу.

## Структура

```
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
├── README.md
└── public/
    ├── index.html
    ├── about.html
    ├── style.css
    ├── script.js
    ├── pwa.js
    ├── sw.js
    ├── manifest.json
    └── images/
        ├── myphoto.jpg
        ├── icon-192.png
        ├── icon-512.png
        └── icon-maskable-512.png
```
