import { describe, it, expect } from 'vitest';
import { processCustomTags } from '../js/markdown.js';

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
