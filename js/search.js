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
            threshold: 0.3, // Сделаем чуть строже, раз ищем по всему тексту
            ignoreLocation: true, // КРИТИЧЕСКИ ВАЖНО: искать по всему длинному тексту, а не только в начале!
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
        renderResults({});
    }
}

export function closeSearch() {
    const modal = document.getElementById('search-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function extractSnippet(matches) {
    if (!matches) return '';
    const contentMatch = matches.find((m) => m.key === 'content');
    if (!contentMatch || !contentMatch.indices || contentMatch.indices.length === 0) return '';

    const text = contentMatch.value;
    
    // Ищем самое длинное непрерывное совпадение (чтобы избежать одиночных букв от fuzzy-поиска)
    let bestIndex = contentMatch.indices[0];
    let maxLen = bestIndex[1] - bestIndex[0];
    for (let i = 1; i < contentMatch.indices.length; i++) {
        const [s, e] = contentMatch.indices[i];
        if (e - s > maxLen) {
            maxLen = e - s;
            bestIndex = contentMatch.indices[i];
        }
    }
    
    const [mStart, mEnd] = bestIndex;

    const contextLength = 60;
    const start = Math.max(0, mStart - contextLength);
    const end = Math.min(text.length, mEnd + contextLength + 1);

    let snippetPrefix = text.substring(start, mStart);
    let snippetMatch = text.substring(mStart, mEnd + 1);
    let snippetSuffix = text.substring(mEnd + 1, end);

    if (start > 0) snippetPrefix = '...' + snippetPrefix;
    if (end < text.length) snippetSuffix = snippetSuffix + '...';

    return (
        snippetPrefix +
        `<span class="text-kvant font-bold bg-kvant/10 px-1 rounded">` +
        snippetMatch +
        `</span>` +
        snippetSuffix
    );
}

function performSearch(query) {
    if (!query.trim() || !fuse) {
        renderResults({});
        return;
    }

    const fuseResults = fuse.search(query);
    const topResults = fuseResults.slice(0, 15); // Топ-15 для группировки

    // Группировка по категориям (трекам)
    const grouped = {};
    topResults.forEach((r) => {
        const cat = r.item.category || 'Разное';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({
            ...r.item,
            score: r.score,
            snippet: extractSnippet(r.matches)
        });
    });

    renderResults(grouped);
}

function renderResults(grouped) {
    const container = document.getElementById('search-results');
    if (!container) return;

    const categories = Object.keys(grouped);

    if (categories.length === 0) {
        const input = document.getElementById('search-input');
        const text =
            input && input.value ? 'Ничего не найдено...' : 'Начните вводить текст для поиска...';
        container.innerHTML = `<div class="text-center py-10 text-slate-400 italic text-sm">${text}</div>`;
        return;
    }

    let html = '';
    for (const cat of categories) {
        html += `
        <div class="mb-6">
            <div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 px-2">${cat}</div>
            <div class="space-y-2">
                ${grouped[cat]
                    .map(
                        (r) => `
                    <div data-path="${r.path}" class="search-result-item p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl cursor-pointer transition group border border-transparent hover:border-kvant/20">
                        <div class="flex items-start gap-4">
                            <div class="w-10 h-10 shrink-0 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-kvant shadow-sm mt-1">
                                <i class="${r.icon}"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="font-bold text-sm md:text-base truncate group-hover:text-kvant transition-colors">${r.title}</div>
                                <div class="text-[10px] uppercase font-black tracking-widest opacity-50 mb-1">${r.type}</div>
                                ${
                                    r.snippet
                                        ? `<div class="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed italic">${r.snippet}</div>`
                                        : ''
                                }
                            </div>
                            <div class="shrink-0 flex items-center h-12">
                                <i class="fas fa-arrow-right opacity-0 group-hover:opacity-100 transition text-kvant"></i>
                            </div>
                        </div>
                    </div>
                `
                    )
                    .join('')}
            </div>
        </div>
        `;
    }

    container.innerHTML = html;
}
