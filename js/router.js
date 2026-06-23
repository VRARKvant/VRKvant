import { renderCheats, renderPortfolio, renderTracks, renderGames, renderGallery, buildLeftSidebar, buildToC, updateThemeIcons } from './ui.js';
import { processCustomTags, initMarkdown, styleSpecialQuotes, makeHeadersCollapsible, addCodeFeatures } from './markdown.js';
import { loadGlobalData } from './api.js';
import { isLessonRead } from './progress.js';
import { store } from './store.js';

let currentDir = ""; 
window.galleryData = {};

/**
 * Инициализация роутера и начальная загрузка приложения.
 */
export function initRouter() {
    initMarkdown();
    window.addEventListener("hashchange", handleRouting);
    
    const initApp = () => { 
        updateThemeIcons(document.documentElement.classList.contains("dark")); 
        renderPortfolio(); 
        renderGallery();
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

/**
 * Основная функция обработки маршрутизации на основе хэша.
 */
export async function handleRouting() {
    const hash = window.location.hash;
    if (hash !== '#graph') lastHash = hash || '#home';

    const cleanHash = hash.substring(1) || 'home';
    
    if (cleanHash.startsWith('article:')) {
        const path = cleanHash.substring(8);
        await renderArticle(path);
    } else if (['home', 'tracks', 'cheats', 'projects', 'games', 'graph'].includes(cleanHash)) {
        renderPage(cleanHash);
    } else {
        window.location.hash = 'home';
    }
}

/**
 * Переключение страниц (секций) сайта.
 * @param {string} pId - Идентификатор страницы (home, tracks, graph и т.д.)
 */
export function renderPage(pId) {
    document.getElementById('mobile-menu').classList.add('hidden-menu'); 
    if (pId !== 'graph') store.lastPage = pId;
    
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
    if (pId === 'games') renderGames();
    if (pId === 'graph') import('./ui.js').then(m => m.renderGlobalGraph());
    
    window.scrollTo(0, 0);
}

export function goBackToLastHash() {
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
        window.location.hash = store.lastPage;
    }
}

export function parseFrontmatter(content) {
    const cleanContent = content.replace(/^\uFEFF/, '').trimStart();
    const match = cleanContent.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*([\r\n]|$)/);
    
    if (match) {
        const frontmatterStr = match[1];
        const data = {};
        frontmatterStr.split(/\r?\n/).forEach(line => {
            const separatorIndex = line.indexOf(':');
            if (separatorIndex !== -1) {
                const key = line.substring(0, separatorIndex).trim();
                const value = line.substring(separatorIndex + 1).trim();
                if (key) {
                    data[key] = value.replace(/^["']|["']$/g, '');
                }
            }
        });
        return { data, content: cleanContent.slice(match[0].length) };
    }
    return { data: {}, content: cleanContent };
}

async function renderArticle(path) {
    let targetPath = path;
    if (targetPath.startsWith('/')) targetPath = targetPath.substring(1);
    if (!targetPath.startsWith('articles/')) targetPath = 'articles/' + targetPath;
    
    document.querySelectorAll('.page-content').forEach(p => { p.classList.remove('active'); p.classList.add('hidden'); });
    document.getElementById('article-viewer').classList.remove('hidden');
    document.getElementById('article-viewer').classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(n => { n.classList.toggle('text-kvant', n.id === 'nav-' + store.lastPage); });

    const area = document.getElementById('article-content');
    area.innerHTML = '<div class="flex justify-center p-12 md:p-20"><i class="fas fa-circle-notch fa-spin text-3xl md:text-4xl text-kvant"></i></div>';
    
    try {
        const res = await fetch(targetPath + '?t=' + new Date().getTime());
        if (!res.ok) throw new Error(`Ошибка ${res.status}: Не удалось загрузить статью`);
        
        let text = await res.text();
        currentDir = targetPath.substring(0, targetPath.lastIndexOf('/') + 1);
        
        const { data, content } = parseFrontmatter(text);
        text = processCustomTags(content);

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
                    <div class="absolute -top-2 -right-2 md:top-0 md:right-0 flex gap-2">
                        <button id="btn-toggle-read" data-path="${targetPath}" title="${isRead ? 'Отметить как непрочитанное' : 'Отметить как пройденное'}" class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:scale-110 transition-all shadow-sm group ${isRead ? 'is-read' : ''}">
                            <i class="fas fa-check text-slate-300 group-[.is-read]:text-emerald-500 transition-colors"></i>
                        </button>
                    </div>
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
        
        const graphPane = document.getElementById('pane-graph');
        if (graphPane && !graphPane.classList.contains('hidden')) {
            ui.renderKnowledgeGraph(true);
        }
        
        window.scrollTo(0, 0);

    } catch(e) { 
        console.error("Ошибка в renderArticle:", e);
        area.innerHTML = `<div class="text-center py-10 md:py-20 px-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-900/30">Ошибка загрузки</div>`; 
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
