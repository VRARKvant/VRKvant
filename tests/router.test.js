import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from '../js/router.js';

describe('parseFrontmatter', () => {
    it('should correctly parse valid frontmatter', () => {
        const input = `---\ntitle: "Test Title"\nmodule: Intro\n---\nContent starts here`;
        const { data, content } = parseFrontmatter(input);
        
        expect(data).toEqual({
            title: 'Test Title',
            module: 'Intro'
        });
        expect(content.trim()).toBe('Content starts here');
    });

    it('should handle quoted values correctly', () => {
        const input = `---\ntitle: 'Single Quotes'\nsubtitle: "Double Quotes"\n---`;
        const { data } = parseFrontmatter(input);
        
        expect(data.title).toBe('Single Quotes');
        expect(data.subtitle).toBe('Double Quotes');
    });

    it('should return empty data and full content if no frontmatter found', () => {
        const input = 'Just plain markdown';
        const { data, content } = parseFrontmatter(input);
        
        expect(data).toEqual({});
        expect(content).toBe('Just plain markdown');
    });

    it('should handle BOM and leading spaces', () => {
        const input = `\uFEFF  ---\ntitle: BOM Test\n---\nContent`;
        const { data, content } = parseFrontmatter(input);
        
        expect(data.title).toBe('BOM Test');
        expect(content.trim()).toBe('Content');
    });

    it('should handle extra spaces in frontmatter keys and values', () => {
        const input = `---\n  key  :   value  \n---`;
        const { data } = parseFrontmatter(input);
        expect(data.key).toBe('value');
    });
});
