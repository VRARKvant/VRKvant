import { initRouter, updateEditorPreview, insertTemplate, copyEditorCode, downloadMarkdown, goBackSafe } from './router.js';
import { initSearch, openSearch, closeSearch } from './search.js';
import { initGithubAuth, publishToGitHub, uploadImage } from './github.js';
import { toggleTheme, toggleMobileMenu, scrollPortfolio, initSidebarTabs, renderHomeTracks } from './ui.js';

/**
 * Инициализация всех слушателей событий (Stage 5: Eliminate Scope Pollution)
 */
function initEvents() {
    initSidebarTabs();
    renderHomeTracks();

    // Регистрация Service Worker для PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW error:', err));
        });
    }

    // Навигация
    document.getElementById('nav-logo')?.addEventListener('click', () => window.location.hash = 'home');
    document.getElementById('nav-home')?.addEventListener('click', () => window.location.hash = 'home');
    document.getElementById('nav-tracks')?.addEventListener('click', () => window.location.hash = 'tracks');
    document.getElementById('nav-cheats')?.addEventListener('click', () => window.location.hash = 'cheats');
    document.getElementById('nav-projects')?.addEventListener('click', () => window.location.hash = 'projects');
    
    // Тема и Мобильное меню
    document.getElementById('btn-toggle-theme')?.addEventListener('click', toggleTheme);
    document.getElementById('btn-toggle-theme-mobile')?.addEventListener('click', toggleTheme);
    document.getElementById('btn-toggle-mobile-menu')?.addEventListener('click', toggleMobileMenu);
    document.getElementById('btn-close-mobile-menu')?.addEventListener('click', toggleMobileMenu);
    
    // Мобильная навигация
    document.getElementById('mobile-nav-home')?.addEventListener('click', () => { window.location.hash = 'home'; toggleMobileMenu(); });
    document.getElementById('mobile-nav-tracks')?.addEventListener('click', () => { window.location.hash = 'tracks'; toggleMobileMenu(); });
    document.getElementById('mobile-nav-cheats')?.addEventListener('click', () => { window.location.hash = 'cheats'; toggleMobileMenu(); });
    document.getElementById('mobile-nav-projects')?.addEventListener('click', () => { window.location.hash = 'projects'; toggleMobileMenu(); });

    // Поиск
    document.getElementById('btn-open-search')?.addEventListener('click', openSearch);
    document.getElementById('btn-open-search-mobile')?.addEventListener('click', openSearch);
    document.getElementById('btn-close-search')?.addEventListener('click', closeSearch);

    // Главная страница
    document.getElementById('btn-show-all-tracks')?.addEventListener('click', () => window.location.hash = 'tracks');
    document.getElementById('btn-show-all-projects')?.addEventListener('click', () => window.location.hash = 'projects');
    document.getElementById('btn-portfolio-prev')?.addEventListener('click', () => scrollPortfolio(-400));
    document.getElementById('btn-portfolio-next')?.addEventListener('click', () => scrollPortfolio(400));

    // Просмотр статьи
    document.getElementById('btn-back-from-article')?.addEventListener('click', goBackSafe);
    document.getElementById('btn-article-history-back')?.addEventListener('click', () => window.history.back());
    document.getElementById('btn-article-history-forward')?.addEventListener('click', () => window.history.forward());
    
    document.getElementById('btn-open-global-graph')?.addEventListener('click', () => {
        window.location.hash = 'graph';
    });
    
    document.getElementById('btn-close-global-graph')?.addEventListener('click', () => {
        import('./router.js').then(m => m.goBackToLastHash());
    });

    document.getElementById('btn-reset-graph')?.addEventListener('click', () => {
        import('./ui.js').then(m => m.resetGlobalGraph());
    });

    document.getElementById('btn-graph-history-back')?.addEventListener('click', () => window.history.back());
    document.getElementById('btn-graph-history-forward')?.addEventListener('click', () => window.history.forward());

    document.getElementById('graph-depth')?.addEventListener('input', (e) => {
        const val = e.target.value;
        const display = document.getElementById('graph-depth-value');
        if (display) display.textContent = val;
        import('./ui.js').then(m => m.renderKnowledgeGraph());
    });

    // Делегирование для карточек и ссылок (динамический контент)
    document.addEventListener('click', (e) => {
        const btnExport = e.target.closest('#btn-export-pdf');
        if (btnExport) {
            window.print();
        }

        const btnRead = e.target.closest('#btn-toggle-read');
        if (btnRead) {
            const path = btnRead.getAttribute('data-path');
            import('./progress.js').then(m => {
                const isRead = m.toggleLessonRead(path);
                btnRead.classList.toggle('is-read', isRead);
                btnRead.title = isRead ? 'Отметить как непрочитанное' : 'Отметить как пройденное';
                // Обновляем сайдбар, чтобы галочка появилась/исчезла
                import('./ui.js').then(ui => {
                    const currentPath = window.location.hash.startsWith('#article:') ? window.location.hash.substring(9) : '';
                    ui.buildLeftSidebar(currentPath);
                    ui.renderHomeTracks();
                });
            });
        }

        const card = e.target.closest('.card-link');
        if (card) {
            const path = card.getAttribute('data-path');
            if (path) window.location.hash = path;
        }

        const sidebarToggle = e.target.closest('.sidebar-toggle');
        if (sidebarToggle) {
            const listId = sidebarToggle.getAttribute('data-toggle');
            const iconId = sidebarToggle.getAttribute('data-icon');
            import('./ui.js').then(m => m.toggleSidebarMenu(listId, iconId));
        }
    });

    // РЕДАКТОР
    document.getElementById('btn-editor-back')?.addEventListener('click', goBackSafe);
    document.getElementById('btn-editor-home-mobile')?.addEventListener('click', () => window.location.hash = 'home');
    document.getElementById('btn-editor-copy')?.addEventListener('click', copyEditorCode);
    document.getElementById('publish-btn')?.addEventListener('click', publishToGitHub);
    
    document.getElementById('btn-preview-article')?.addEventListener('click', () => switchPreviewMode('article'));
    document.getElementById('btn-preview-card')?.addEventListener('click', () => switchPreviewMode('card'));

    // Метаданные редактора
    document.getElementById('meta-type')?.addEventListener('change', () => {
        updateMetaFields();
        updateCardPreview();
    });
    document.getElementById('meta-title')?.addEventListener('input', () => {
        autoTransliterate();
        updateCardPreview();
    });
    document.getElementById('meta-desc')?.addEventListener('input', updateCardPreview);
    document.getElementById('meta-authors')?.addEventListener('input', updateCardPreview);
    document.getElementById('meta-tags')?.addEventListener('input', updateCardPreview);
    document.getElementById('meta-image')?.addEventListener('input', updateCardPreview);
    document.getElementById('meta-icon')?.addEventListener('input', updateCardPreview);
    document.getElementById('meta-color')?.addEventListener('change', updateCardPreview);

    // Тулбар редактора
    const handleTemplate = (type) => {
        const input = document.getElementById('markdown-input');
        if (input) {
            insertTemplate(input, type);
            input.dispatchEvent(new Event('input'));
        }
    };

    document.getElementById('toolbar-h2')?.addEventListener('click', () => handleTemplate('h2'));
    document.getElementById('toolbar-h3')?.addEventListener('click', () => handleTemplate('h3'));
    document.getElementById('toolbar-bold')?.addEventListener('click', () => handleTemplate('bold'));
    document.getElementById('toolbar-code')?.addEventListener('click', () => handleTemplate('code'));
    document.getElementById('toolbar-warn')?.addEventListener('click', () => handleTemplate('quote-warn'));
    document.getElementById('toolbar-tip')?.addEventListener('click', () => handleTemplate('quote-tip'));
    document.getElementById('toolbar-compare')?.addEventListener('click', () => handleTemplate('compare'));
    document.getElementById('toolbar-gallery')?.addEventListener('click', () => handleTemplate('gallery'));
    document.getElementById('upload-img-btn')?.addEventListener('click', () => document.getElementById('image-upload-input').click());
    document.getElementById('image-upload-input')?.addEventListener('change', uploadImage);
}

