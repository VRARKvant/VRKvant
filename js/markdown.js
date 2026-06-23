// Настройка Markdown парсера (Highlight.js)
export function initMarkdown() {
    if (typeof marked !== 'undefined' && typeof hljs !== 'undefined') {
        const renderer = {
            image(token) {
                // Поддержка как нового API (token), так и старого (href, title, text)
                const href = typeof token === 'object' && token !== null ? token.href : arguments[0];
                const title = typeof token === 'object' && token !== null ? token.title : arguments[1];
                const text = typeof token === 'object' && token !== null ? token.text : arguments[2];
                return `<img src="${href}" alt="${text || ''}" title="${title || ''}" class="rounded-none shadow-lg mx-auto block my-6 max-w-full">`;
            }
        };

        const highlightConfig = {
            highlight: (code, lang) => hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang }).value : hljs.highlightAuto(code).value,
            langPrefix: 'hljs language-'
        };

        if (typeof marked.use === 'function') {
            marked.use({ renderer, ...highlightConfig });
        } else if (typeof marked.setOptions === 'function') {
            const oldRenderer = new marked.Renderer();
            oldRenderer.image = renderer.image;
            marked.setOptions({ renderer: oldRenderer, ...highlightConfig });
        }
    }
}

export function processCustomTags(text) {
    const codeBlocks = [];

    // Прячем код от магии
    text = text.replace(/```[\s\S]*?```/g, match => { codeBlocks.push(match); return `__CODE_BLOCK_${codeBlocks.length - 1}__`; });
    text = text.replace(/`[^`]*`/g, match => { codeBlocks.push(match); return `__CODE_BLOCK_${codeBlocks.length - 1}__`; });

    // Кастомный тег: [gallery: ...]
    text = text.replace(/\[gallery:\s*(.+?)\]/g, (match, imagesStr) => {
        const images = imagesStr.split('|').map(s => s.trim());
        const id = 'gallery-' + Math.random().toString(36).substr(2, 9);
        let html = `<div class="relative w-full overflow-hidden my-6 shadow-xl group bg-slate-50 dark:bg-slate-900 rounded-xl" id="${id}"><div class="flex transition-transform duration-500 ease-out" id="${id}-track">`;
        images.forEach(img => { html += `<div class="w-full shrink-0 flex items-center justify-center"><img src="${img}" class="max-w-full max-h-[60vh] md:max-h-[75vh] w-auto m-0 pointer-events-none" style="display:block;"></div>`; });
        html += `</div>`;
        if (images.length > 1) {
            html += `<button onclick="window.moveGallery('${id}', -1)" class="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-black/60 text-white rounded-full flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-kvant z-10"><i class="fas fa-chevron-left text-sm md:text-base"></i></button>`;
            html += `<button onclick="window.moveGallery('${id}', 1)" class="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-black/60 text-white rounded-full flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-kvant z-10"><i class="fas fa-chevron-right text-sm md:text-base"></i></button>`;
            html += `<div class="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 z-10">`;
            images.forEach((_, i) => { html += `<div class="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-colors duration-300 ${i===0?'bg-white':'bg-white/40'} shadow-md" id="${id}-dot-${i}"></div>`; });
            html += `</div>`;
        }
        html += `</div>`;
        return html;
    });

    // Кастомный тег: [compare: ...]
    text = text.replace(/\[compare:\s*(.+?)\s*\|\s*(.+?)\]/g, (match, img1, img2) => {
        return `<div class="relative w-fit max-w-full mx-auto overflow-hidden my-6 shadow-xl rounded-xl select-none"><img src="${img2.trim()}" class="max-w-full max-h-[60vh] md:max-h-[75vh] w-auto block m-0 pointer-events-none" alt="После"><img src="${img1.trim()}" class="compare-before absolute top-0 left-0 w-full h-full m-0 pointer-events-none" style="clip-path: inset(0 50% 0 0);" alt="До"><input type="range" min="0" max="100" value="50" class="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20 m-0" oninput="window.updateCompare(this)"><div class="compare-handle absolute top-0 bottom-0 w-1 bg-white pointer-events-none z-10 left-1/2 -translate-x-1/2 shadow-[0_0_10px_rgba(0,0,0,0.5)]"><div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-800 shadow-md"><i class="fas fa-arrows-alt-h text-sm"></i></div></div></div>`;
    });

    // Кастомный тег: [video: ...]
    text = text.replace(/\[video:\s*(.+?)\]/g, (match, url) => {
        url = url.trim();
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const id = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop();
            return `<div class="aspect-video my-6 shadow-xl rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-900 mx-auto block max-w-full"><iframe src="https://www.youtube.com/embed/${id}" class="w-full h-full" frameborder="0" allowfullscreen></iframe></div>`;
        }
        return `<video src="${url}" controls class="w-full my-6 shadow-xl rounded-2xl border border-slate-100 dark:border-slate-800 max-w-full mx-auto block"></video>`;
    });

    // Кастомный тег: [blueprint: ...]
    text = text.replace(/\[blueprint:\s*(.+?)\]/g, (match, url) => {
        url = url.trim();
        let embedUrl = url;
        if (url.includes('blueprintue.com/blueprint/')) {
            embedUrl = url.replace('/blueprint/', '/render/');
        }
        return `<div class="w-full h-[400px] md:h-[600px] max-h-[70vh] my-6 shadow-xl rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-900 mx-auto block max-w-full"><iframe src="${embedUrl}" class="w-full h-full border-none" scrolling="no" allowfullscreen></iframe></div>`;
    });

    // Возвращаем код
    codeBlocks.forEach((block, i) => { text = text.replace(`__CODE_BLOCK_${i}__`, block); });
    return text;
}

