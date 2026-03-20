import { renderCheats, renderPortfolio, renderTracks, buildLeftSidebar, buildToC, updateThemeIcons } from './ui.js';
import { processCustomTags, initMarkdown, styleSpecialQuotes, makeHeadersCollapsible, addCodeFeatures } from './markdown.js';
import { loadGlobalData } from './api.js';

let lastPage = 'home';
let currentDir = ""; 
window.siteData = { tracks: null, cheats: null, portfolio: null };
window.galleryData = {};

export function initRouter() {
    initMarkdown();
    window.addEventListener("hashchange", handleRouting);
    
    const initApp = () => { 
        updateThemeIcons(document.documentElement.classList.contains("dark")); 
        renderPortfolio(); 
        loadGlobalData().then(() => {
            handleRouting(); 
        });
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(initApp, 1);
    } else {
        window.addEventListener('DOMContentLoaded', initApp);
    }
}

export async function handleRouting() {
    const hash = window.location.hash.substring(1) || 'home';
    if (hash.startsWith('article:')) {
        const path = hash.substring(8);
        await renderArticle(path);
    } else if (['home', 'tracks', 'cheats', 'projects', 'editor'].includes(hash)) {
        renderPage(hash);
    } else {
        window.location.hash = 'home';
    }
}

export function renderPage(pId) {
    document.getElementById('mobile-menu').classList.add('hidden-menu'); 
    lastPage = pId; 
    
    document.querySelectorAll('.page-content').forEach(p => { 
        p.classList.remove('active'); p.classList.add('hidden'); 
        if(p.id === pId) { p.classList.remove('hidden'); p.classList.add('active'); } 
    });
    
    document.querySelectorAll('.nav-item').forEach(n => { 
        n.classList.toggle('text-kvant', n.id === 'nav-' + pId); 
    });
    
    if (pId === 'tracks') renderTracks(); 
    if (pId === 'cheats') renderCheats(); 
    if (pId === 'projects') renderPortfolio();
    window.scrollTo(0, 0);
}

export function goBackSafe() {
    if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
        window.history.back();
    } else {
        window.location.hash = lastPage;
    }
}

