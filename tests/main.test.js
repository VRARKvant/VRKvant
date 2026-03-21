import { describe, it, expect, beforeEach } from 'vitest';
import { autoTransliterate } from '../js/main.js';

describe('autoTransliterate', () => {
    beforeEach(() => {
        // Очищаем DOM перед каждым тестом
        document.body.innerHTML = `
            <input id="meta-title" value="">
            <select id="meta-type">
                <option value="lesson">Урок</option>
                <option value="intro">Интро</option>
            </select>
            <input id="meta-filename" value="">
            <input id="meta-track-id" value="">
        `;
    });

    it('should transliterate cyrillic to latin correctly', () => {
        const titleInput = document.getElementById('meta-title');
        const filenameInput = document.getElementById('meta-filename');
        
        titleInput.value = 'Привет Мир';
        autoTransliterate();
        
        expect(filenameInput.value).toBe('privet_mir');
    });

    it('should handle complex cyrillic characters', () => {
        const titleInput = document.getElementById('meta-title');
        const filenameInput = document.getElementById('meta-filename');
        
        titleInput.value = 'Щелочь и Йод';
        autoTransliterate();
        
        // Согласно cyrillicToLatinMap: щ -> sch, е -> e, л -> l, о -> o, ч -> ch, и -> i, й -> y, о -> o, д -> d
        // Пробелов нет между щ и е, поэтому sch + e = sche
        expect(filenameInput.value).toBe('scheloch_i_yod');
    });

    it('should replace spaces and multiple underscores with a single underscore', () => {
        const titleInput = document.getElementById('meta-title');
        const filenameInput = document.getElementById('meta-filename');
        
        titleInput.value = 'test   title---with  spaces';
        autoTransliterate();
        
        expect(filenameInput.value).toBe('test_title_with_spaces');
    });

    it('should set meta-track-id when type is intro', () => {
        const titleInput = document.getElementById('meta-title');
        const typeInput = document.getElementById('meta-type');
        const trackIdInput = document.getElementById('meta-track-id');
        const filenameInput = document.getElementById('meta-filename');
        
        typeInput.value = 'intro';
        titleInput.value = 'Новый Трек';
        autoTransliterate();
        
        expect(trackIdInput.value).toBe('novyy_trek');
        expect(filenameInput.value).toBe('intro');
    });

    it('should use default value if result is empty', () => {
        const titleInput = document.getElementById('meta-title');
        const filenameInput = document.getElementById('meta-filename');
        
        titleInput.value = '!!!';
        autoTransliterate();
        
        expect(filenameInput.value).toBe('new_article');
    });
});
