// spell:disable

// ---------- DOM элементы ----------
const fileInput = document.getElementById('fileInput');
const urlInput = document.getElementById('urlInput');
const loadUrlBtn = document.getElementById('loadUrlBtn');
const exampleBtn = document.getElementById('exampleBtn');
const clearPreviewBtn = document.getElementById('clearPreviewBtn');
const previewDiv = document.getElementById('previewContent');
const fileStatusSpan = document.getElementById('fileStatus');
const urlStatusSpan = document.getElementById('urlStatus');

// Флаг готовности KaTeX auto-render
let katexAutoRenderReady = false;
window.renderMathInElementIfReady = function () {
    if (typeof renderMathInElement !== 'undefined') {
        katexAutoRenderReady = true;
    }
};

// ---------- Настройки marked: отключаем авто-ID заголовков ----------
if (typeof marked !== 'undefined') {
    marked.setOptions({
        gfm: true,
        breaks: false,
        pedantic: false,
        mangle: false,
        smartLists: true,
        smartypants: false,
        headerIds: false
    });
} else {
    console.error("marked библиотека не загружена");
}

// ---------- GitHub-совместимый slugger ----------
function createSlugger() {
    const seen = {};
    return function (text) {
        let slug = text
            .toLowerCase()
            .trim()
            .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
            .replace(/[^\w\u0400-\u04FF\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
        if (seen[slug]) {
            slug = slug + '-' + seen[slug]++;
        } else {
            seen[slug] = 1;
        }
        return slug;
    };
}

// ---------- Назначение ID заголовкам ----------
function applyHeaderIds() {
    const slug = createSlugger();
    const headers = previewDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headers.forEach(header => {
        const text = header.textContent.trim();
        if (text) {
            header.id = slug(text);
        }
    });
}

// ---------- Рендеринг формул через KaTeX ----------
function renderMath() {
    if (!katexAutoRenderReady || typeof renderMathInElement === 'undefined') {
        // Если библиотека ещё не загрузилась, подождём чуть-чуть
        setTimeout(() => {
            if (typeof renderMathInElement !== 'undefined') {
                renderMathInElement(previewDiv, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false }
                    ],
                    throwOnError: false,
                    errorColor: '#f85149'
                });
            }
        }, 50);
        return;
    }
    renderMathInElement(previewDiv, {
        delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
        ],
        throwOnError: false,
        errorColor: '#f85149'
    });
}

// ---------- Поиск элемента по хэшу ----------
function findTargetElement(hash) {
    if (!hash) return null;
    let element = document.getElementById(hash);
    if (element) return element;
    try {
        element = previewDiv.querySelector(`[id="${CSS.escape(hash)}"]`);
        if (element) return element;
    } catch (e) { }
    const prefixed = `user-content-${hash}`;
    element = document.getElementById(prefixed);
    if (element) return element;
    try {
        element = previewDiv.querySelector(`[id="${CSS.escape(prefixed)}"]`);
        if (element) return element;
    } catch (e) { }
    try {
        element = document.querySelector(`[name="${CSS.escape(hash)}"]`);
        if (element) return element;
    } catch (e) { }
    const allWithId = previewDiv.querySelectorAll('[id]');
    for (let el of allWithId) {
        if (el.id && el.id.toLowerCase() === hash.toLowerCase()) return el;
    }
    return null;
}

// ---------- Обработка кликов по якорным ссылкам ----------
function handleAnchorClick(e) {
    let link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href) return;
    let url;
    try {
        url = new URL(href, window.location.href);
    } catch (err) {
        return;
    }
    if (!url.hash) return;
    const rawHash = url.hash.substring(1);
    const hash = rawHash.split(/[?#]/)[0];
    if (!hash) return;
    const targetElement = findTargetElement(hash);
    if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', `#${hash}`);
    }
}

