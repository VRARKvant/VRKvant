// Настройки путей к файлам данных
const CONFIG = { 
    tracks: 'articles/tracks.json', 
    cheats: 'articles/cheats.json', 
    portfolio: 'articles/portfolio.json' 
};

let lastPage = 'home';
let currentDir = ""; 
window.siteData = { tracks: null, cheats: null };
window.galleryData = {};

// Настройка Markdown парсера (Highlight.js)
if (typeof marked !== 'undefined' && typeof hljs !== 'undefined') {
    marked.setOptions({
        highlight: (code, lang) => hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang }).value : hljs.highlightAuto(code).value,
        langPrefix: 'hljs language-'
    });
}

// ---------------------------------------------------
// 1. РОУТИНГ (SPA НАВИГАЦИЯ)
// ---------------------------------------------------
window.addEventListener('hashchange', handleRouting);

function handleRouting() {
    const hash = window.location.hash.substring(1) || 'home';
    if (hash.startsWith('article:')) {
        const path = hash.substring(8);
        renderArticle(path);
    } else if (['home', 'tracks', 'cheats', 'projects', 'editor'].includes(hash)) {
        renderPage(hash);
    } else {
        window.location.hash = 'home';
    }
}

function renderPage(pId) {
    document.getElementById('mobile-menu').classList.add('hidden-menu'); 
    lastPage = pId; 
    
    // Переключение видимости блоков
    document.querySelectorAll('.page-content').forEach(p => { 
        p.classList.remove('active'); p.classList.add('hidden'); 
        if(p.id === pId) { p.classList.remove('hidden'); p.classList.add('active'); } 
    });
    
    // Подсветка меню
    document.querySelectorAll('.nav-item').forEach(n => { 
        n.classList.toggle('text-kvant', n.id === 'nav-' + pId); 
    });
    
    if (pId === 'tracks') loadTracks(); 
    if (pId === 'cheats') loadCheats(); 
    if (pId === 'projects') loadProjectsFullPage();
    window.scrollTo(0, 0);
}

function goBackSafe() {
    if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
        window.history.back();
    } else {
        window.location.hash = lastPage;
    }
}

// ---------------------------------------------------
// 2. ЗАГРУЗКА БАЗЫ ДАННЫХ В ФОНЕ
// ---------------------------------------------------
async function loadGlobalData() {
    try {
        if(!window.siteData.tracks) {
            const r1 = await fetch(CONFIG.tracks + '?t=' + new Date().getTime());
            window.siteData.tracks = (await r1.json()).tracks;
        }
        if(!window.siteData.cheats) {
            const r2 = await fetch(CONFIG.cheats + '?t=' + new Date().getTime());
            window.siteData.cheats = (await r2.json()).cheats;
        }
    } catch(e) { 
        console.error("Ошибка загрузки манифестов", e); 
    }
}

