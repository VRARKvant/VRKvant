import { loadPortfolio, loadTracks, loadCheats } from './api.js';
import { isLessonRead, getTrackProgress } from './progress.js';
import { store } from './store.js';

export function updateThemeIcons(isDark) { 
    const icon = document.getElementById('theme-icon'); 
    const iconMobile = document.getElementById('theme-icon-mobile');
    if (icon) icon.classList.replace(isDark ? 'fa-moon' : 'fa-sun', isDark ? 'fa-sun' : 'fa-moon'); 
    if (iconMobile) iconMobile.classList.replace(isDark ? 'fa-moon' : 'fa-sun', isDark ? 'fa-sun' : 'fa-moon'); 
    
    // Смена темы Highlight.js
    const hljsTheme = document.getElementById('hljs-theme');
    if (hljsTheme) {
        hljsTheme.href = isDark 
            ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css'
            : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
    }
}

export function toggleTheme() { 
    const isDark = document.documentElement.classList.toggle('dark'); 
    localStorage.setItem('theme', isDark ? 'dark' : 'light'); 
    updateThemeIcons(isDark); 
}

export function toggleMobileMenu() { 
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('hidden-menu'); 
}

export function scrollPortfolio(v) { 
    const el = document.getElementById('portfolio-carousel');
    if (el) el.scrollBy({ left: v, behavior: 'smooth' }); 
}

export function groupLessonsByModule(lessons) {
    if (!lessons || !Array.isArray(lessons)) return {};
    return lessons.reduce((acc, lesson) => {
        const moduleName = lesson.module || 'Разное';
        if (!acc[moduleName]) acc[moduleName] = [];
        acc[moduleName].push(lesson);
        return acc;
    }, {});
}

export async function renderPortfolio() {
    const projects = await loadPortfolio();
    const containerCarousel = document.getElementById('portfolio-carousel');
    const containerGrid = document.getElementById('projects-container');
    
    if (!projects || projects.length === 0) {
        const emptyHtml = '<div class="w-full text-center py-10 opacity-30 italic text-sm">Проекты появятся здесь в ближайшее время...</div>';
        if (containerCarousel) containerCarousel.innerHTML = emptyHtml;
        if (containerGrid) containerGrid.innerHTML = emptyHtml;
        return;
    }

    const html = projects.map(p => `
        <div data-path="article:articles/portfolio/${p.file}" class="card-link snap-center shrink-0 w-[85vw] md:w-[400px] bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-lg md:shadow-xl border border-slate-100 dark:border-slate-800 group cursor-pointer hover:-translate-y-2 transition-transform">
            <div class="h-48 md:h-60 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">${p.image ? `<img src="${p.image}" class="w-full h-full object-cover group-hover:scale-105 transition duration-700">` : `<div class="w-full h-full flex items-center justify-center text-3xl md:text-4xl opacity-20"><i class="fas fa-image"></i></div>`}<div class="absolute top-4 md:top-6 left-4 md:left-6 flex gap-2">${p.tags ? p.tags.map(t => `<span class="bg-black/40 backdrop-blur-md text-white text-[8px] md:text-[9px] uppercase font-black px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-white/20">${t}</span>`).join('') : ''}</div></div>
            <div class="p-6 md:p-8"><h3 class="heading-font text-xl mb-2 md:mb-4 group-hover:text-kvant transition">${p.title}</h3><p class="text-slate-500 text-xs md:text-sm mb-4 md:mb-6 line-clamp-2">${p.description}</p><div class="flex items-center text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest"><i class="fas fa-user-circle mr-2 text-kvant"></i> ${p.authors}</div></div>
        </div>`).join('');
    
    if (containerCarousel) containerCarousel.innerHTML = html;
    if (containerGrid) containerGrid.innerHTML = html;
}