function updateMetaFields() {
    const type = document.getElementById('meta-type')?.value;
    if (!type) return;
    
    document.querySelectorAll('.meta-group').forEach(el => el.classList.add('hidden'));
    
    const labelTitle = document.getElementById('label-title');

    if (type === 'lesson') {
        document.getElementById('field-track')?.classList.remove('hidden');
        document.getElementById('field-module')?.classList.remove('hidden');
        document.getElementById('field-order')?.classList.remove('hidden');
        if (labelTitle) labelTitle.innerText = "Название Урока";
    } else if (type === 'cheat') {
        document.getElementById('field-order')?.classList.remove('hidden');
        if (labelTitle) labelTitle.innerText = "Название Шпаргалки";
    } else if (type === 'project') {
        document.getElementById('field-project-desc')?.classList.remove('hidden');
        document.getElementById('field-project-authors')?.classList.remove('hidden');
        document.getElementById('field-project-tags')?.classList.remove('hidden');
        document.getElementById('field-project-image')?.classList.remove('hidden');
        if (labelTitle) labelTitle.innerText = "Название Проекта";
    } else if (type === 'intro') {
        document.getElementById('field-track-id')?.classList.remove('hidden');
        document.getElementById('field-track-icon')?.classList.remove('hidden');
        document.getElementById('field-track-color')?.classList.remove('hidden');
        if (labelTitle) labelTitle.innerText = "Имя Трека";
    }
    
    autoTransliterate();
}