// ---------------------------------------------------
// 3. ОБРАБОТКА СТАТЬИ И КАСТОМНЫХ ТЕГОВ
// ---------------------------------------------------
function processCustomTags(text) {
    const codeBlocks = [];

    // Прячем код от магии
    text = text.replace(/```[\s\S]*?```/g, match => { codeBlocks.push(match); return `__CODE_BLOCK_${codeBlocks.length - 1}__`; });
    text = text.replace(/`[^`]*`/g, match => { codeBlocks.push(match); return `__CODE_BLOCK_${codeBlocks.length - 1}__`; });

    // Кастомный тег: [gallery: ...]
    text = text.replace(/\[gallery:\s*(.+?)\]/g, (match, imagesStr) => {
        const images = imagesStr.split('|').map(s => s.trim());
        const id = 'gallery-' + Math.random().toString(36).substr(2, 9);
        let html = `<div class="relative w-full overflow-hidden rounded-xl md:rounded-[1rem] my-6 md:my-8 shadow-lg md:shadow-xl border border-slate-200 dark:border-slate-800 group bg-slate-50 dark:bg-slate-900" id="${id}"><div class="flex transition-transform duration-500 ease-out" id="${id}-track">`;
        images.forEach(img => { html += `<div class="w-full shrink-0 flex items-center justify-center"><img src="${img}" class="max-w-full max-h-[60vh] md:max-h-[75vh] w-auto m-0 border-none rounded-none shadow-none pointer-events-none" style="display:block;"></div>`; });
        html += `</div>`;
        if (images.length > 1) {
            html += `<button onclick="moveGallery('${id}', -1)" class="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-black/60 text-white rounded-full flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-kvant z-10"><i class="fas fa-chevron-left text-sm md:text-base"></i></button>`;
            html += `<button onclick="moveGallery('${id}', 1)" class="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-black/60 text-white rounded-full flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-kvant z-10"><i class="fas fa-chevron-right text-sm md:text-base"></i></button>`;
            html += `<div class="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 z-10">`;
            images.forEach((_, i) => { html += `<div class="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-colors duration-300 ${i===0?'bg-white':'bg-white/40'} shadow-md" id="${id}-dot-${i}"></div>`; });
            html += `</div>`;
        }
        html += `</div>`;
        return html;
    });

    // Кастомный тег: [compare: ...]
    text = text.replace(/\[compare:\s*(.+?)\s*\|\s*(.+?)\]/g, (match, img1, img2) => {
        return `<div class="relative w-fit max-w-full mx-auto overflow-hidden rounded-xl md:rounded-[1rem] my-6 md:my-8 shadow-lg md:shadow-xl border border-slate-200 dark:border-slate-800 select-none"><img src="${img2.trim()}" class="max-w-full max-h-[60vh] md:max-h-[75vh] w-auto block m-0 border-none rounded-none shadow-none pointer-events-none" alt="После"><img src="${img1.trim()}" class="compare-before absolute top-0 left-0 w-full h-full object-cover m-0 border-none rounded-none shadow-none pointer-events-none" style="clip-path: inset(0 50% 0 0);" alt="До"><input type="range" min="0" max="100" value="50" class="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20 m-0" oninput="updateCompare(this)"><div class="compare-handle absolute top-0 bottom-0 w-1 bg-white pointer-events-none z-10 left-1/2 -translate-x-1/2 shadow-[0_0_10px_rgba(0,0,0,0.5)]"><div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 bg-white rounded-full flex items-center justify-center text-slate-800 shadow-md"><i class="fas fa-arrows-alt-h text-[10px] md:text-sm"></i></div></div></div>`;
    });

    // Возвращаем код
    codeBlocks.forEach((block, i) => { text = text.replace(`__CODE_BLOCK_${i}__`, block); });
    return text;
}

// Функции для виджетов
function moveGallery(id, dir) {
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
}

function updateCompare(input) {
    const val = input.value;
    const wrapper = input.parentElement;
    wrapper.querySelector('.compare-before').style.clipPath = `inset(0 ${100 - val}% 0 0)`;
    wrapper.querySelector('.compare-handle').style.left = `${val}%`;
}

function styleSpecialQuotes(container = document.getElementById('article-content')) {
    if (!container) return;
    const quotes = container.querySelectorAll('blockquote');
    quotes.forEach(q => {
        const text = q.innerText.toLowerCase();
        if (text.includes('важно:')) q.classList.add('quote-important');
        else if (text.includes('совет:') || text.includes('лайфхак:')) q.classList.add('quote-tip');
        else if (text.includes('внимание:') || text.includes('предупреждение:')) q.classList.add('quote-warning');
        else if (text.includes('заметка:') || text.includes('информация:')) q.classList.add('quote-note');
    });
}

function makeHeadersCollapsible(container = document.getElementById('article-content')) {
    if (!container) return;
    const headers = Array.from(container.querySelectorAll('h2, h3'));
    headers.forEach(header => {
        // Защита: чтобы в редакторе (при каждом нажатии клавиши) не плодились дубликаты спойлеров
        if (header.classList.contains('collapsible-header')) return;
        if (!header.parentNode) return;
        
        header.classList.add('collapsible-header');
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'collapsible-content';
        
        const stopTags = header.tagName === 'H2' ? ['H1', 'H2'] : ['H1', 'H2', 'H3'];
        let next = header.nextElementSibling;
        
        // Собираем всё содержимое до следующего заголовка такого же или более высокого уровня
        while (next && !stopTags.includes(next.tagName)) {
            const elementToMove = next; 
            next = next.nextElementSibling; 
            contentWrapper.appendChild(elementToMove);
        }
        
        header.parentNode.insertBefore(contentWrapper, next);
        
        // Добавляем логику открытия/закрытия по клику на сам заголовок
        header.onclick = () => { 
            header.classList.toggle('active'); 
            contentWrapper.classList.toggle('show'); 
        };
    });
}

