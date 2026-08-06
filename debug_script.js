const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', (error) => console.log('BROWSER ERROR:', error.message));

    try {
        await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle' });
        console.log('Page loaded. URL:', page.url());

        const tracksBtn = page.locator('#nav-tracks');
        await tracksBtn.waitFor({ state: 'visible' });
        await tracksBtn.click();

        console.log('Clicked Tracks... URL after click:', page.url());
        await page.waitForTimeout(500);

        const card = page.locator('.card-link').first();
        console.log('Found card?', await card.count());
        if ((await card.count()) > 0) {
            console.log('Clicking first card-link');
            await card.click();
            await page.waitForTimeout(500);
            console.log('URL after card click:', page.url());
        }
    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        await browser.close();
    }
})();
