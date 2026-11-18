'use strict';

/*
 * ЛР №6: регистрация service worker. Подключается на всех страницах.
 * Также восстанавливает сохранённую тему (на странице /about нет основного скрипта).
 */

// Восстановление темы из localStorage (ключ тот же, что в ЛР №5)
(function () {
	try {
		var theme = localStorage.getItem('lab5_theme');
		if (theme === 'theme-light' || theme === 'theme-dark') {
			document.body.classList.remove('theme-dark', 'theme-light');
			document.body.classList.add(theme);
		}
	} catch (error) {
		console.error('Не удалось прочитать тему из localStorage:', error);
	}
})();

// Регистрация service worker
if ('serviceWorker' in navigator) {
	window.addEventListener('load', function () {
		navigator.serviceWorker.register('/sw.js')
			.then(function (registration) {
				console.log('Service worker зарегистрирован. Область действия:', registration.scope);
			})
			.catch(function (error) {
				console.error('Не удалось зарегистрировать service worker:', error);
			});
	});
} else {
	console.error('Этот браузер не поддерживает service worker.');
}
