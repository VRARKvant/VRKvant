import { initRouter, goBackSafe } from './router.js';
import { initSearch, openSearch, closeSearch } from './search.js';
import { initGithubAuth } from './github.js';
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
    document.getElementById('nav-games')?.addEventListener('click', () => window.location.hash = 'games');
    
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
    document.getElementById('mobile-nav-games')?.addEventListener('click', () => { window.location.hash = 'games'; toggleMobileMenu(); });

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

        const card = e.target.closest('.card-link, .sidebar-link');
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
}

// Инициализация роутера и других глобальных слушателей только если не в тестовой среде
if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
    initRouter();
    initSearch();
    initGithubAuth();
    initEvents();
}