function addCodeFeatures(container = document.getElementById('article-content')) {
    if (!container) return;
    container.querySelectorAll('pre').forEach((pre) => {
        // Защита: не добавляем кнопку копирования дважды
        if (pre.querySelector('.copy-code-btn')) return;
        
        const codeBlock = pre.querySelector('code');
        if (!codeBlock) return; 
        
        let lang = "CODE";
        if (codeBlock.className) { 
            const match = codeBlock.className.match(/language-(\w+)/); 
            if (match) lang = match[1]; 
        }
        
        // Применяем подсветку синтаксиса
        if (typeof hljs !== 'undefined') hljs.highlightElement(codeBlock);
        
        // Создаем бейдж с языком (например, CSHARP)
        const badge = document.createElement('div'); 
        badge.className = 'lang-badge'; 
        badge.textContent = lang; 
        pre.appendChild(badge);
        
        // Создаем стильную кнопку "Копировать"
        const btn = document.createElement('button'); 
        btn.className = 'copy-code-btn'; 
        btn.innerHTML = '<i class="far fa-copy"></i> Copy';
        
        btn.onclick = () => { 
            navigator.clipboard.writeText(codeBlock.innerText).then(() => { 
                btn.innerHTML = '<i class="fas fa-check text-green-400"></i> Done'; 
                setTimeout(() => { btn.innerHTML = '<i class="far fa-copy"></i> Copy'; }, 2000); 
            }); 
        };
        pre.appendChild(btn);
    });
}

function interceptInternalLinks() {
    document.querySelectorAll('#article-content a').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.endsWith('.md') && !href.startsWith('http')) {
            link.onclick = (e) => { 
                e.preventDefault(); 
                const targetPath = href.startsWith('/') ? href.substring(1) : currentDir + href;
                window.location.hash = 'article:' + targetPath; 
            };
        }
    });
}

// Главная функция рендера статьи
async function renderArticle(path) {
    document.querySelectorAll('.page-content').forEach(p => { p.classList.remove('active'); p.classList.add('hidden'); });
    document.getElementById('article-viewer').classList.remove('hidden');
    document.getElementById('article-viewer').classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(n => { n.classList.toggle('text-kvant', n.id === 'nav-' + lastPage); });

    const area = document.getElementById('article-content');
    area.innerHTML = '<div class="flex justify-center p-12 md:p-20"><i class="fas fa-circle-notch fa-spin text-3xl md:text-4xl text-kvant"></i></div>';
    try {
        const res = await fetch(path + '?t=' + new Date().getTime());
        if (!res.ok) throw new Error(`Код ${res.status}: Файл не найден по пути "${path}"`);
        let text = await res.text();
        currentDir = path.substring(0, path.lastIndexOf('/') + 1);
        
        text = processCustomTags(text);
        area.innerHTML = marked.parse(text);
        
        makeHeadersCollapsible();
        styleSpecialQuotes(); 
        addCodeFeatures(); 
        interceptInternalLinks();

        await loadGlobalData();
        buildLeftSidebar(path);
        buildToC();
        window.scrollTo(0, 0);

    } catch(e) { 
        area.innerHTML = `
            <div class="text-center py-10 md:py-20 px-4 md:px-6 bg-slate-50 dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-red-200 dark:border-red-900/30">
                <i class="fas fa-exclamation-triangle text-4xl md:text-5xl text-red-500 mb-4 md:mb-6 drop-shadow-lg"></i>
                <h2 class="heading-font text-xl md:text-2xl text-slate-800 dark:text-white mb-2 md:mb-4">Ошибка загрузки статьи</h2>
                <p class="text-sm md:text-base text-slate-500 mb-4 md:mb-6">Сайту не удалось найти или обработать файл.</p>
                <div class="bg-red-50 dark:bg-red-950/20 p-3 md:p-4 rounded-xl border border-red-200 dark:border-red-900/50 text-left overflow-x-auto"><code class="text-xs md:text-sm font-mono text-red-600 dark:text-red-400 block whitespace-pre-wrap">${e.message}</code></div>
            </div>`; 
    }
}