export async function renderHomeTracks() {
    const tracks = await loadTracks();
    const container = document.getElementById('home-tracks-container');
    if (!container || !tracks) return;

    // Берем первые 3 трека для главной
    container.innerHTML = tracks.slice(0, 3).map(t => {
        const iconHtml = (t.icon && t.icon.includes('/')) 
            ? `<img src="${t.icon}" alt="icon" class="w-10 h-10 md:w-12 md:h-12 mb-4 md:mb-6 group-hover:scale-110 transition-transform object-contain">` 
            : `<i class="${t.icon} text-4xl md:text-[3rem] mb-4 md:mb-6 text-indigo-500 leading-none h-10 md:h-12 flex items-center group-hover:scale-110 transition-transform"></i>`;

        const lessonsWithPaths = t.lessons.map(l => ({ ...l, trackPath: `articles/${t.id}` }));
        const progress = getTrackProgress(lessonsWithPaths);

        return `
            <div data-path="article:articles/${t.id}/intro.md" class="card-link p-6 md:p-10 bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-transparent hover:border-kvant cursor-pointer transition-all hover:-translate-y-3 hover:shadow-xl flex flex-col items-center group">
                ${iconHtml}
                <h3 class="heading-font text-lg md:text-xl mb-2 w-full text-center">${t.name}</h3>
                <div class="w-full mt-2">
                    <div class="flex justify-between items-center mb-1.5">
                        <span class="text-[9px] text-slate-400 uppercase font-black tracking-widest">Прогресс</span>
                        <span class="text-[9px] text-kvant font-black">${progress}%</span>
                    </div>
                    <div class="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div class="h-full bg-kvant transition-all duration-1000" style="width: ${progress}%"></div>
                    </div>
                </div>
            </div>`;
    }).join('');
}

