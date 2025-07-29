const puppeteer = require('puppeteer-core');
const path = require('path');
require('dotenv').config();
const browserOptions = {
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1920,1080',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security', // Отключаем web security для проблемных сайтов
        '--disable-features=VizDisplayCompositor', // Дополнительная стабильность
        '--ignore-certificate-errors-spki-list',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
    ],
    executablePath: process.env.CHROME_BIN || (process.platform === 'win32' 
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : '/usr/bin/google-chrome'),
    timeout: 60000, // Уменьшаем timeout для более быстрого фейла
    headless: 'new',
    ignoreHTTPSErrors: true // Игнорируем HTTPS ошибки
};



(async () => {
    const searchData = {
        brand: 'belgee',
        url: 'https://belgee.ru',
        item: '.menu-models__item',
        model: 'menu-models__item-title',
        link: '.menu-models__item-btn',
        price: 'menu-models__item-price'
    };
    const browser = await puppeteer.launch(browserOptions);
    const page = await browser.newPage();
    await page.setViewport({width: 1080, height: 1024});
    try {
        await page.goto(searchData.url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });
        const items = await page.$$eval(
            searchData.item,
            (items, {brand, model, price, link}) => items.map(item => (
                {
                    id: brand,
                    model: item.querySelector(model)?.textContent || '',
                    price: item.querySelector(price)?.textContent.trim() || 0,
                    link: item.querySelector(link)?.href || '#',
                }
            )),
            searchData
        );
        console.log('items: ', items);
        
    } catch (err) {
        console.log('Ошибка получения данных: ', err);
    } finally {
        await browser.close();
    }
})();


