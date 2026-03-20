export function initSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => performSearch(e.target.value));
    }

    // Закрытие при нажатии Escape
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSearch();
    });

    // Закрытие при клике вне модалки
    const searchModal = document.getElementById('search-modal');
    if (searchModal) {
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) closeSearch();
        });
    }
}

export function openSearch() {
    const modal = document.getElementById('search-modal');
    const input = document.getElementById('search-input');
    if (modal) {
        modal.classList.remove('hidden');
        if (input) {
            input.value = '';
            input.focus();
        }
        document.body.style.overflow = 'hidden'; // Блокируем скролл страницы
        renderResults([]); // Очищаем старые результаты
    }
}

export function closeSearch() {
    const modal = document.getElementById('search-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function performSearch(query) {
    const resultsContainer = document.getElementById('search-results');
    if (!query.trim()) {
        renderResults([]);
        return;
    }

    const q = query.toLowerCase();
    const results = [];

    // Поиск по трекам и урокам
    if (window.siteData.tracks) {
        window.siteData.tracks.forEach(track => {
            track.lessons.forEach(lesson => {
                if (lesson.title.toLowerCase().includes(q) || (lesson.module && lesson.module.toLowerCase().includes(q))) {
                    results.push({
                        title: lesson.title,
                        type: 'Урок',
                        category: track.name,
                        path: `article:articles/${track.id}/${lesson.file}`,
                        icon: 'fas fa-book-open'
                    });
                }
            });
        });
    }

    // Поиск по шпаргалкам
    if (window.siteData.cheats) {
        window.siteData.cheats.forEach(cheat => {
            if (cheat.title.toLowerCase().includes(q)) {
                results.push({
                    title: cheat.title,
                    type: 'Шпаргалка',
                    category: 'База знаний',
                    path: `article:articles/cheats/${cheat.file}`,
                    icon: 'fas fa-bolt'
                });
            }
        });
    }

    // Поиск по портфолио
    if (window.siteData.portfolio) {
        window.siteData.portfolio.forEach(project => {
            if (project.title.toLowerCase().includes(q) || project.description.toLowerCase().includes(q)) {
                results.push({
                    title: project.title,
                    type: 'Проект',
                    category: 'Портфолио',
                    path: `article:articles/portfolio/${project.file}`,
                    icon: 'fas fa-project-diagram'
                });
            }
        });
    }

    renderResults(results);
}

function renderResults(results) {
    const container = document.getElementById('search-results');
    if (!container) return;

    if (results.length === 0) {
        const input = document.getElementById('search-input');
        const text = input && input.value ? 'Ничего не найдено...' : 'Начните вводить текст для поиска...';
        container.innerHTML = `<div class="text-center py-10 text-slate-400 italic text-sm">${text}</div>`;
        return;
    }

    container.innerHTML = results.map(r => `
        <div onclick="window.location.hash='${r.path}'; closeSearch();" class="p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-kvant hover:text-white rounded-2xl cursor-pointer transition group flex items-center justify-between">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-kvant group-hover:bg-white/20 group-hover:text-white transition">
                    <i class="${r.icon}"></i>
                </div>
                <div>
                    <div class="font-bold text-sm md:text-base">${r.title}</div>
                    <div class="text-[10px] uppercase font-black tracking-widest opacity-50">${r.type} • ${r.category}</div>
                </div>
            </div>
            <i class="fas fa-arrow-right opacity-0 group-hover:opacity-100 transition mr-2"></i>
        </div>
    `).join('');
}
