import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderPortfolio, renderHomeTracks, renderTracks } from '../js/ui.js';
import * as api from '../js/api.js';

// Мокаем API модуль
vi.mock('../js/api.js', () => ({
    loadPortfolio: vi.fn(),
    loadTracks: vi.fn(),
    CONFIG: { portfolio: 'portfolio.json', tracks: 'tracks.json' }
}));

// Мокаем progress модуль для работы прогресса на главной
vi.mock('../js/progress.js', () => ({
    isLessonRead: vi.fn(() => false),
    getTrackProgress: vi.fn(() => 50)
}));

describe('UI Generators (js/ui.js)', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="portfolio-carousel"></div>
            <div id="projects-container"></div>
            <div id="home-tracks-container"></div>
            <div id="tracks-container"></div>
            <template id="tpl-portfolio-card">
                <div class="card-link"><div class="card-img-container"><div class="card-tags-container"></div></div><h3 class="card-title"></h3><p class="card-desc"></p><span class="card-authors"></span></div>
            </template>
            <template id="tpl-home-track-card">
                <div class="card-link"><div class="track-icon-container bg-white dark:bg-slate-900 card-icon"></div><h3 class="card-title"></h3></div>
            </template>
            <template id="tpl-track-page-card">
                <div class="wrapper">
                    <div class="track-icon-container bg-white dark:bg-slate-900 card-icon"></div>
                    <h3 class="card-title"></h3>
                    <div class="card-progress-bar"></div><span class="card-progress-txt"></span>
                    <div class="card-modules-container"></div>
                </div>
            </template>
            <template id="tpl-track-module">
                <div><span class="module-title"></span><div class="module-lessons-container"></div></div>
            </template>
            <template id="tpl-track-lesson">
                <div class="card-link"><span class="lesson-title"></span></div>
            </template>
        `;
        vi.clearAllMocks();
    });

    it('renderPortfolio should generate project cards in both containers', async () => {
        const mockProjects = [
            { title: 'Project 1', description: 'Desc 1', authors: 'Auth 1', file: 'p1.md', tags: ['VR'] },
            { title: 'Project 2', description: 'Desc 2', authors: 'Auth 2', file: 'p2.md', tags: ['AR'] }
        ];
        
        api.loadPortfolio.mockResolvedValue(mockProjects);
        
        await renderPortfolio();
        
        const carousel = document.getElementById('portfolio-carousel');
        const grid = document.getElementById('projects-container');
        
        // Проверяем наличие карточек в обоих контейнерах
        expect(carousel.querySelectorAll('.card-link').length).toBe(2);
        expect(grid.querySelectorAll('.card-link').length).toBe(2);
        
        // Проверяем контент первой карточки
        const firstCard = carousel.querySelector('.card-link');
        expect(firstCard.innerHTML).toContain('Project 1');
        expect(firstCard.innerHTML).toContain('Auth 1');
        expect(firstCard.innerHTML).toContain('VR');
        expect(firstCard.getAttribute('data-path')).toBe('article:articles/portfolio/p1.md');
    });

    it('renderPortfolio should show empty message if no projects', async () => {
        api.loadPortfolio.mockResolvedValue([]);
        
        await renderPortfolio();
        
        expect(document.getElementById('portfolio-carousel').innerHTML).toContain('Проекты появятся здесь');
    });

    it('renderHomeTracks should generate first 3 track cards and apply background logic', async () => {
        const mockTracks = [
            { id: 'unreal', name: 'Unreal', icon: 'fas fa-u', lessons: [] },
            { id: 'blender', name: 'Blender', icon: 'fas fa-b', lessons: [] },
            { id: 'unity', name: 'Unity', icon: 'fas fa-y', lessons: [] },
            { id: 'other', name: 'Other', icon: 'fas fa-o', lessons: [] }
        ];
        
        api.loadTracks.mockResolvedValue(mockTracks);
        
        await renderHomeTracks();
        
        const container = document.getElementById('home-tracks-container');
        const cards = container.querySelectorAll('.card-link');
        
        expect(cards.length).toBe(3); // Должно быть только первые три
        expect(cards[0].innerHTML).toContain('Unreal');
        
        const unrealContainer = container.querySelector('[data-path="article:articles/unreal/intro.md"] .track-icon-container');
        const blenderContainer = container.querySelector('[data-path="article:articles/blender/intro.md"] .track-icon-container');
        
        expect(unrealContainer.classList.contains('bg-white')).toBe(true);
        expect(unrealContainer.classList.contains('dark:bg-slate-900')).toBe(true);
        expect(blenderContainer.classList.contains('bg-white')).toBe(true);
        expect(blenderContainer.classList.contains('dark:bg-slate-900')).toBe(true);
    });

    it('renderTracks should generate all tracks and apply background logic', async () => {
        const mockTracks = [
            { id: 'unreal', name: 'Unreal', icon: 'fas fa-u', lessons: [] },
            { id: 'blender', name: 'Blender', icon: 'fas fa-b', lessons: [] }
        ];
        
        api.loadTracks.mockResolvedValue(mockTracks);
        
        await renderTracks();
        
        const container = document.getElementById('tracks-container');
        const iconBoxes = container.querySelectorAll('.track-icon-container.bg-white.dark\\:bg-slate-900');
        
        expect(iconBoxes.length).toBe(2);
        expect(iconBoxes[0].previousElementSibling).toBeNull(); // it's first in its parent (name is in another container) - wait, looking at HTML it's first in flex container
    });
});

