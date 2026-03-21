import { test, expect } from '@playwright/test';

test.describe('Markdown Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open editor by Ctrl+Shift+E shortcut', async ({ page }) => {
    // Нажимаем горячее сочетание клавиш
    await page.keyboard.press('Control+Shift+E');
    
    // Проверяем, что URL изменился на #editor
    await expect(page).toHaveURL(/#editor/);
    
    // Проверяем видимость секции редактора
    const editorSection = page.locator('#editor');
    await expect(editorSection).toBeVisible();
    await expect(editorSection).toHaveClass(/active/);
  });

  test('should update preview when typing in editor', async ({ page }) => {
    // Переходим в редактор напрямую
    await page.goto('/#editor');
    
    const input = page.locator('#markdown-input');
    const preview = page.locator('#editor-preview');
    
    // Вводим markdown текст
    const mdText = '# Test Heading\n**bold text**';
    await input.fill(mdText);
    
    // Проверяем, что превью содержит отрендеренный HTML
    await expect(preview.locator('h1')).toHaveText('Test Heading');
    await expect(preview.locator('strong')).toHaveText('bold text');
  });

  test('should insert templates from toolbar', async ({ page }) => {
    await page.goto('/#editor');
    
    const input = page.locator('#markdown-input');
    const toolbarH2 = page.locator('#toolbar-h2');
    
    // Кликаем по кнопке тулбара
    await toolbarH2.click();
    
    // Проверяем, что текст вставился
    const value = await input.inputValue();
    expect(value).toContain('## Новый раздел');
    
    // Проверяем, что превью обновилось (h2 появился)
    const preview = page.locator('#editor-preview');
    await expect(preview.locator('h2')).toHaveText('Новый раздел');
  });
});
