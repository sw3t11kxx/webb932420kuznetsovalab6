'use strict';

/*
 * script.js (ЛР №5 + ЛР №6).
 *
 * ЧАСТЬ 1 — ЛР №5 (DOM и localStorage): карточки объектов (добавить / удалить),
 *           скрытие блока, переключение темы, сохранение состояния.
 * ЧАСТЬ 2 — ЛР №6 (в конце файла): запрос к серверу GET /api/stats
 *           и вывод статистики на странице.
 *
 * Окно с вопросом имени из ЛР №4 в этой версии убрано: оно мешало
 * установке и работе приложения как PWA.
 */

(function () {
	// ----- Ключи localStorage и данные по умолчанию -----
	var STORAGE_OBJECTS = 'lab5_objects';
	var STORAGE_THEME = 'lab5_theme';
	var THEME_DARK = 'theme-dark';
	var THEME_LIGHT = 'theme-light';

	var DEFAULT_OBJECTS = [
		{ id: 'd1', name: 'Сириус', type: 'Звезда', brightness: -1.46 },
		{ id: 'd2', name: 'Вега', type: 'Звезда', brightness: 0.03 },
		{ id: 'd3', name: 'Капелла', type: 'Звезда', brightness: 0.08 },
		{ id: 'd4', name: 'Плеяды (M45)', type: 'Рассеянное скопление', brightness: 1.6 },
		{ id: 'd5', name: 'Галактика Андромеды (M31)', type: 'Галактика', brightness: 3.4 },
		{ id: 'd6', name: 'Туманность Ориона (M42)', type: 'Туманность', brightness: 4.0 }
	];

	// ----- Поиск элементов с проверкой существования -----

	// getElementById: ищем по id и логируем, если не нашли
	function findById(id) {
		var element = document.getElementById(id);
		if (!element) {
			console.error('Элемент не найден: #' + id);
		}
		return element;
	}

	// querySelector: ищем по CSS-селектору и логируем, если не нашли
	function findOne(selector) {
		var element = document.querySelector(selector);
		if (!element) {
			console.error('Элемент не найден: ' + selector);
		}
		return element;
	}

	var body = document.body;
	var addBtn = findById('add-btn');
	var toggleBtn = findById('toggle-btn');
	var resetBtn = findById('reset-btn');
	var themeBtn = findById('theme-btn');
	var objectsBody = findById('objects-body');
	var emptyMessage = findById('empty-message');
	var container = findOne('#objects .cards');

	// Если чего-то нет — скрипт не выполняется
	if (!body || !addBtn || !toggleBtn || !resetBtn || !themeBtn ||
		!objectsBody || !emptyMessage || !container) {
		console.error('Скрипт не запущен: на странице нет нужных элементов.');
		return;
	}

	// ----- Работа с localStorage (с защитой от ошибок) -----

	function saveToStorage(key, value) {
		try {
			localStorage.setItem(key, value);
		} catch (error) {
			console.error('Не удалось сохранить в localStorage (' + key + '):', error);
		}
	}

	function readFromStorage(key) {
		try {
			return localStorage.getItem(key);
		} catch (error) {
			console.error('Не удалось прочитать localStorage (' + key + '):', error);
			return null;
		}
	}

	function isValidObject(item) {
		return item !== null &&
			typeof item === 'object' &&
			typeof item.id === 'string' &&
			typeof item.name === 'string' &&
			typeof item.type === 'string' &&
			typeof item.brightness === 'number' &&
			isFinite(item.brightness);
	}

	// Возвращает массив объектов или null, если сохранённых данных нет
	function loadObjects() {
		var raw = readFromStorage(STORAGE_OBJECTS);
		if (raw === null) {
			return null;
		}
		try {
			var data = JSON.parse(raw);
			if (Array.isArray(data)) {
				return data.filter(isValidObject);
			}
		} catch (error) {
			console.error('Сохранённые объекты повреждены, загружаем список по умолчанию:', error);
		}
		return null;
	}

	function saveObjects() {
		saveToStorage(STORAGE_OBJECTS, JSON.stringify(objects));
	}

	// ----- Состояние -----

	var objects = loadObjects();
	if (objects === null) {
		objects = DEFAULT_OBJECTS.slice();
		saveObjects();
	}

	// ----- Создание карточки через createElement -----

	function formatBrightness(value) {
		return value.toLocaleString('ru-RU', {
			minimumFractionDigits: 1,
			maximumFractionDigits: 2
		});
	}

	// Одна строка списка характеристик: <div><dt>…</dt><dd>…</dd></div>
	function createRow(label, value, withMagnitudeMark) {
		var row = document.createElement('div');
		var dt = document.createElement('dt');
		var dd = document.createElement('dd');

		dt.textContent = label;
		dd.textContent = value;

		if (withMagnitudeMark) {
			var sup = document.createElement('sup');
			sup.textContent = 'm';
			dd.appendChild(sup);
		}

		row.appendChild(dt);
		row.appendChild(dd);
		return row;
	}

	function createCard(item) {
		var card = document.createElement('article');
		card.className = 'card';
		card.setAttribute('data-id', item.id);

		var title = document.createElement('h3');
		title.textContent = item.name;

		var list = document.createElement('dl');
		list.appendChild(createRow('Тип', item.type, false));
		list.appendChild(createRow('Яркость', formatBrightness(item.brightness), true));

		var deleteBtn = document.createElement('button');
		deleteBtn.type = 'button';
		deleteBtn.className = 'delete-btn btn-secondary';
		deleteBtn.textContent = 'Удалить';
		deleteBtn.setAttribute('aria-label', 'Удалить объект «' + item.name + '»');

		card.appendChild(title);
		card.appendChild(list);
		card.appendChild(deleteBtn);
		return card;
	}

	// Показывает сообщение «Список пуст», если карточек нет (querySelectorAll)
	function updateEmptyMessage() {
		var cards = container.querySelectorAll('.card');
		emptyMessage.hidden = cards.length > 0;
	}

	function renderAll() {
		container.textContent = '';
		objects.forEach(function (item) {
			container.appendChild(createCard(item));
		});
		updateEmptyMessage();
	}

	// ----- Добавление объекта -----

	function askText(message, defaultValue) {
		var answer = prompt(message, defaultValue || '');
		if (answer === null) {
			return null; // пользователь нажал «Отмена»
		}
		return answer.trim();
	}

	function addObject() {
		var name = askText('Название объекта (например, Бетельгейзе):');
		if (name === null) { return; }
		if (name === '') {
			alert('Название не может быть пустым.');
			return;
		}

		var type = askText('Тип объекта (звезда, галактика, туманность…):', 'Звезда');
		if (type === null) { return; }
		if (type === '') {
			alert('Тип не может быть пустым.');
			return;
		}

		var brightnessText = askText('Яркость в звёздных величинах (например, 1,5 или -0,3):');
		if (brightnessText === null) { return; }
		var brightness = Number(brightnessText.replace(',', '.').replace('\u2212', '-'));
		if (brightnessText === '' || !isFinite(brightness) || brightness < -30 || brightness > 30) {
			alert('Яркость должна быть числом от -30 до 30.');
			return;
		}

		var item = {
			id: 'o' + Date.now() + Math.floor(Math.random() * 1000),
			name: name.slice(0, 60),
			type: type.slice(0, 40),
			brightness: brightness
		};

		objects.push(item);
		container.appendChild(createCard(item));
		saveObjects();
		updateEmptyMessage();
	}

	// ----- Удаление конкретной карточки (делегирование событий) -----

	function onContainerClick(event) {
		var button = event.target.closest('.delete-btn');
		if (!button) { return; }

		var card = button.closest('.card');
		if (!card) {
			console.error('Элемент не найден: .card для кнопки удаления');
			return;
		}

		var id = card.getAttribute('data-id');
		objects = objects.filter(function (item) {
			return item.id !== id;
		});
		card.remove();
		saveObjects();
		updateEmptyMessage();
	}

	// ----- Сброс к исходному списку -----

	function resetObjects() {
		if (!confirm('Вернуть исходный список объектов? Добавленные карточки будут удалены.')) {
			return;
		}
		objects = DEFAULT_OBJECTS.slice();
		saveObjects();
		renderAll();
	}

	// ----- Скрытие / показ блока с объектами -----

	function toggleObjects() {
		var nowHidden = objectsBody.classList.toggle('hidden');
		toggleBtn.textContent = nowHidden ? 'Показать объекты' : 'Скрыть объекты';
		toggleBtn.setAttribute('aria-expanded', String(!nowHidden));
	}

	// ----- Тема -----

	function applyTheme(theme) {
		var isLight = theme === THEME_LIGHT;
		body.classList.remove(THEME_DARK, THEME_LIGHT);
		body.classList.add(isLight ? THEME_LIGHT : THEME_DARK);
		document.documentElement.style.colorScheme = isLight ? 'light' : 'dark';
		themeBtn.textContent = isLight ? 'Тёмная тема' : 'Светлая тема';
		themeBtn.setAttribute('aria-pressed', String(isLight));
	}

	function toggleTheme() {
		var next = body.classList.contains(THEME_LIGHT) ? THEME_DARK : THEME_LIGHT;
		applyTheme(next);
		saveToStorage(STORAGE_THEME, next);
	}

	// ----- Запуск: восстановление состояния и обработчики -----

	var savedTheme = readFromStorage(STORAGE_THEME);
	applyTheme(savedTheme === THEME_LIGHT ? THEME_LIGHT : THEME_DARK);
	renderAll();

	addBtn.addEventListener('click', addObject);
	resetBtn.addEventListener('click', resetObjects);
	toggleBtn.addEventListener('click', toggleObjects);
	themeBtn.addEventListener('click', toggleTheme);
	container.addEventListener('click', onContainerClick);
})();


/* =====================================================================
   ЧАСТЬ 2. ЛР №6: статистика посещений с сервера Express
   ===================================================================== */
(function () {
	var output = document.getElementById('stats-output');
	var button = document.getElementById('stats-btn');

	if (!output || !button) {
		console.error('Элемент не найден: #stats-output или #stats-btn');
		return;
	}

	function formatDate(iso) {
		var date = new Date(iso);
		return isNaN(date.getTime()) ? iso : date.toLocaleString('ru-RU');
	}

	function loadStats() {
		output.textContent = 'Загрузка…';

		fetch('/api/stats', { cache: 'no-store' })
			.then(function (response) {
				if (!response.ok) {
					throw new Error('HTTP ' + response.status);
				}
				return response.json();
			})
			.then(function (data) {
				output.textContent =
					'Всего запросов к /api/stats: ' + data.totalRequests +
					'. Последний запрос: ' + formatDate(data.lastRequest) + '.';
			})
			.catch(function (error) {
				console.error('Не удалось получить статистику:', error);
				output.textContent = 'Нет связи с сервером (возможно, офлайн-режим): статистика недоступна.';
			});
	}

	button.addEventListener('click', loadStats);
	loadStats();
})();
