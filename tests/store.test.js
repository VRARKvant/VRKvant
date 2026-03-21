import { describe, it, expect, vi } from 'vitest';
import { store, subscribe, updateState } from '../js/store.js';

describe('Store (js/store.js)', () => {
    it('should be reactive via Proxy', () => {
        const callback = vi.fn();
        subscribe(callback);
        
        store.lastPage = 'tracks';
        
        expect(store.lastPage).toBe('tracks');
        expect(callback).toHaveBeenCalledWith('lastPage', 'tracks');
    });

    it('should update multiple properties via updateState', () => {
        const callback = vi.fn();
        subscribe(callback);
        
        updateState({
            currentDir: 'test-dir',
            lastPage: 'projects'
        });
        
        expect(store.currentDir).toBe('test-dir');
        expect(store.lastPage).toBe('projects');
        expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should preserve existing values when updating', () => {
        store.lastPage = 'home';
        updateState({ currentDir: 'new-dir' });
        
        expect(store.lastPage).toBe('home');
        expect(store.currentDir).toBe('new-dir');
    });
});
