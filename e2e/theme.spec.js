import { test, expect } from '@playwright/test';

test.describe('Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should toggle theme correctly', async ({ page }) => {
    const html = page.locator('html');
    const themeBtn = page.locator('#btn-toggle-theme');
    
    // Получаем текущее состояние темы
    const isInitiallyDark = await html.evaluate(node => node.classList.contains('dark'));
    
    // Кликаем по кнопке
    await themeBtn.click();
    
    // Проверяем изменение класса
    if (isInitiallyDark) {
        await expect(html).not.toHaveClass(/dark/);
    } else {
        await expect(html).toHaveClass(/dark/);
    }
    
    // Проверяем сохранение в localStorage
    const savedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(savedTheme).toBe(isInitiallyDark ? 'light' : 'dark');
  });

  test('should persist theme across reloads', async ({ page }) => {
    // Устанавливаем темную тему принудительно через localStorage
    await page.evaluate(() => {
        localStorage.setItem('theme', 'dark');
        document.documentElement.classList.add('dark');
    });
    
    // Перезагружаем страницу
    await page.reload();
    
    // Проверяем, что класс dark на месте (в main.js/ui.js обычно есть логика восстановления при загрузке)
    // Но так как наша логика в ui.js/router.js может зависеть от DOMContentLoaded,
    // проверим через небольшое ожидание
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