export const cyrillicToLatinMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'zh', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': 'shch', 'ы': 'y', 'э': 'e', 'ю': 'yu',
    'я': 'ya', 'ь': '', 'ъ': ''
};

export function autoTransliterate() {
    const titleInput = document.getElementById('meta-title');
    const typeInput = document.getElementById('meta-type');
    if (!titleInput || !typeInput) return;

    const title = titleInput.value.toLowerCase();
    const type = typeInput.value;
    
    let result = '';
    for (let i = 0; i < title.length; i++) {
        const char = title[i];
        if (cyrillicToLatinMap[char] !== undefined) {
            result += cyrillicToLatinMap[char];
        } else if (/[a-z0-9]/.test(char)) {
            result += char;
        } else if (char === ' ' || char === '-') {
            result += '_';
        }
    }
    
    result = result.replace(/_+/g, '_').replace(/^_|_$/g, '');
    if (!result) result = 'new_article';

    const trackIdInput = document.getElementById('meta-track-id');
    const filenameInput = document.getElementById('meta-filename');

    if (type === 'intro') {
        if (trackIdInput) trackIdInput.value = result;
        if (filenameInput) filenameInput.value = 'intro';
    } else {
        if (filenameInput) filenameInput.value = result;
    }
}

function switchPreviewMode(mode) {
    const btnArticle = document.getElementById('btn-preview-article');
    const btnCard = document.getElementById('btn-preview-card');
    const previewArticle = document.getElementById('editor-preview');
    const previewCard = document.getElementById('card-preview');
    
    if (!btnArticle || !btnCard || !previewArticle || !previewCard) return;

    if (mode === 'article') {
        btnArticle.classList.add('bg-white', 'dark:bg-slate-700', 'text-kvant', 'shadow-sm');
        btnArticle.classList.remove('text-slate-500');
        
        btnCard.classList.remove('bg-white', 'dark:bg-slate-700', 'text-kvant', 'shadow-sm');
        btnCard.classList.add('text-slate-500');
        
        previewArticle.classList.remove('hidden');
        previewCard.classList.add('hidden');
        previewCard.classList.remove('flex');
    } else {
        btnCard.classList.add('bg-white', 'dark:bg-slate-700', 'text-kvant', 'shadow-sm');
        btnCard.classList.remove('text-slate-500');
        
        btnArticle.classList.remove('bg-white', 'dark:bg-slate-700', 'text-kvant', 'shadow-sm');
        btnArticle.classList.add('text-slate-500');
        
        previewArticle.classList.add('hidden');
        previewCard.classList.remove('hidden');
        previewCard.classList.add('flex');
        updateCardPreview();
    }
}

