import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderPortfolio, renderHomeTracks } from '../js/ui.js';
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

    it('renderHomeTracks should generate first 3 track cards with progress', async () => {
        const mockTracks = [
            { id: 't1', name: 'Track 1', icon: 'fas fa-1', colorClass: 'bg-red-500', lessons: [] },
            { id: 't2', name: 'Track 2', icon: 'fas fa-2', colorClass: 'bg-blue-500', lessons: [] },
            { id: 't3', name: 'Track 3', icon: 'fas fa-3', colorClass: 'bg-green-500', lessons: [] },
            { id: 't4', name: 'Track 4', icon: 'fas fa-4', colorClass: 'bg-yellow-500', lessons: [] }
        ];
        
        api.loadTracks.mockResolvedValue(mockTracks);
        
        await renderHomeTracks();
        
        const container = document.getElementById('home-tracks-container');
        const cards = container.querySelectorAll('.card-link');
        
        expect(cards.length).toBe(3); // Должно быть только первые три
        expect(cards[0].innerHTML).toContain('Track 1');
        expect(cards[0].innerHTML).toContain('50%'); // Из нашего мока прогресса
    });
});