// ---------------------------------------------------
// 4. ГЕНЕРАТОРЫ БОКОВЫХ МЕНЮ
// ---------------------------------------------------
function buildLeftSidebar(currentPath) {
    const container = document.getElementById('left-sidebar-content');
    if(!container) return;
    let html = '';
    
    if(window.siteData.tracks) {
        html += `<div><h4 class="font-bold text-slate-800 dark:text-white mb-2 flex items-center"><div class="w-2 h-2 bg-kvant rounded-full mr-2"></div>Треки</h4>`;
        window.siteData.tracks.forEach((t, i) => {
            const listId = `sidebar-track-list-${i}`;
            const iconId = `sidebar-track-icon-${i}`;
            html += `
            <div class="mb-1">
                <button onclick="toggleSidebarMenu('${listId}', '${iconId}')" class="w-full flex items-center justify-between text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 py-2 hover:text-kvant transition-colors group">
                    <span>${t.name}</span><i id="${iconId}" class="fas fa-chevron-down text-[10px] transition-transform duration-300 group-hover:text-kvant"></i>
                </button>
                <div id="${listId}" class="overflow-hidden transition-all duration-500 max-h-[2000px] opacity-100">
                    <ul class="space-y-2 text-sm border-l-2 border-slate-100 dark:border-slate-800 ml-1.5 pl-4 pb-2 mb-2">`;
            t.lessons.forEach(l => {
                const path = `articles/${t.id}/${l.file}`;
                const isActive = path === currentPath;
                html += `<li><button onclick="window.location.hash='article:${path}'" class="text-left w-full transition-colors ${isActive ? 'text-kvant font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}">${l.title}</button></li>`;
            });
            html += `</ul></div></div>`;
        });
        html += `</div>`;
    }

    if(window.siteData.cheats) {
        html += `<div class="mt-8">
            <button onclick="toggleSidebarMenu('sidebar-cheats-list', 'sidebar-cheats-icon')" class="w-full flex items-center justify-between text-left font-bold text-slate-800 dark:text-white mb-2 hover:text-amber-500 transition-colors group">
                <span class="flex items-center"><div class="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>Шпаргалки</span>
                <i id="sidebar-cheats-icon" class="fas fa-chevron-down text-[10px] text-slate-400 transition-transform duration-300 group-hover:text-amber-500"></i>
            </button>
            <div id="sidebar-cheats-list" class="overflow-hidden transition-all duration-500 max-h-[2000px] opacity-100">
                <ul class="space-y-2 text-sm border-l-2 border-slate-100 dark:border-slate-800 ml-1.5 pl-4 pb-2">`;
        window.siteData.cheats.forEach(c => {
            const path = `articles/cheats/${c.file}`;
            const isActive = path === currentPath;
            html += `<li><button onclick="window.location.hash='article:${path}'" class="text-left w-full transition-colors ${isActive ? 'text-amber-500 font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}">${c.title}</button></li>`;
        });
        html += `</ul></div></div>`;
    }
    container.innerHTML = html;
}

function toggleSidebarMenu(listId, iconId) {
    const list = document.getElementById(listId);
    const icon = document.getElementById(iconId);
    if (!list || !icon) return;
    if (list.classList.contains('max-h-0')) {
        list.classList.remove('max-h-0', 'opacity-0'); list.classList.add('max-h-[2000px]', 'opacity-100'); icon.classList.remove('-rotate-90');
    } else {
        list.classList.add('max-h-0', 'opacity-0'); list.classList.remove('max-h-[2000px]', 'opacity-100'); icon.classList.add('-rotate-90');
    }
}

