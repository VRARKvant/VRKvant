import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { openSearch, closeSearch, initSearch } from '../search.js';

describe('Search Module', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="search-modal" class="hidden"></div>
            <input id="search-input" />
            <div id="search-results"></div>
            <button id="btn-open-search"></button>
            <button id="btn-close-search"></button>
            <button id="btn-open-search-mobile"></button>
        `;

        // Mock window.location.hash
        delete window.location;
        window.location = { hash: '' };

        // Mock Fuse.js
        global.Fuse = vi.fn().mockImplementation(() => {
            return {
                search: vi.fn().mockReturnValue([
                    {
                        item: { 
                            title: 'Test Article', 
                            path: '/test-article', 
                            icon: 'fa-file', 
                            type: 'Урок', 
                            category: 'Unity' 
                        },
                        score: 0.1,
                        matches: [
                            {
                                key: 'content',
                                value: 'This is a snippet test string.',
                                indices: [[10, 16]]
                            }
                        ]
                    }
                ])
            };
        });

        // Mock fetch for search_index.json
        global.fetch = vi.fn().mockResolvedValue({
            json: vi.fn().mockResolvedValue([{ title: 'Test Article' }])
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should open search modal and prevent body scroll', () => {
        openSearch();
        const modal = document.getElementById('search-modal');
        expect(modal.classList.contains('hidden')).toBe(false);
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('should close search modal and restore body scroll', () => {
        openSearch(); // Open first
        closeSearch();
        const modal = document.getElementById('search-modal');
        expect(modal.classList.contains('hidden')).toBe(true);
        expect(document.body.style.overflow).toBe('');
    });

    it('should initialize search and fetch index', async () => {
        await initSearch();
        expect(global.fetch).toHaveBeenCalledWith('./articles/search_index.json');
        expect(global.Fuse).toHaveBeenCalled();
    });
});
