let fuse = null;
let searchIndex = [];

export async function initSearch() {
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

    // Обработка клика по кнопкам открытия/закрытия
    const btnOpen = document.getElementById('btn-open-search');
    const btnOpenMobile = document.getElementById('btn-open-search-mobile');
    const btnClose = document.getElementById('btn-close-search');

    if (btnOpen) btnOpen.addEventListener('click', openSearch);
    if (btnOpenMobile) btnOpenMobile.addEventListener('click', openSearch);
    if (btnClose) btnClose.addEventListener('click', closeSearch);

    // Делегирование кликов по результатам
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.addEventListener('click', (e) => {
            const resultItem = e.target.closest('.search-result-item');
            if (resultItem) {
                const path = resultItem.getAttribute('data-path');
                window.location.hash = path;
                closeSearch();
            }
        });
    }

    // Предзагрузка индекса
    try {
        const res = await fetch('./articles/search_index.json');
        searchIndex = await res.json();

        // Инициализация Fuse.js
        fuse = new Fuse(searchIndex, {
            keys: [
                { name: 'title', weight: 0.7 },
                { name: 'content', weight: 0.3 }
            ],
            threshold: 0.4, // Баланс между точностью и прощением опечаток
            includeMatches: true,
            minMatchCharLength: 2
        });
    } catch (e) {
        console.error('Ошибка загрузки индекса поиска:', e);
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
        document.body.style.overflow = 'hidden';
        renderResults([]);
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
    if (!query.trim() || !fuse) {
        renderResults([]);
        return;
    }

    const fuseResults = fuse.search(query);
    const results = fuseResults.map((r) => ({
        ...r.item,
        score: r.score
    }));

    renderResults(results.slice(0, 10)); // Топ-10 результатов
}

function renderResults(results) {
    const container = document.getElementById('search-results');
    if (!container) return;

    if (results.length === 0) {
        const input = document.getElementById('search-input');
        const text =
            input && input.value ? 'Ничего не найдено...' : 'Начните вводить текст для поиска...';
        container.innerHTML = `<div class="text-center py-10 text-slate-400 italic text-sm">${text}</div>`;
        return;
    }

    container.innerHTML = results
        .map(
            (r) => `
        <div data-path="${r.path}" class="search-result-item p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-kvant hover:text-white rounded-2xl cursor-pointer transition group flex items-center justify-between">
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
    `
        )
        .join('');
}