function buildToC() {
    const container = document.getElementById('right-sidebar-content');
    if(!container) return;
    container.innerHTML = '';
    
    const headers = Array.from(document.querySelectorAll('#article-content h2, #article-content h3'));
    if(headers.length === 0) { container.innerHTML = '<span class="text-slate-400 italic text-[11px]">Разделов нет</span>'; return; }

    let currentH2Group = null;

    headers.forEach((h, i) => {
        const id = 'heading-' + i; h.id = id;
        const isH3 = h.tagName === 'H3';
        
        if (!isH3) {
            const wrapper = document.createElement('div');
            wrapper.className = 'mb-2';
            
            const headerRow = document.createElement('div');
            headerRow.className = 'flex items-start justify-between group cursor-pointer';
            
            const link = document.createElement('button');
            link.className = `text-left text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-kvant py-1 flex-1 pr-2 leading-snug`;
            link.textContent = h.textContent;
            
            currentH2Group = document.createElement('div');
            currentH2Group.className = 'pl-3 border-l-2 border-slate-200 dark:border-slate-800 ml-1.5 overflow-hidden transition-all duration-300 max-h-[2000px] opacity-100';
            
            // ИСПРАВЛЕНИЕ: Сохраняем жесткую ссылку на текущую группу для этой конкретной кнопки!
            const targetGroup = currentH2Group; 
            
            const toggleBtn = document.createElement('button');
            toggleBtn.innerHTML = `<i class="fas fa-chevron-down text-xs text-slate-400 transition-transform"></i>`;
            toggleBtn.className = 'mt-0.5 w-6 h-6 shrink-0 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-0 pointer-events-none';
            
            toggleBtn.onclick = (e) => {
                e.stopPropagation();
                const icon = toggleBtn.querySelector('i');
                // Используем targetGroup вместо currentH2Group
                if (targetGroup.classList.contains('max-h-0')) {
                    targetGroup.classList.remove('max-h-0', 'opacity-0');
                    targetGroup.classList.add('max-h-[2000px]', 'opacity-100');
                    icon.classList.remove('-rotate-90');
                } else {
                    targetGroup.classList.add('max-h-0', 'opacity-0');
                    targetGroup.classList.remove('max-h-[2000px]', 'opacity-100');
                    icon.classList.add('-rotate-90');
                }
            };

            targetGroup.toggleBtn = toggleBtn;
            
            link.onclick = (e) => { 
                e.stopPropagation(); 
                scrollToHeader(h); 
            };
            
            headerRow.onclick = () => { toggleBtn.click(); };
            
            headerRow.appendChild(link);
            headerRow.appendChild(toggleBtn);
            wrapper.appendChild(headerRow);
            wrapper.appendChild(targetGroup);
            container.appendChild(wrapper);
        } else {
            const link = document.createElement('button');
            
            if (currentH2Group) {
                link.className = `block text-left w-full transition-colors text-xs font-semibold text-slate-500 hover:text-kvant py-1.5 mt-1`;
                link.textContent = h.textContent;
                link.onclick = () => scrollToHeader(h);
                
                currentH2Group.appendChild(link);
                if (currentH2Group.toggleBtn) {
                    currentH2Group.toggleBtn.classList.remove('opacity-0', 'pointer-events-none');
                }
            } else {
                link.className = `block text-left w-full transition-colors text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-kvant py-1 mt-2`;
                link.textContent = h.textContent;
                link.onclick = () => scrollToHeader(h);
                container.appendChild(link);
            }
        }
    });
}

