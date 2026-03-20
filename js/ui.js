import { loadPortfolio, loadTracks, loadCheats } from './api.js';

export function updateThemeIcons(isDark) { 
    const icon = document.getElementById('theme-icon'); 
    const iconMobile = document.getElementById('theme-icon-mobile');
    if (icon) icon.classList.replace(isDark ? 'fa-moon' : 'fa-sun', isDark ? 'fa-sun' : 'fa-moon'); 
    if (iconMobile) iconMobile.classList.replace(isDark ? 'fa-moon' : 'fa-sun', isDark ? 'fa-sun' : 'fa-moon'); 
}

window.toggleTheme = function() { 
    const isDark = document.documentElement.classList.toggle('dark'); 
    localStorage.setItem('theme', isDark ? 'dark' : 'light'); 
    updateThemeIcons(isDark); 
};

window.toggleMobileMenu = function() { 
    document.getElementById('mobile-menu').classList.toggle('hidden-menu'); 
};

window.scrollPortfolio = function(v) { 
    document.getElementById('portfolio-carousel').scrollBy({ left: v, behavior: 'smooth' }); 
};

function groupByModule(lessons) {
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
    
    if (projects.length === 0) {
        const emptyHtml = '<div class="w-full text-center py-10 opacity-30 italic text-sm">Проекты появятся здесь в ближайшее время...</div>';
        if (containerCarousel) containerCarousel.innerHTML = emptyHtml;
        if (containerGrid) containerGrid.innerHTML = emptyHtml;
        return;
    }

    const html = projects.map(p => `
        <div class="snap-center shrink-0 w-[85vw] md:w-[400px] bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-lg md:shadow-xl border border-slate-100 dark:border-slate-800 group cursor-pointer hover:-translate-y-2 transition-transform" onclick="window.location.hash='article:articles/portfolio/${p.file}'">
            <div class="h-48 md:h-60 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">${p.image ? `<img src="${p.image}" class="w-full h-full object-cover group-hover:scale-105 transition duration-700">` : `<div class="w-full h-full flex items-center justify-center text-3xl md:text-4xl opacity-20"><i class="fas fa-image"></i></div>`}<div class="absolute top-4 md:top-6 left-4 md:left-6 flex gap-2">${p.tags.map(t => `<span class="bg-black/40 backdrop-blur-md text-white text-[8px] md:text-[9px] uppercase font-black px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-white/20">${t}</span>`).join('')}</div></div>
            <div class="p-6 md:p-8"><h3 class="heading-font text-xl mb-2 md:mb-4 group-hover:text-kvant transition">${p.title}</h3><p class="text-slate-500 text-xs md:text-sm mb-4 md:mb-6 line-clamp-2">${p.description}</p><div class="flex items-center text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest"><i class="fas fa-user-circle mr-2 text-kvant"></i> ${p.authors}</div></div>
        </div>`).join('');
    
    if (containerCarousel) containerCarousel.innerHTML = html;
    if (containerGrid) containerGrid.innerHTML = html;
}

