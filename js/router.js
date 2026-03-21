import { renderCheats, renderPortfolio, renderTracks, buildLeftSidebar, buildToC, updateThemeIcons } from './ui.js';
import { processCustomTags, initMarkdown, styleSpecialQuotes, makeHeadersCollapsible, addCodeFeatures } from './markdown.js';
import { loadGlobalData } from './api.js';
import { isLessonRead } from './progress.js';

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

let lastHash = 'home';

export async function handleRouting() {
    const hash = window.location.hash;
    if (hash !== '#graph') lastHash = hash || '#home';

    const cleanHash = hash.substring(1) || 'home';
    
    if (cleanHash.startsWith('article:')) {
        const path = cleanHash.substring(8);
        await renderArticle(path);
    } else if (['home', 'tracks', 'cheats', 'projects', 'editor', 'graph'].includes(cleanHash)) {
        renderPage(cleanHash);
    } else {
        window.location.hash = 'home';
    }
}

export function renderPage(pId) {
    document.getElementById('mobile-menu').classList.add('hidden-menu'); 
    
    document.querySelectorAll('.page-content').forEach(p => { 
        p.classList.remove('active'); p.classList.add('hidden'); 
    });

    const targetSection = (pId === 'graph') ? 'global-graph-view' : pId;
    const targetEl = document.getElementById(targetSection);
    if (targetEl) {
        targetEl.classList.remove('hidden');
        targetEl.classList.add('active');
    }
    
    document.querySelectorAll('.nav-item').forEach(n => { 
        n.classList.toggle('text-kvant', n.id === 'nav-' + pId); 
    });
    
    if (pId === 'tracks') renderTracks(); 
    if (pId === 'cheats') renderCheats(); 
    if (pId === 'projects') renderPortfolio();
    if (pId === 'graph') import('./ui.js').then(m => m.renderGlobalGraph());
    
    window.scrollTo(0, 0);
}

export function goBackToLastHash() {
    // Если в истории есть записи, идем назад, чтобы не создавать лишних записей хэша
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.hash = lastHash;
    }
}

export function goBackSafe() {
    if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
        window.history.back();
    } else {
        window.location.hash = lastPage;
    }
}

function parseFrontmatter(content) {
    // Удаляем BOM и лишние пробелы в начале
    const cleanContent = content.replace(/^\uFEFF/, '').trimStart();
    
    // Регулярное выражение, которое ищет блок между --- и --- в начале файла
    const match = cleanContent.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+/);
    
    if (match) {
        const frontmatterStr = match[1];
        const data = {};
        frontmatterStr.split(/\r?\n/).forEach(line => {
            const separatorIndex = line.indexOf(':');
            if (separatorIndex !== -1) {
                const key = line.substring(0, separatorIndex).trim();
                const value = line.substring(separatorIndex + 1).trim();
                data[key] = value.replace(/^["']|["']$/g, '');
            }
        });
        // Возвращаем данные и контент БЕЗ фронтматтера
        return { data, content: cleanContent.slice(match[0].length) };
    }
    
    // Если фронтматтер не найден, возвращаем весь контент как есть
    return { data: {}, content: cleanContent };
}

async function renderArticle(path) {
    // Нормализация пути для GitHub Pages
    let targetPath = path;
    if (targetPath.startsWith('/')) targetPath = targetPath.substring(1);
    
    // Гарантируем, что путь начинается с 'articles/'
    if (!targetPath.startsWith('articles/')) {
        targetPath = 'articles/' + targetPath;
    }
    
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
        if (data.title || data.module || data.authors || data.tags || data.date) {
            const tagsHtml = data.tags ? `
                <div class="flex flex-wrap gap-2 mt-4 md:mt-6">
                    ${(Array.isArray(data.tags) ? data.tags : data.tags.split(',')).map(t => `
                        <span class="text-[8px] md:text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                            #${t.trim()}
                        </span>
                    `).join('')}
                </div>
            ` : '';

            const isRead = isLessonRead(targetPath);
            const authorInfo = data.authors ? `
                <div class="flex items-center text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <i class="fas fa-user-circle mr-2 text-kvant"></i> ${data.authors}
                    ${data.date ? `<span class="mx-3 opacity-30">|</span><i class="far fa-calendar-alt mr-2 text-kvant"></i> ${data.date}` : ''}
                </div>
            ` : (data.date ? `
                <div class="flex items-center text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <i class="far fa-calendar-alt mr-2 text-kvant"></i> ${data.date}
                </div>
            ` : '');

            metadataHtml = `
                <div class="mb-8 md:mb-12 border-b border-slate-100 dark:border-slate-800 pb-8 md:pb-10 relative group/meta">
                    <button id="btn-toggle-read" data-path="${targetPath}" title="${isRead ? 'Отметить как непрочитанное' : 'Отметить как пройденное'}" class="absolute -top-2 -right-2 md:top-0 md:right-0 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:scale-110 transition-all shadow-sm group ${isRead ? 'is-read' : ''}">
                        <i class="fas fa-check text-slate-300 group-[.is-read]:text-emerald-500 transition-colors"></i>
                    </button>
                    ${data.module ? `<div class="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-kvant mb-3 md:mb-4 flex items-center"><span class="w-1.5 h-1.5 bg-kvant rounded-full mr-2"></span>${data.module}</div>` : ''}
                    <h1 class="heading-font text-3xl md:text-5xl font-bold leading-tight !mt-0 !mb-4">${data.title || "Без названия"}</h1>
                    ${authorInfo}
                    ${tagsHtml}
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
        
        const ui = await import('./ui.js');
        ui.buildToC();
        ui.buildLinksSidebar();
        
        // Принудительно обновляем локальный граф при переходе на новую статью
        // если панель графа видима или была открыта ранее
        const graphPane = document.getElementById('pane-graph');
        if (graphPane && !graphPane.classList.contains('hidden')) {
            ui.renderKnowledgeGraph(true);
        }
        
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

