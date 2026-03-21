import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadPortfolio, loadTracks, loadCheats, CONFIG } from '../js/api.js';

describe('API Functions', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('loadPortfolio should return projects on success', async () => {
        const mockData = { projects: [{ title: 'P1' }] };
        fetch.mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        const result = await loadPortfolio();
        
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining(CONFIG.portfolio));
        expect(result).toEqual(mockData.projects);
    });

    it('loadPortfolio should return empty array on failure', async () => {
        fetch.mockResolvedValue({ ok: false });

        const result = await loadPortfolio();
        
        expect(result).toEqual([]);
    });

    it('loadTracks should return tracks on success', async () => {
        const mockData = { tracks: [{ name: 'T1' }] };
        fetch.mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        const result = await loadTracks();
        
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining(CONFIG.tracks));
        expect(result).toEqual(mockData.tracks);
    });

    it('loadCheats should return cheats on success', async () => {
        const mockData = { cheats: [{ title: 'C1' }] };
        fetch.mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        const result = await loadCheats();
        
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining(CONFIG.cheats));
        expect(result).toEqual(mockData.cheats);
    });
});