function updateCardPreview() {
    const type = document.getElementById('meta-type')?.value;
    const container = document.getElementById('card-preview-container');
    const title = document.getElementById('meta-title')?.value || 'Название';
    
    if (!container) return;

    if (type === 'project') {
        const desc = document.getElementById('meta-desc')?.value || 'Краткое описание проекта...';
        const authors = document.getElementById('meta-authors')?.value || 'Иванов И.';
        const tags = document.getElementById('meta-tags')?.value.split(',').map(t => t.trim()).filter(t => t) || [];
        const image = document.getElementById('meta-image')?.value;
        
        const tagsHtml = tags.length ? `<div class="absolute top-4 left-4 flex gap-2 flex-wrap">${tags.map(t => `<span class="bg-black/40 backdrop-blur-md text-white text-[8px] uppercase font-black px-3 py-1.5 rounded-full border border-white/20">${t}</span>`).join('')}</div>` : '';
        const imageHtml = image ? `<img src="${image}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-4xl opacity-20"><i class="fas fa-image"></i></div>`;

        container.innerHTML = `
            <div class="w-full bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100 dark:border-slate-800 pointer-events-none">
                <div class="h-48 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">${imageHtml}${tagsHtml}</div>
                <div class="p-6">
                    <h3 class="heading-font text-xl mb-2 text-slate-800 dark:text-white">${title}</h3>
                    <p class="text-slate-500 text-xs mb-4 line-clamp-2">${desc}</p>
                    <div class="flex items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <i class="fas fa-user-circle mr-2 text-kvant"></i> ${authors}
                    </div>
                </div>
            </div>
        `;
    } else if (type === 'intro') {
        const iconRaw = document.getElementById('meta-icon')?.value || 'fas fa-gamepad';
        const color = document.getElementById('meta-color')?.value || 'bg-kvant';
        const isUrl = iconRaw.includes('/');
        const iconHtml = isUrl ? `<img src="${iconRaw}" class="w-12 h-12 object-contain">` : `<i class="${iconRaw} text-[3rem]"></i>`;

        container.innerHTML = `
            <div class="p-10 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border-2 border-kvant transition-all shadow-xl flex flex-col items-center pointer-events-none w-full">
                <div class="w-16 h-16 mb-6 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg">
                    ${iconHtml}
                </div>
                <h3 class="heading-font text-xl mb-2 w-full text-center text-slate-800 dark:text-white">${title}</h3>
                <p class="text-[10px] text-slate-400 uppercase font-black tracking-widest text-center w-full">Новый Трек</p>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="text-center text-slate-400 text-xs p-10 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 w-full">
                <i class="fas fa-info-circle text-2xl mb-3 opacity-50 block"></i>
                Превью карточки доступно только для <br><b class="text-kvant">Проектов</b> и <b class="text-kvant">Новых Треков</b>.
            </div>
        `;
    }
}

// Инициализация роутера и других глобальных слушателей только если не в тестовой среде
if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
    initRouter();
    initSearch();
    initGithubAuth();
    initEvents();
}

// Слушатель секретного сочетания клавиш (Ctrl + Shift + E)
window.addEventListener("keydown", function(e) {
    if (e.ctrlKey && e.shiftKey && e.code === "KeyE") {
        e.preventDefault();
        window.location.hash = "editor";
    }
});

const mdInput = document.getElementById("markdown-input");
const mdPreview = document.getElementById("editor-preview");
const mdPlaceholder = document.getElementById("editor-placeholder");

if(mdInput && mdPreview) {
    mdInput.addEventListener("input", () => {
        updateEditorPreview(mdInput, mdPreview, mdPlaceholder);
    });
    
    // Синхронизация скролла
    mdInput.addEventListener("scroll", () => {
        const percentage = mdInput.scrollTop / (mdInput.scrollHeight - mdInput.clientHeight);
        mdPreview.scrollTop = percentage * (mdPreview.scrollHeight - mdPreview.clientHeight);
    });
}
