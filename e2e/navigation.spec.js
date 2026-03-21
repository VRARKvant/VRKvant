import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the home page correctly', async ({ page }) => {
    // Проверяем заголовок или какой-то уникальный элемент главной
    await expect(page).toHaveTitle(/VR\/AR Квантум — База знаний/);
    const homeSection = page.locator('#home');
    await expect(homeSection).toBeVisible();
    await expect(homeSection).toHaveClass(/active/);
  });

  test('should navigate to tracks page', async ({ page }) => {
    const navTracks = page.locator('#nav-tracks');
    await navTracks.click();
    
    // Проверяем изменение URL хэша
    await expect(page).toHaveURL(/#tracks/);
    
    // Проверяем видимость секции треков
    const tracksSection = page.locator('#tracks');
    await expect(tracksSection).toBeVisible();
    await expect(tracksSection).toHaveClass(/active/);
  });

  test('should open an article from the tracks page', async ({ page }) => {
    // Переходим на треки
    await page.goto('/#tracks');
    
    // Находим первую карточку урока
    const firstLesson = page.locator('#tracks .card-link').first();
    await expect(firstLesson).toBeVisible();
    
    // Кликаем по ней
    await firstLesson.click();
    
    // Проверяем, что открылся просмотрщик статей
    await expect(page).toHaveURL(/#article:/);
    const articleViewer = page.locator('#article-viewer');
    await expect(articleViewer).toBeVisible();
    await expect(articleViewer).toHaveClass(/active/);
    
    // Проверяем наличие заголовка статьи (h1)
    const articleTitle = page.locator('#article-content h1').first();
    await expect(articleTitle).toBeVisible();
  });
});
