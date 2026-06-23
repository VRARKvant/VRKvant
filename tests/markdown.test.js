import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { processCustomTags, styleSpecialQuotes, makeHeadersCollapsible, addCodeFeatures } from '../js/markdown.js';

describe('Markdown Parser - Custom Tags', () => {
    it('should parse [video: <url>] tag correctly', () => {
        const input = 'Here is a video: [video: https://example.com/video.mp4] Check it out.';
        const output = processCustomTags(input);
        expect(output).toContain('<video src="https://example.com/video.mp4"');
        expect(output).toContain('controls class="w-full');
    });

    it('should parse YouTube URL in [video: <url>] as iframe', () => {
        const input = '[video: https://www.youtube.com/watch?v=dQw4w9WgXcQ]';
        const output = processCustomTags(input);
        expect(output).toContain('<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"');
    });

    it('should parse [gallery: img1 | img2] tag correctly', () => {
        const input = '[gallery: img1.jpg | img2.jpg]';
        const output = processCustomTags(input);
        expect(output).toContain('<img src="img1.jpg"');
        expect(output).toContain('<img src="img2.jpg"');
        expect(output).toContain('gallery-'); // Автоматическая генерация ID
        expect(output).toContain('moveGallery'); // Кнопки переключения
    });

    it('should parse [compare: img1 | img2] tag correctly', () => {
        const input = '[compare: before.png | after.png]';
        const output = processCustomTags(input);
        expect(output).toContain('<img src="after.png"');
        expect(output).toContain('<img src="before.png" class="compare-before');
        expect(output).toContain('type="range"');
    });

    it('should parse [blueprint: <url>] tag correctly', () => {
        const input = '[blueprint: https://blueprintue.com/blueprint/xxxxxx/]';
        const output = processCustomTags(input);
        expect(output).toContain('<iframe src="https://blueprintue.com/render/xxxxxx/"');
    });

    it('should not parse tags strictly inside `code` or ```code``` blocks', () => {
        const input = 'Текст `[video: foo.mp4]` и блок ```\n[gallery: a|b]\n```';
        const output = processCustomTags(input);
        expect(output).toContain('`[video: foo.mp4]`');
        expect(output).toContain('[gallery: a|b]');
        expect(output).not.toContain('<video');
        expect(output).not.toContain('class="relative'); // Gallery wrapper
    });
});

describe('Markdown DOM Features', () => {
    let container;
    
    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'article-content';
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should style special quotes correctly', () => {
        container.innerHTML = '<blockquote>важно: это очень важно</blockquote>';
        styleSpecialQuotes(container);
        const bq = container.querySelector('blockquote');
        expect(bq.classList.contains('quote-important')).toBe(true);
        expect(bq.innerHTML).toBe('это очень важно');
    });

    it('should make headers collapsible', () => {
        container.innerHTML = `
            <h2>Header 2</h2>
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
            <h2>Next Header</h2>
        `;
        makeHeadersCollapsible(container);
        const h2 = container.querySelector('h2');
        expect(h2.classList.contains('collapsible-header')).toBe(true);
        const wrapper = h2.nextElementSibling;
        expect(wrapper.className).toBe('collapsible-content');
        expect(wrapper.innerHTML.includes('Paragraph 1')).toBe(true);
        expect(wrapper.innerHTML.includes('Paragraph 2')).toBe(true);
        
        // Проверяем клик
        h2.click();
        expect(h2.classList.contains('active')).toBe(true);
        expect(wrapper.classList.contains('show')).toBe(true);
    });

    it('should add code features to pre blocks', () => {
        container.innerHTML = '<pre><code class="language-python">print("hello")</code></pre>';
        
        // Мокаем hljs
        window.hljs = { highlightElement: () => {} };
        
        // Мокаем navigator.clipboard
        Object.assign(navigator, {
            clipboard: { writeText: () => Promise.resolve() }
        });
        
        addCodeFeatures(container);
        
        const header = container.querySelector('.code-header');
        expect(header).toBeTruthy();
        expect(header.innerHTML).toContain('PYTHON');
        
        const btn = header.querySelector('.copy-code-btn');
        expect(btn).toBeTruthy();
        
        delete window.hljs;
    });
});