export async function renderTracks() {
    const tracks = await loadTracks();
    const container = document.getElementById('tracks-container');
    if (!container || !tracks) return;

    container.innerHTML = tracks.map(t => {
        const iconHtml = (t.icon && t.icon.includes('/')) 
            ? `<img src="${t.icon}" alt="icon" class="w-10 h-10 md:w-11 md:h-11 object-contain">` 
            : `<i class="${t.icon} text-lg md:text-xl"></i>`;

        const modules = groupLessonsByModule(t.lessons);
        
        // Расчет прогресса трека
        const lessonsWithPaths = t.lessons.map(l => ({ ...l, trackPath: `articles/${t.id}` }));
        const progress = getTrackProgress(lessonsWithPaths);

        return `
            <div class="bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] md:rounded-[3rem] p-6 md:p-10 border border-slate-100 dark:border-slate-800">
                <div class="flex items-center space-x-4 md:space-x-5 mb-8 md:mb-10">
                    <div class="w-12 h-12 md:w-14 md:h-14 ${t.colorClass} rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg">${iconHtml}</div>
                    <div class="flex-1">
                        <h3 class="heading-font text-lg md:text-xl mb-1">${t.name}</h3>
                        <div class="flex items-center gap-3">
                            <div class="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div class="h-full bg-kvant transition-all duration-1000" style="width: ${progress}%"></div>
                            </div>
                            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">${progress}%</span>
                        </div>
                    </div>
                </div>
                <div class="space-y-6 md:space-y-8">
                    ${Object.entries(modules).map(([moduleName, moduleLessons]) => `
                        <div>
                            <h4 class="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-3 md:mb-4 px-1 flex items-center">
                                <span class="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mr-2"></span>
                                ${moduleName}
                            </h4>
                            <div class="space-y-2 md:space-y-3">
                                ${moduleLessons.map(l => `
                                    <div data-path="article:articles/${t.id}/${l.file}" class="card-link p-4 md:p-5 bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl flex justify-between items-center cursor-pointer hover:ring-2 md:hover:ring-4 ring-kvant/20 transition group">
                                        <span class="font-bold text-xs md:text-sm group-hover:text-kvant transition">${l.title}</span>
                                        <i class="fas fa-chevron-right text-[10px] opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition"></i>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    }).join('');
}

export async function renderCheats() {
    const cheats = await loadCheats();
    const container = document.getElementById('cheats-container');
    if (!container || !cheats) return;

    container.innerHTML = cheats.map(c => `<div data-path="article:articles/cheats/${c.file}" class="card-link p-5 md:p-8 bg-slate-50 dark:bg-slate-900 rounded-[1.25rem] md:rounded-[2rem] border border-slate-100 dark:border-slate-800 flex justify-between items-center cursor-pointer hover:bg-kvant hover:text-white transition group"><span class="font-bold text-sm md:text-base tracking-tight italic">${c.title}</span><div class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition"><i class="fas fa-arrow-right text-xs md:text-base"></i></div></div>`).join('');
}

export function buildLeftSidebar(currentPath) {
    const container = document.getElementById('left-sidebar-content');
    if(!container) return;
    let html = '';
    
    if(store.tracks) {
        html += `<div><h4 class="font-bold text-slate-800 dark:text-white mb-2 flex items-center"><div class="w-2 h-2 bg-kvant rounded-full mr-2"></div>Треки</h4>`;
        store.tracks.forEach((t, i) => {
            const listId = `sidebar-track-list-${i}`;
            const iconId = `sidebar-track-icon-${i}`;
            const modules = groupLessonsByModule(t.lessons);

            html += `
            <div class="mb-1">
                <button data-toggle="${listId}" data-icon="${iconId}" class="sidebar-toggle w-full flex items-center justify-between text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 py-2 hover:text-kvant transition-colors group">
                    <span>${t.name}</span><i id="${iconId}" class="fas fa-chevron-down text-[10px] transition-transform duration-300 group-hover:text-kvant"></i>
                </button>
                <div id="${listId}" class="overflow-hidden transition-all duration-500 max-h-[2000px] opacity-100">
                    <div class="border-l-2 border-slate-100 dark:border-slate-800 ml-1.5 pl-4 pb-2 mb-2">
                        ${Object.entries(modules).map(([moduleName, moduleLessons]) => `
                            <div class="mb-4">
                                <div class="text-[9px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600 mb-2">${moduleName}</div>
                                <ul class="space-y-2 text-sm">
                                    ${moduleLessons.map(l => {
                                        const path = `articles/${t.id}/${l.file}`;
                                        const isActive = path === currentPath;
                                        const isRead = isLessonRead(path);
                                        return `<li>
                                            <button data-path="article:${path}" class="card-link text-left w-full transition-colors flex items-center justify-between group/item ${isActive ? 'text-kvant font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}">
                                                <span class="line-clamp-1">${l.title}</span>
                                                ${isRead ? '<i class="fas fa-check-circle text-emerald-500 text-[10px] ml-2 shrink-0"></i>' : ''}
                                            </button>
                                        </li>`;
                                    }).join('')}
                                </ul>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>`;
        });
        html += `</div>`;
    }

    if(store.cheats) {
        html += `<div class="mt-8">
            <button data-toggle="sidebar-cheats-list" data-icon="sidebar-cheats-icon" class="sidebar-toggle w-full flex items-center justify-between text-left font-bold text-slate-800 dark:text-white mb-2 hover:text-amber-500 transition-colors group">
                <span class="flex items-center"><div class="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>Шпаргалки</span>
                <i id="sidebar-cheats-icon" class="fas fa-chevron-down text-[10px] text-slate-400 transition-transform duration-300 group-hover:text-amber-500"></i>
            </button>
            <div id="sidebar-cheats-list" class="overflow-hidden transition-all duration-500 max-h-[2000px] opacity-100">
                <ul class="space-y-2 text-sm border-l-2 border-slate-100 dark:border-slate-800 ml-1.5 pl-4 pb-2">`;
        store.cheats.forEach(c => {
            const path = `articles/cheats/${c.file}`;
            const isActive = path === currentPath;
            const isRead = isLessonRead(path);
            html += `<li>
                <button data-path="article:${path}" class="card-link text-left w-full transition-colors flex items-center justify-between group/item ${isActive ? 'text-amber-500 font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}">
                    <span class="line-clamp-1">${c.title}</span>
                    ${isRead ? '<i class="fas fa-check-circle text-emerald-500 text-[10px] ml-2 shrink-0"></i>' : ''}
                </button>
            </li>`;
        });
        html += `</ul></div></div>`;
    }
    container.innerHTML = html;
}

export function toggleSidebarMenu(listId, iconId) {
    const list = document.getElementById(listId);
    const icon = document.getElementById(iconId);
    if (!list || !icon) return;
    if (list.classList.contains('max-h-0')) {
        list.classList.remove('max-h-0', 'opacity-0'); list.classList.add('max-h-[2000px]', 'opacity-100'); icon.classList.remove('-rotate-90');
    } else {
        list.classList.add('max-h-0', 'opacity-0'); list.classList.remove('max-h-[2000px]', 'opacity-100'); icon.classList.add('-rotate-90');
    }
}

export function buildToC() {
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
            const targetGroup = currentH2Group; 
            const toggleBtn = document.createElement('button');
            toggleBtn.innerHTML = `<i class="fas fa-chevron-down text-xs text-slate-400 transition-transform"></i>`;
            toggleBtn.className = 'mt-0.5 w-6 h-6 shrink-0 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-0 pointer-events-none';
            toggleBtn.onclick = (e) => {
                e.stopPropagation();
                const icon = toggleBtn.querySelector('i');
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
            link.onclick = (e) => { e.stopPropagation(); scrollToHeader(h); };
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

export function initSidebarTabs() {
    const tabs = ['toc', 'links', 'graph', 'global-graph'];
    tabs.forEach(tabId => {
        const btn = document.getElementById(`tab-${tabId}`);
        if (btn) {
            btn.addEventListener('click', () => {
                // Переключение кнопок
                tabs.forEach(t => {
                    const b = document.getElementById(`tab-${t}`);
                    if (b) {
                        b.classList.remove('bg-white', 'dark:bg-slate-800', 'text-kvant', 'shadow-sm', 'active-tab');
                        b.classList.add('text-slate-400');
                    }
                });
                btn.classList.add('bg-white', 'dark:bg-slate-800', 'text-kvant', 'shadow-sm', 'active-tab');
                btn.classList.remove('text-slate-400');

                // Переключение панелей
                document.querySelectorAll('.sidebar-pane').forEach(p => p.classList.add('hidden'));
                const pane = document.getElementById(`pane-${tabId}`);
                if (pane) pane.classList.remove('hidden');
                
                if (tabId === 'graph') renderKnowledgeGraph(true);
                if (tabId === 'global-graph') renderGlobalGraph();
            });
        }
    });
}

export function buildLinksSidebar() {
    const container = document.getElementById('links-sidebar-content');
    const article = document.getElementById('article-content');
    if (!container || !article) return;

    const links = Array.from(article.querySelectorAll('a'));
    if (links.length === 0) {
        container.innerHTML = '<span class="text-slate-400 italic text-[11px]">Ссылок нет</span>';
        return;
    }

    const internalLinks = [];
    const externalLinks = [];

    links.forEach(link => {
        const href = link.getAttribute('href');
        const text = link.textContent.trim() || href;
        if (href.startsWith('http')) {
            externalLinks.push({ text, href });
        } else if (href.endsWith('.md')) {
            internalLinks.push({ text, href });
        }
    });

    let html = '';
    if (internalLinks.length > 0) {
        html += `
            <div>
                <div class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center">
                    <span class="w-1.5 h-1.5 bg-kvant rounded-full mr-2"></span> Внутренние
                </div>
                <div class="space-y-2">
                    ${internalLinks.map(l => `
                        <button data-path="article:${l.href}" class="card-link w-full text-left text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-kvant transition line-clamp-2">
                            <i class="fas fa-file-alt mr-2 opacity-40"></i> ${l.text}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    if (externalLinks.length > 0) {
        html += `
            <div class="mt-6">
                <div class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center">
                    <span class="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span> Внешние ресурсы
                </div>
                <div class="space-y-2">
                    ${externalLinks.map(l => `
                        <a href="${l.href}" target="_blank" class="block w-full text-left text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-500 transition line-clamp-2">
                            <i class="fas fa-external-link-alt mr-2 opacity-40"></i> ${l.text}
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html || '<span class="text-slate-400 italic text-[11px]">Ссылок нет</span>';
}

let currentLocalGraph = null;
let currentGlobalGraph = null;
let currentGraphPath = null;

export async function renderKnowledgeGraph(forceRedraw = false) {
    const container = document.getElementById('graph-container');
    if (!container) return;

    const hash = window.location.hash;
    const isArticle = hash.startsWith('#article:');
    const articlePath = isArticle ? hash.substring(9) : null;
    const depth = parseInt(document.getElementById('graph-depth')?.value || 1);

    if (!forceRedraw && currentLocalGraph && currentGraphPath === articlePath && container.querySelector('canvas')) return;

    container.innerHTML = '<div class="flex flex-col items-center justify-center h-full opacity-30"><i class="fas fa-circle-notch fa-spin text-xl mb-2"></i><span class="text-[9px] uppercase font-bold tracking-widest">Загрузка...</span></div>';

    try {
        const res = await fetch('./articles/graph.json');
        if (!res.ok) throw new Error('Failed to fetch graph.json');
        const fullData = await res.json();
        container.innerHTML = ''; 
        currentGraphPath = articlePath;

        let displayData = fullData;
        if (articlePath) {
            const startNode = fullData.nodes.find(n => n.path === articlePath);
            if (startNode) {
                const visibleNodeIds = new Set([startNode.id]);
                let currentLevelIds = new Set([startNode.id]);

                for (let i = 0; i < depth; i++) {
                    const nextLevelIds = new Set();
                    fullData.links.forEach(link => {
                        const s = typeof link.source === 'object' ? link.source.id : link.source;
                        const t = typeof link.target === 'object' ? link.target.id : link.target;
                        if (currentLevelIds.has(s)) { visibleNodeIds.add(t); nextLevelIds.add(t); }
                        if (currentLevelIds.has(t)) { visibleNodeIds.add(s); nextLevelIds.add(s); }
                    });
                    currentLevelIds = nextLevelIds;
                }

                displayData = {
                    nodes: fullData.nodes.filter(n => visibleNodeIds.has(n.id)),
                    links: fullData.links.filter(l => {
                        const s = typeof l.source === 'object' ? l.source.id : l.source;
                        const t = typeof l.target === 'object' ? l.target.id : l.target;
                        return visibleNodeIds.has(s) && visibleNodeIds.has(t);
                    })
                };
            }
        }

        currentLocalGraph = createBaseGraph(container, displayData, articlePath);
    } catch (e) { 
        console.error("Local Graph Error:", e); 
        container.innerHTML = `<div class="text-[10px] text-red-400 p-4 text-center">Ошибка графа: ${e.message}</div>`; 
    }
}

export async function renderGlobalGraph() {
    const container = document.getElementById('full-graph-container');
    if (!container) return;

    // Очищаем старый холст для корректного перерендера при изменении размеров
    container.innerHTML = '<div class="flex flex-col items-center justify-center h-full opacity-30"><i class="fas fa-circle-notch fa-spin text-xl mb-2"></i><span class="text-[9px] uppercase font-bold tracking-widest">Сборка карты...</span></div>';

    try {
        const res = await fetch('./articles/graph.json');
        if (!res.ok) throw new Error('Failed to fetch graph.json');
        const data = await res.json();
        
        // Даем браузеру время отрисовать контейнер, чтобы получить его размеры
        setTimeout(() => {
            container.innerHTML = '';
            currentGlobalGraph = createBaseGraph(container, data, null, true);
        }, 50);
    } catch (e) { 
        console.error("Global Graph Error:", e); 
        container.innerHTML = `<div class="text-[10px] text-red-400 p-4 text-center">Ошибка загрузки карты знаний: ${e.message}</div>`; 
    }
}

export function resetGlobalGraph() {
    if (currentGlobalGraph) {
        currentGlobalGraph.zoomToFit(400, 50);
    }
}

function createBaseGraph(container, data, highlightPath, isGlobal = false) {
    if (!data || !data.nodes || data.nodes.length === 0) {
        container.innerHTML = '<div class="text-[10px] text-slate-400 p-4 text-center italic">Нет данных для отображения</div>';
        return null;
    }

    const isDark = document.documentElement.classList.contains('dark');
    
    // Фирменная палитра проекта
    const colors = {
        lesson: '#8b5cf6',    // kvant violet (основной)
        cheat: '#f59e0b',     // amber (шпаргалки)
        project: '#10b981',   // emerald (проекты)
        external: '#3b82f6',  // blue (внешние)
        track: '#a855f7',     // purple (треки - чуть ярче основного)
        module: '#6366f1',    // indigo (модули)
        category: '#475569',  // slate-600 (категории)
        missing: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.4)',
        default: '#94a3b8',   // slate-400
        link: isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)', // Увеличена видимость связей
        text: isDark ? '#94a3b8' : '#64748b',
        highlight: '#8b5cf6'  // Текущая нода
    };

    const graph = ForceGraph()(container)
        .graphData(data)
        .width(container.offsetWidth || 800)
        .height(container.offsetHeight || 600)
        .nodeRelSize(isGlobal ? 3 : 4)
        .cooldownTicks(isGlobal ? 50 : 30)
        .warmupTicks(10)
        .nodeLabel(node => `<div class="bg-slate-900 text-white px-2 py-1 rounded text-[10px] border border-white/10 shadow-xl">${node.title}${node.type === 'missing' ? ' (не создана)' : ''}</div>`)
        .nodeColor(node => node.path === highlightPath ? colors.highlight : (colors[node.type] || colors.default))
        .linkColor(() => colors.link)
        .linkWidth(link => isGlobal ? 1 : 1.5) // Увеличена ширина линий
        .onNodeClick(node => {
            if (node.type === 'missing' || node.type === 'category') return;
            const targetPath = node.url || node.path;
            if (node.type === 'external') window.open(targetPath, '_blank');
            else window.location.hash = `article:${targetPath}`;
        })
        .nodeCanvasObject((node, ctx, globalScale) => {
            const isCurrent = node.path === highlightPath;
            const isGroup = ['track', 'module', 'category'].includes(node.type);
            const isMissing = node.type === 'missing';
            
            // Размер узлов
            let radius = 3.5;
            if (isCurrent) radius = 6;
            else if (node.type === 'track') radius = 7;
            else if (node.type === 'module') radius = 5;
            else if (node.type === 'category') radius = 5;
            
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
            
            // Заливка
            ctx.fillStyle = isCurrent ? colors.highlight : (colors[node.type] || colors.default);
            ctx.fill();

            // Обводка для важных узлов
            if (isCurrent || isGroup) {
                ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.2)';
                ctx.lineWidth = (isGroup ? 2 : 1.5) / globalScale;
                ctx.stroke();
                
                // Дополнительное свечение для треков
                if (node.type === 'track') {
                    ctx.shadowBlur = 15 / globalScale;
                    ctx.shadowColor = ctx.fillStyle;
                }
            } else if (isMissing) {
                ctx.strokeStyle = colors.text;
                ctx.setLineDash([2, 2]);
                ctx.lineWidth = 0.5/globalScale;
                ctx.stroke();
                ctx.setLineDash([]);
            }
            
            ctx.shadowBlur = 0; // Reset shadow

            // Текст (подписи)
            if (globalScale > (isGlobal ? 3.5 : 2) || isCurrent || isGroup) {
                const fontSize = (isGroup ? 11 : 10) / globalScale;
                ctx.font = `${isGroup ? '900' : '500'} ${fontSize}px Inter, system-ui, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                
                // Цвет текста
                if (isCurrent) ctx.fillStyle = colors.highlight;
                else if (node.type === 'track') ctx.fillStyle = isDark ? '#fff' : '#1e293b';
                else ctx.fillStyle = colors.text;

                if (isMissing) ctx.globalAlpha = 0.4;
                
                // Рисуем текст с небольшой подложкой для читаемости
                const label = node.title;
                ctx.fillText(label, node.x, node.y + radius + 2.5);
                ctx.globalAlpha = 1.0;
            }
        });

    // Повышенная стабильность и защита от "улетания"
    graph.d3AlphaDecay(0.05); // Быстрее засыпает
    graph.d3VelocityDecay(0.6); // Очень сильное гашение скорости

    if (window.d3) {
        graph.d3Force('center', d3.forceCenter(container.offsetWidth / 2, container.offsetHeight / 2));
        graph.d3Force('charge', d3.forceManyBody().strength(isGlobal ? -80 : -120).distanceMax(400));
        graph.d3Force('link', d3.forceLink().distance(isGlobal ? 40 : 60).id(d => d.id));
    }

    // Принудительное центрирование камеры в начале
    setTimeout(() => {
        graph.zoomToFit(400, 100);
    }, 100);

    graph.enableNodeDrag(true);
    graph.enableZoomInteraction(true);

    return graph;
}

export function scrollToHeader(h) {
    const wrapper = h.closest('.collapsible-content');
    if (wrapper) {
        const parentH2 = wrapper.previousElementSibling;
        if (parentH2 && parentH2.tagName === 'H2' && !parentH2.classList.contains('active')) { parentH2.click(); }
    }
    if (!h.classList.contains('active')) { h.click(); }
    setTimeout(() => { h.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 50);
}