function scrollToHeader(h) {
    const wrapper = h.closest('.collapsible-content');
    if (wrapper) {
        const parentH2 = wrapper.previousElementSibling;
        if (parentH2 && parentH2.tagName === 'H2' && !parentH2.classList.contains('active')) { parentH2.click(); }
    }
    if (!h.classList.contains('active')) { h.click(); }
    setTimeout(() => { h.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 50);
}

// ---------------------------------------------------
// 5. ЗАГРУЗКА РАЗДЕЛОВ (ТРЕКИ, ПРОЕКТЫ, ШПАРГАЛКИ)
// ---------------------------------------------------
async function loadPortfolio() {
    try {
        const res = await fetch(CONFIG.portfolio + '?t=' + new Date().getTime());
        if(!res.ok) throw new Error();
        const data = await res.json();
        
        const html = data.projects.map(p => `
            <div class="snap-center shrink-0 w-[85vw] md:w-[400px] bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-lg md:shadow-xl border border-slate-100 dark:border-slate-800 group cursor-pointer hover:-translate-y-2 transition-transform" onclick="window.location.hash='article:articles/portfolio/${p.file}'">
                <div class="h-48 md:h-60 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">${p.image ? `<img src="${p.image}" class="w-full h-full object-cover group-hover:scale-105 transition duration-700">` : `<div class="w-full h-full flex items-center justify-center text-3xl md:text-4xl opacity-20"><i class="fas fa-image"></i></div>`}<div class="absolute top-4 md:top-6 left-4 md:left-6 flex gap-2">${p.tags.map(t => `<span class="bg-black/40 backdrop-blur-md text-white text-[8px] md:text-[9px] uppercase font-black px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-white/20">${t}</span>`).join('')}</div></div>
                <div class="p-6 md:p-8"><h3 class="heading-font text-xl mb-2 md:mb-4 group-hover:text-kvant transition">${p.title}</h3><p class="text-slate-500 text-xs md:text-sm mb-4 md:mb-6 line-clamp-2">${p.description}</p><div class="flex items-center text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest"><i class="fas fa-user-circle mr-2 text-kvant"></i> ${p.authors}</div></div>
            </div>`).join('');
        
        document.getElementById('portfolio-carousel').innerHTML = html;
        document.getElementById('projects-container').innerHTML = html;
    } catch(e) { 
        document.getElementById('portfolio-carousel').innerHTML = '<div class="w-full text-center py-10 opacity-30 italic text-sm">Проекты появятся здесь в ближайшее время...</div>';
        document.getElementById('projects-container').innerHTML = '<div class="w-full text-center py-10 opacity-30 italic text-sm">Проекты появятся здесь в ближайшее время...</div>';
    }
}

async function loadTracks() {
    try {
        const res = await fetch(CONFIG.tracks + '?t=' + new Date().getTime()); 
        if(!res.ok) throw new Error();
        const data = await res.json();
        document.getElementById('tracks-container').innerHTML = data.tracks.map(t => {
            const iconHtml = (t.icon && t.icon.includes('/')) 
                ? `<img src="${t.icon}" alt="icon" class="w-6 h-6 md:w-7 md:h-7 object-contain">` 
                : `<i class="${t.icon} text-lg md:text-xl"></i>`;

            return `<div class="bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] md:rounded-[3rem] p-6 md:p-10 border border-slate-100 dark:border-slate-800"><div class="flex items-center space-x-4 md:space-x-5 mb-8 md:mb-10"><div class="w-12 h-12 md:w-14 md:h-14 ${t.colorClass} rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg">${iconHtml}</div><h3 class="heading-font text-lg md:text-xl">${t.name}</h3></div><div class="space-y-3 md:space-y-4">${t.lessons.map(l => `<div onclick="window.location.hash='article:articles/${t.id}/${l.file}'" class="p-4 md:p-5 bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl flex justify-between items-center cursor-pointer hover:ring-2 md:hover:ring-4 ring-kvant/20 transition group"><span class="font-bold text-xs md:text-sm group-hover:text-kvant transition">${l.title}</span><i class="fas fa-chevron-right text-[10px] opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition"></i></div>`).join('')}</div></div>`;
        }).join('');
    } catch(e) {}
}

async function loadProjectsFullPage() {
    if(document.getElementById('projects-container').innerHTML.trim() === '') {
        loadPortfolio();
    }
}

async function loadCheats() {
    try {
        const res = await fetch(CONFIG.cheats + '?t=' + new Date().getTime()); 
        if(!res.ok) throw new Error();
        const data = await res.json();
        document.getElementById('cheats-container').innerHTML = data.cheats.map(c => `<div onclick="window.location.hash='article:articles/cheats/${c.file}'" class="p-5 md:p-8 bg-slate-50 dark:bg-slate-900 rounded-[1.25rem] md:rounded-[2rem] border border-slate-100 dark:border-slate-800 flex justify-between items-center cursor-pointer hover:bg-kvant hover:text-white transition group"><span class="font-bold text-sm md:text-base tracking-tight italic">${c.title}</span><div class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition"><i class="fas fa-arrow-right text-xs md:text-base"></i></div></div>`).join('');
    } catch(e) {}
}

// ---------------------------------------------------
// 6. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ И ИНИЦИАЛИЗАЦИЯ
// ---------------------------------------------------
function scrollPortfolio(v) { document.getElementById('portfolio-carousel').scrollBy({ left: v, behavior: 'smooth' }); }
function toggleMobileMenu() { document.getElementById('mobile-menu').classList.toggle('hidden-menu'); }

function toggleTheme() { 
    const isDark = document.documentElement.classList.toggle('dark'); 
    localStorage.setItem('theme', isDark ? 'dark' : 'light'); 
    updateThemeIcons(isDark); 
}

function updateThemeIcons(isDark) { 
    const icon = document.getElementById('theme-icon'); 
    const iconMobile = document.getElementById('theme-icon-mobile');
    if (icon) icon.classList.replace(isDark ? 'fa-moon' : 'fa-sun', isDark ? 'fa-sun' : 'fa-moon'); 
    if (iconMobile) iconMobile.classList.replace(isDark ? 'fa-moon' : 'fa-sun', isDark ? 'fa-sun' : 'fa-moon'); 
}

window.onload = () => { 
    updateThemeIcons(document.documentElement.classList.contains('dark')); 
    loadPortfolio(); 
    loadGlobalData().then(() => {
        handleRouting(); // Вызываем роутер ТОЛЬКО после предзагрузки базы данных
    });
};

// ---------------------------------------------------
// 7. СЕКРЕТНЫЙ РЕДАКТОР СТАТЕЙ (LIVE PREVIEW)
// ---------------------------------------------------

// Слушатель секретного сочетания клавиш (Ctrl + Shift + E)
window.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyE') {
        e.preventDefault();
        window.location.hash = 'editor';
    }
});