function parseFrontmatter(content) {
    // Улучшенное регулярное выражение для поддержки \r\n и пробелов
    const match = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+/);
    if (match) {
        const frontmatterStr = match[1];
        const data = {};
        frontmatterStr.split(/\r?\n/).forEach(line => {
            const [key, ...value] = line.split(':');
            if (key && value.length) {
                data[key.trim()] = value.join(':').trim().replace(/^["']|["']$/g, '');
            }
        });
        return { data, content: content.slice(match[0].length) };
    }
    return { data: {}, content };
}

async function renderArticle(path) {
    // Нормализация пути для GitHub Pages
    // Если путь начинается с 'articles/', убеждаемся, что он запрашивается корректно
    let targetPath = path;
    if (targetPath.startsWith('/')) targetPath = targetPath.substring(1);
    
    console.log("Запрос статьи по пути:", targetPath); 
    
    document.querySelectorAll('.page-content').forEach(p => { p.classList.remove('active'); p.classList.add('hidden'); });
    document.getElementById('article-viewer').classList.remove('hidden');
    document.getElementById('article-viewer').classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(n => { n.classList.toggle('text-kvant', n.id === 'nav-' + lastPage); });

    const area = document.getElementById('article-content');
    area.innerHTML = '<div class="flex justify-center p-12 md:p-20"><i class="fas fa-circle-notch fa-spin text-3xl md:text-4xl text-kvant"></i></div>';
    try {
        const url = targetPath + '?t=' + new Date().getTime();
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Код ${res.status}: Файл не найден по пути "${targetPath}"`);
        let text = await res.text();
        currentDir = targetPath.substring(0, targetPath.lastIndexOf('/') + 1);
        
        const { data, content } = parseFrontmatter(text);
        text = processCustomTags(content);

        // Оформление метаданных статьи в начале
        let metadataHtml = "";
        if (data.title || data.module) {
            metadataHtml = `
                <div class="mb-8 md:mb-12 border-b border-slate-100 dark:border-slate-800 pb-8 md:pb-10">
                    ${data.module ? `<div class="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-kvant mb-3 md:mb-4 flex items-center"><span class="w-1.5 h-1.5 bg-kvant rounded-full mr-2"></span>${data.module}</div>` : ''}
                    <h1 class="heading-font text-3xl md:text-5xl font-bold leading-tight !mt-0 !mb-0">${data.title || "Без названия"}</h1>
                </div>
            `;
        }

        area.innerHTML = metadataHtml + marked.parse(text);
        
        makeHeadersCollapsible();
        styleSpecialQuotes(); 
        addCodeFeatures(); 
        interceptInternalLinks();

        await loadGlobalData();
        buildLeftSidebar(targetPath);
        buildToC();
        window.scrollTo(0, 0);

    } catch(e) { 
        console.error("Ошибка в renderArticle:", e);
        area.innerHTML = `
            <div class="text-center py-10 md:py-20 px-4 md:px-6 bg-slate-50 dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-red-200 dark:border-red-900/30">
                <i class="fas fa-exclamation-triangle text-4xl md:text-5xl text-red-500 mb-4 md:mb-6 drop-shadow-lg"></i>
                <h2 class="heading-font text-xl md:text-2xl text-slate-800 dark:text-white mb-2 md:mb-4">Ошибка загрузки статьи</h2>
                <p class="text-sm md:text-base text-slate-500 mb-4 md:mb-6">Сайту не удалось найти или обработать файл.</p>
                <div class="bg-red-50 dark:bg-red-950/20 p-3 md:p-4 rounded-xl border border-red-200 dark:border-red-900/50 text-left overflow-x-auto"><code class="text-xs md:text-sm font-mono text-red-600 dark:text-red-400 block whitespace-pre-wrap">${e.message}</code></div>
                <button onclick="window.location.hash='home'" class="mt-8 bg-white dark:bg-slate-800 px-6 py-2 rounded-xl shadow-sm text-xs font-bold uppercase tracking-widest hover:scale-105 transition active:scale-95">Вернуться на главную</button>
            </div>`; 
    }
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

export function updateEditorPreview(mdInput, mdPreview, mdPlaceholder) {
    const text = mdInput.value;
    if(!text.trim()) {
        mdPreview.innerHTML = '';
        if(mdPlaceholder) mdPlaceholder.style.display = 'flex';
        return;
    }
    if(mdPlaceholder) mdPlaceholder.style.display = 'none';
    
    let htmlContent = marked.parse(text);
    if (typeof processCustomWidgets !== 'undefined') {
        htmlContent = processCustomWidgets(htmlContent);
    } else if (typeof processCustomTags !== 'undefined') {
        htmlContent = processCustomTags(htmlContent);
    }
    
    mdPreview.innerHTML = htmlContent;
    
    makeHeadersCollapsible(mdPreview);
    styleSpecialQuotes(mdPreview);
    addCodeFeatures(mdPreview);
}

export function insertTemplate(mdInput, type) {
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
    // updateEditorPreview(); // This needs access to mdPreview and mdPlaceholder, handle in main.js
}

export function copyEditorCode(mdInput, event) {
    navigator.clipboard.writeText(mdInput.value).then(() => {
        const btn = event.currentTarget;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check text-green-500 mr-2"></i>Скопировано';
        setTimeout(() => btn.innerHTML = originalText, 2000);
    });
}

export function downloadMarkdown(mdInput) {
    if(!mdInput.value.trim()) return alert("Статья пустая!");
    const blob = new Blob([mdInput.value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'new_article.md';
    a.click();
    URL.revokeObjectURL(url);
}

