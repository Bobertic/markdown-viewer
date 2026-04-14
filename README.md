# Markdown Viewer

Данный мини-проект был написан при помощи ИИ для просмотра Markdown‑файлов.  
Не судите строго, если при работе возникнут какие‑либо ошибки.

## Возможности

- Просмотр `.md` файлов с локального компьютера
- Загрузка Markdown по **raw‑ссылке** (например, с GitHub)
- Тёмная тема в стиле **GitHub Dark**
- Подсветка синтаксиса кода (Highlight.js)
- Поддержка **LaTeX‑формул** (KaTeX)

## Как использовать

1. **Загрузить файл** – нажмите «Выберите Markdown файл» и укажите `.md` или `.txt`.
2. **Вставить ссылку** – введите raw‑ссылку (например, `https://raw.githubusercontent.com/.../README.md`) и нажмите «Загрузить».
3. **Пример** – кнопка «✨ Пример с GitHub» загрузит демонстрационный файл.
4. **Очистить** – кнопка «🗑️ Очистить» сбрасывает просмотр.

Также поддерживается автозагрузка через параметр URL:  
`?url=https://raw.githubusercontent.com/.../file.md`

## Технологии

- HTML5 / CSS3 (адаптивная вёрстка)
- JavaScript (ES6)
- [marked](https://marked.js.org/) – парсинг Markdown
- [DOMPurify](https://github.com/cure53/DOMPurify) – санитизация HTML
- [Highlight.js](https://highlightjs.org/) – подсветка кода
- [KaTeX](https://katex.org/) – рендеринг формул
- [github-markdown-css](https://github.com/sindresorhus/github-markdown-css) – стили темы GitHub Dark

## Примечание

Проект работает полностью в браузере, все данные обрабатываются локально.  
Для загрузки по ссылке сервер должен поддерживать **CORS** (raw‑ссылки GitHub работают без проблем).