const mdInput = document.getElementById('markdown-input');
const mdPreview = document.getElementById('editor-preview');
const mdPlaceholder = document.getElementById('editor-placeholder');

if(mdInput) {
    mdInput.addEventListener('input', updateEditorPreview);
}

function updateEditorPreview() {
    const text = mdInput.value;
    if(!text.trim()) {
        mdPreview.innerHTML = '';
        if(mdPlaceholder) mdPlaceholder.style.display = 'flex';
        return;
    }
    if(mdPlaceholder) mdPlaceholder.style.display = 'none';
    
    // Превращаем текст в HTML и применяем виджеты
    let htmlContent = marked.parse(text);
    if (typeof processCustomWidgets !== 'undefined') {
        htmlContent = processCustomWidgets(htmlContent);
    } else if (typeof processCustomTags !== 'undefined') {
        htmlContent = processCustomTags(htmlContent);
    }
    
    mdPreview.innerHTML = htmlContent;
    
    // Применяем красоту конкретно к блоку предпросмотра
    makeHeadersCollapsible(mdPreview);
    styleSpecialQuotes(mdPreview);
    addCodeFeatures(mdPreview);
}

function insertTemplate(type) {
    const start = mdInput.selectionStart;
    const end = mdInput.selectionEnd;
    const text = mdInput.value;
    let insertion = '';

    switch(type) {
        case 'h2': insertion = '\n## Новый раздел\n'; break;
        case 'h3': insertion = '\n### Подраздел\n'; break;
        case 'bold': insertion = '**Текст**'; break;
        case 'code': insertion = '\n```csharp\n// Ваш код\n```\n'; break;
        case 'quote-warn': insertion = '\n> **Внимание:** Важная информация!\n'; break;
        case 'quote-tip': insertion = '\n> **Лайфхак:** Полезный совет!\n'; break;
        case 'gallery': insertion = '\n[gallery: img/1.png | img/2.png]\n'; break;
        case 'compare': insertion = '\n[compare: img/before.png | img/after.png]\n'; break;
    }

    mdInput.value = text.substring(0, start) + insertion + text.substring(end);
    mdInput.focus();
    updateEditorPreview();
}

function copyEditorCode() {
    navigator.clipboard.writeText(mdInput.value).then(() => {
        // Меняем текст кнопки для эффекта
        const btn = event.currentTarget;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check text-green-500 mr-2"></i>Скопировано';
        setTimeout(() => btn.innerHTML = originalText, 2000);
    });
}

function downloadMarkdown() {
    if(!mdInput.value.trim()) return alert("Статья пустая!");
    const blob = new Blob([mdInput.value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'new_article.md';
    a.click();
    URL.revokeObjectURL(url);
}