export async function renderTracks() {
    const tracks = await loadTracks();
    const container = document.getElementById('tracks-container');
    if (!container) return;

    container.innerHTML = tracks.map(t => {
        const iconHtml = (t.icon && t.icon.includes('/')) 
            ? `<img src="${t.icon}" alt="icon" class="w-6 h-6 md:w-7 md:h-7 object-contain">` 
            : `<i class="${t.icon} text-lg md:text-xl"></i>`;

        const modules = groupByModule(t.lessons);

        return `
            <div class="bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] md:rounded-[3rem] p-6 md:p-10 border border-slate-100 dark:border-slate-800">
                <div class="flex items-center space-x-4 md:space-x-5 mb-8 md:mb-10">
                    <div class="w-12 h-12 md:w-14 md:h-14 ${t.colorClass} rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg">${iconHtml}</div>
                    <h3 class="heading-font text-lg md:text-xl">${t.name}</h3>
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
                                    <div onclick="window.location.hash='article:articles/${t.id}/${l.file}'" class="p-4 md:p-5 bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl flex justify-between items-center cursor-pointer hover:ring-2 md:hover:ring-4 ring-kvant/20 transition group">
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
    if (!container) return;

    container.innerHTML = cheats.map(c => `<div onclick="window.location.hash='article:articles/cheats/${c.file}'" class="p-5 md:p-8 bg-slate-50 dark:bg-slate-900 rounded-[1.25rem] md:rounded-[2rem] border border-slate-100 dark:border-slate-800 flex justify-between items-center cursor-pointer hover:bg-kvant hover:text-white transition group"><span class="font-bold text-sm md:text-base tracking-tight italic">${c.title}</span><div class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition"><i class="fas fa-arrow-right text-xs md:text-base"></i></div></div>`).join('');
}

export function buildLeftSidebar(currentPath) {
    const container = document.getElementById('left-sidebar-content');
    if(!container) return;
    let html = '';
    
    if(window.siteData.tracks) {
        html += `<div><h4 class="font-bold text-slate-800 dark:text-white mb-2 flex items-center"><div class="w-2 h-2 bg-kvant rounded-full mr-2"></div>Треки</h4>`;
        window.siteData.tracks.forEach((t, i) => {
            const listId = `sidebar-track-list-${i}`;
            const iconId = `sidebar-track-icon-${i}`;
            const modules = groupByModule(t.lessons);

            html += `
            <div class="mb-1">
                <button onclick="window.toggleSidebarMenu('${listId}', '${iconId}')" class="w-full flex items-center justify-between text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 py-2 hover:text-kvant transition-colors group">
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
                                        return `<li><button onclick="window.location.hash='article:${path}'" class="text-left w-full transition-colors ${isActive ? 'text-kvant font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}">${l.title}</button></li>`;
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

    if(window.siteData.cheats) {
        html += `<div class="mt-8">
            <button onclick="window.toggleSidebarMenu('sidebar-cheats-list', 'sidebar-cheats-icon')" class="w-full flex items-center justify-between text-left font-bold text-slate-800 dark:text-white mb-2 hover:text-amber-500 transition-colors group">
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

window.toggleSidebarMenu = function(listId, iconId) {
    const list = document.getElementById(listId);
    const icon = document.getElementById(iconId);
    if (!list || !icon) return;
    if (list.classList.contains('max-h-0')) {
        list.classList.remove('max-h-0', 'opacity-0'); list.classList.add('max-h-[2000px]', 'opacity-100'); icon.classList.remove('-rotate-90');
    } else {
        list.classList.add('max-h-0', 'opacity-0'); list.classList.remove('max-h-[2000px]', 'opacity-100'); icon.classList.add('-rotate-90');
    }
};

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

function scrollToHeader(h) {
    const wrapper = h.closest('.collapsible-content');
    if (wrapper) {
        const parentH2 = wrapper.previousElementSibling;
        if (parentH2 && parentH2.tagName === 'H2' && !parentH2.classList.contains('active')) { parentH2.click(); }
    }
    if (!h.classList.contains('active')) { h.click(); }
    setTimeout(() => { h.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 50);
}

window.toggleSidebarMenu = function(listId, iconId) {
    const list = document.getElementById(listId);
    const icon = document.getElementById(iconId);
    if (!list || !icon) return;
    if (list.classList.contains('max-h-0')) {
        list.classList.remove('max-h-0', 'opacity-0'); list.classList.add('max-h-[2000px]', 'opacity-100'); icon.classList.remove('-rotate-90');
    } else {
        list.classList.add('max-h-0', 'opacity-0'); list.classList.remove('max-h-[2000px]', 'opacity-100'); icon.classList.add('-rotate-90');
    }
};

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

function scrollToHeader(h) {
    const wrapper = h.closest('.collapsible-content');
    if (wrapper) {
        const parentH2 = wrapper.previousElementSibling;
        if (parentH2 && parentH2.tagName === 'H2' && !parentH2.classList.contains('active')) { parentH2.click(); }
    }
    if (!h.classList.contains('active')) { h.click(); }
    setTimeout(() => { h.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 50);
}