// Функции для виджетов (экспортируем в window для onclick в HTML)
window.moveGallery = function(id, dir) {
    const track = document.getElementById(id + '-track');
    if (!window.galleryData[id]) window.galleryData[id] = { index: 0, count: track.children.length };
    let data = window.galleryData[id];
    data.index += dir;
    if (data.index < 0) data.index = data.count - 1;
    if (data.index >= data.count) data.index = 0;
    track.style.transform = `translateX(-${data.index * 100}%)`;
    for(let i=0; i<data.count; i++) {
        const dot = document.getElementById(id+'-dot-'+i);
        if(i === data.index) { dot.classList.replace('bg-white/40', 'bg-white'); } else { dot.classList.replace('bg-white', 'bg-white/40'); }
    }
};

window.updateCompare = function(input) {
    const val = input.value;
    const wrapper = input.parentElement;
    wrapper.querySelector('.compare-before').style.clipPath = `inset(0 ${100 - val}% 0 0)`;
    wrapper.querySelector('.compare-handle').style.left = `${val}%`;
};

export function styleSpecialQuotes(container = document.getElementById('article-content')) {
    if (!container) return;
    const quotes = container.querySelectorAll('blockquote');
    const keywords = [
        { key: 'важно:', class: 'quote-important' },
        { key: 'совет:', class: 'quote-tip' },
        { key: 'лайфхак:', class: 'quote-tip' },
        { key: 'внимание:', class: 'quote-warning' },
        { key: 'предупреждение:', class: 'quote-warning' },
        { key: 'заметка:', class: 'quote-note' },
        { key: 'информация:', class: 'quote-note' }
    ];

    quotes.forEach(q => {
        const content = q.innerHTML;
        const lowerContent = content.toLowerCase();
        
        for (const k of keywords) {
            if (lowerContent.includes(k.key)) {
                q.classList.add(k.class);
                // Просто скрываем ключевое слово
                const regex = new RegExp(`(<strong>)?${k.key}(</strong>)?`, 'i');
                q.innerHTML = q.innerHTML.replace(regex, '').trim();
                break;
            }
        }
    });
}

export function makeHeadersCollapsible(container = document.getElementById('article-content')) {
    if (!container) return;
    const headers = Array.from(container.querySelectorAll('h2, h3'));
    headers.forEach(header => {
        if (header.classList.contains('collapsible-header')) return;
        if (!header.parentNode) return;
        
        header.classList.add('collapsible-header');
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'collapsible-content';
        
        const stopTags = header.tagName === 'H2' ? ['H1', 'H2'] : ['H1', 'H2', 'H3'];
        let next = header.nextElementSibling;
        
        while (next && !stopTags.includes(next.tagName)) {
            const elementToMove = next; 
            next = next.nextElementSibling; 
            contentWrapper.appendChild(elementToMove);
        }
        
        header.parentNode.insertBefore(contentWrapper, next);
        
        header.onclick = () => { 
            header.classList.toggle('active'); 
            contentWrapper.classList.toggle('show'); 
        };
    });
}

export function addCodeFeatures(container = document.getElementById('article-content')) {
    if (!container) return;
    container.querySelectorAll('pre').forEach((pre) => {
        if (pre.querySelector('.code-header')) return;
        
        const codeBlock = pre.querySelector('code');
        if (!codeBlock) return; 
        
        let lang = "CODE";
        if (codeBlock.className) { 
            const match = codeBlock.className.match(/language-(\w+)/); 
            if (match) lang = match[1].toUpperCase(); 
        }
        
        if (typeof hljs !== 'undefined') hljs.highlightElement(codeBlock);
        
        // Создаем шапку блока кода
        const header = document.createElement('div');
        header.className = 'code-header';
        header.innerHTML = `<span>${lang}</span><button class="copy-code-btn"><i class="far fa-copy"></i> Copy</button>`;
        
        pre.insertBefore(header, codeBlock);
        
        const btn = header.querySelector('.copy-code-btn');
        btn.onclick = () => { 
            navigator.clipboard.writeText(codeBlock.innerText).then(() => { 
                btn.innerHTML = '<i class="fas fa-check text-emerald-500"></i> Done'; 
                setTimeout(() => { btn.innerHTML = '<i class="far fa-copy"></i> Copy'; }, 2000); 
            }); 
        };
    });
}

// Глобальные обработчики для кастомных тегов [compare] и [gallery]
window.updateCompare = function(slider) {
    const container = slider.parentElement;
    const handle = container.querySelector('.compare-handle');
    const beforeImage = container.querySelector('.compare-before');
    
    if (handle) handle.style.left = slider.value + '%';
    if (beforeImage) beforeImage.style.clipPath = `inset(0 ${100 - slider.value}% 0 0)`;
};

window.moveGallery = function(id, direction) {
    const track = document.getElementById(`${id}-track`);
    if (!track) return;
    
    // Получаем текущий индекс из dataset или 0
    let currentIndex = parseInt(track.dataset.currentIndex || '0', 10);
    const itemsCount = track.children.length;
    
    // Вычисляем новый индекс с зацикливанием
    currentIndex = (currentIndex + direction + itemsCount) % itemsCount;
    track.dataset.currentIndex = currentIndex.toString();
    
    // Сдвигаем трек. Ширина элемента равна 100% контейнера.
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
};