// ---------- Обработка хэша после рендера ----------
function handleHashAfterRender() {
    if (window.location.hash) {
        const rawHash = window.location.hash.substring(1);
        const hash = rawHash.split(/[?#]/)[0];
        if (hash) {
            setTimeout(() => {
                const target = findTargetElement(hash);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 150);
        }
    }
}

// ---------- Основная функция рендеринга Markdown ----------
async function renderMarkdown(markdownText, sourceLabel = 'источник') {
    if (!markdownText || markdownText.trim() === '') {
        previewDiv.innerHTML = `<div style="color: #8b949e; text-align: center; padding: 2rem 1rem;">⚠️ Пустой Markdown. Нет содержимого для отображения.</div>`;
        return false;
    }

    try {
        let rawHtml;
        if (typeof marked.parse === 'function') {
            rawHtml = await marked.parse(markdownText);
        } else if (typeof marked === 'function') {
            rawHtml = marked(markdownText);
        } else {
            throw new Error('Ошибка инициализации marked');
        }

        // Разрешаем теги и атрибуты, нужные для KaTeX
        const cleanHtml = DOMPurify.sanitize(rawHtml, {
            ALLOWED_TAGS: [
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
                'strong', 'em', 'del', 'hr', 'br', 'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
                'img', 'figure', 'figcaption', 'section', 'article', 'header', 'footer', 'details', 'summary',
                'input', 'label', 'sup', 'sub', 'small', 'kbd', 'mark',
                // для KaTeX
                'math', 'annotation', 'semantics', 'mrow', 'mi', 'mn', 'mo', 'msup', 'msub', 'msubsup',
                'mfrac', 'msqrt', 'mroot', 'mfenced', 'menclose', 'merror', 'mpadded', 'mphantom',
                'mspace', 'mtext', 'munder', 'mover', 'munderover', 'mtable', 'mtr', 'mtd', 'mlabeledtr',
                'svg', 'path', 'line', 'rect', 'circle', 'ellipse', 'polygon', 'g', 'defs', 'use'
            ],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel', 'type', 'checked',
                'disabled', 'role', 'name', 'xmlns', 'viewBox', 'd', 'fill', 'stroke', 'stroke-width',
                'transform', 'style']
        });
        previewDiv.innerHTML = cleanHtml;

        // Назначаем ID заголовкам (для якорей)
        applyHeaderIds();

        // Подсветка кода
        if (typeof hljs !== 'undefined') {
            const codeBlocks = previewDiv.querySelectorAll('pre code');
            codeBlocks.forEach(block => {
                hljs.highlightElement(block);
            });
        }

        // Рендеринг формул KaTeX
        renderMath();

        // Обработка хэша (прокрутка к якорю)
        handleHashAfterRender();
        return true;
    } catch (err) {
        console.error('Render error:', err);
        previewDiv.innerHTML = `<div style="color: #f85149; background: rgba(248,81,73,0.1); padding: 1rem; border-radius: 12px;">
                ❌ Ошибка преобразования Markdown: ${err.message}<br>Проверьте формат файла.
            </div>`;
        return false;
    }
}

// ---------- Утилиты для статуса ----------
let statusTimeout = null;
function setStatusMessage(element, message, isError = false) {
    if (statusTimeout) clearTimeout(statusTimeout);
    element.classList.remove('error-msg', 'success-msg');
    element.innerHTML = message;
    if (isError) {
        element.classList.add('error-msg');
    } else {
        element.classList.add('success-msg');
    }
    statusTimeout = setTimeout(() => {
        if (element) {
            element.classList.remove('error-msg', 'success-msg');
            if (element.id === 'fileStatus') {
                element.innerHTML = '📄 Выберите .md файл или используйте ссылку';
            } else if (element.id === 'urlStatus') {
                element.innerHTML = '🔗 Вставьте raw-ссылку (GitHub raw)';
            }
        }
    }, 4000);
}

// ---------- Загрузка по URL ----------
async function loadMarkdownFromUrl(url, showStatus = true) {
    let finalUrl = url.trim();
    if (!finalUrl) {
        if (showStatus) setStatusMessage(urlStatusSpan, '❌ Введите ссылку', true);
        return false;
    }
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
        if (urlInput) urlInput.value = finalUrl;
    }
    fileInput.value = '';
    
    if (showStatus) setStatusMessage(urlStatusSpan, '⏳ Загрузка...', false);
    previewDiv.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; gap:12px; padding: 2rem;">
            <div class="loading-spinner"></div> <span style="color:#c9d1d9;">Загрузка Markdown...</span>
        </div>`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(finalUrl, {
            method: 'GET',
            headers: { 'Accept': 'text/markdown,text/plain,text/html;q=0.9' },
            signal: controller.signal,
            mode: 'cors'
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const markdownText = await response.text();
        if (!markdownText || markdownText.length === 0) {
            throw new Error('Пустой ответ от сервера');
        }
        if (showStatus) setStatusMessage(urlStatusSpan, `✅ Загружено ${(markdownText.length / 1024).toFixed(1)} KB`, false);
        const ok = await renderMarkdown(markdownText, finalUrl);
        if (ok && showStatus) {
            document.querySelector('.preview-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return true;
    } catch (err) {
        console.error('fetch error:', err);
        let errorMsg = '';
        if (err.name === 'AbortError') errorMsg = 'Таймаут (15 сек). Проверьте ссылку.';
        else if (err.message.includes('Failed to fetch') || err.message.includes('CORS'))
            errorMsg = 'CORS / сетевой блок. Используйте raw.githubusercontent.com ссылки.';
        else errorMsg = err.message;
        if (showStatus) {
            previewDiv.innerHTML = `<div style="color:#f85149; background:rgba(248,81,73,0.1); border-radius:12px; padding:1.2rem; text-align:center;">
                    <strong>❌ Ошибка загрузки</strong><br>${errorMsg}<br><br>
                    <span style="font-size:0.85rem;">💡 Совет: используйте raw-ссылки GitHub (кнопка "Пример")</span>
                </div>`;
            setStatusMessage(urlStatusSpan, `Ошибка: ${errorMsg}`, true);
        } else {
            console.warn("Автозагрузка не удалась:", errorMsg);
        }
        return false;
    }
}

// ---------- Обработчики UI ----------
loadUrlBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (!url) {
        setStatusMessage(urlStatusSpan, 'Введите ссылку на RAW Markdown', true);
        return;
    }
    loadMarkdownFromUrl(url, true);
});

async function loadExample() {
    const exampleUrl = 'https://raw.githubusercontent.com/octocat/hello-worId/master/README.md';
    urlInput.value = exampleUrl;
    await loadMarkdownFromUrl(exampleUrl, true);
}
exampleBtn.addEventListener('click', loadExample);

clearPreviewBtn.addEventListener('click', () => {
    previewDiv.innerHTML = `<div style="color: #8b949e; text-align: center; padding: 2rem 1rem;">
            🧹 Просмотр очищен. Выберите файл или загрузите Markdown по ссылке.
        </div>`;

    // Очищаем поле ввода URL
    urlInput.value = '';

    // Сбрасываем выбранный файл (позволяет повторно выбрать тот же файл)
    fileInput.value = '';

    // Обновляем статусные сообщения
    setStatusMessage(fileStatusSpan, 'Просмотр сброшен, выберите файл', false);
    setStatusMessage(urlStatusSpan, 'Очистка выполнена', false);

    // Убираем хэш из URL, если он был
    if (window.location.hash) {
        history.pushState(null, '', window.location.pathname + window.location.search);
    }
});

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        loadUrlBtn.click();
    }
});

// ---------- Загрузка локального файла ----------
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
        setStatusMessage(fileStatusSpan, 'Файл не выбран', false);
        return;
    }
    urlInput.value = '';
    setStatusMessage(fileStatusSpan, `⏳ Чтение "${file.name}"...`, false);

    const reader = new FileReader();
    reader.onload = async (e) => {
        const content = e.target.result;
        if (!content || content.length === 0) {
            setStatusMessage(fileStatusSpan, '❌ Файл пуст', true);
            previewDiv.innerHTML = `<div style="color:#f85149;text-align:center;padding:2rem;">Файл не содержит данных.</div>`;
            return;
        }
        setStatusMessage(fileStatusSpan, `✅ Загружено: ${file.name} (${(content.length / 1024).toFixed(1)} KB)`, false);
        const renderOk = await renderMarkdown(content, file.name);
        if (!renderOk) {
            setStatusMessage(fileStatusSpan, `⚠️ Ошибка отображения`, true);
        } else {
            document.querySelector('.preview-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };
    reader.onerror = (err) => {
        setStatusMessage(fileStatusSpan, `❌ Ошибка чтения файла`, true);
        previewDiv.innerHTML = `<div style="color:#f85149;text-align:center;padding:2rem;">Не удалось прочитать файл.</div>`;
    };
    reader.readAsText(file, 'UTF-8');
});

// ---------- Поддержка ?url= в строке ----------
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

async function handleAutoLoadFromUrlParam() {
    const urlParam = getQueryParam('url');
    if (urlParam && urlParam.trim() !== '') {
        let decodedUrl = '';
        try {
            decodedUrl = decodeURIComponent(urlParam);
        } catch(e) {
            decodedUrl = urlParam;
        }
        urlInput.value = decodedUrl;
        setStatusMessage(urlStatusSpan, `🔄 Автозагрузка из параметра URL...`, false);
        const success = await loadMarkdownFromUrl(decodedUrl, true);
        if (!success) {
            setStatusMessage(urlStatusSpan, `⚠️ Не удалось загрузить по параметру url. Проверьте ссылку.`, true);
            previewDiv.innerHTML = `<div style="color:#f85149; background:rgba(248,81,73,0.1); padding:1rem; border-radius:12px;">
                <strong>❌ Автозагрузка не удалась</strong><br>
                Параметр <code>?url=</code> указан, но загрузить содержимое не получилось.<br>
                Убедитесь, что ссылка ведёт на RAW-файл и поддерживает CORS.
            </div>`;
        }
    } else {
        // Загружаем example.markdown с сервера
        try {
            const response = await fetch('example.markdown');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText}`);
            }
            const welcomeMarkdown = await response.text();
            await renderMarkdown(welcomeMarkdown, 'example.markdown');
        } catch (err) {
            console.error('Ошибка загрузки example.markdown:', err);
            // Резервный текст, если файл не найден
            const fallbackMarkdown = `# ⚠️ Файл example.markdown не найден`;
            await renderMarkdown(fallbackMarkdown, 'fallback');
        }
    }
}

// ---------- Делегирование кликов по якорям ----------
previewDiv.addEventListener('click', handleAnchorClick);

// ---------- Инициализация ----------
window.addEventListener('DOMContentLoaded', async () => {
    await handleAutoLoadFromUrlParam();
    if (!getQueryParam('url')) {
        fileStatusSpan.innerHTML = '📄 Выберите .md файл или используйте ссылку';
        urlStatusSpan.innerHTML = '🔗 Вставьте raw-ссылку (GitHub raw)';
    }
});
