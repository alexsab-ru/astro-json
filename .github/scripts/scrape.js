const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function scrapePage(url, xpaths) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const data = await page.evaluate((xpaths) => {
        const results = [];

        const evaluateXPath = (xpath) => {
            const snapshot = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            let result = [];
            for (let i = 0; i < snapshot.snapshotLength; i++) {
                result.push(snapshot.snapshotItem(i));
            }
            return result;
        };

        const items = evaluateXPath(xpaths.itemXPath);

        items.forEach(item => {
            const id = item.evaluate(xpaths.idXPath, item, null, XPathResult.STRING_TYPE, null).stringValue.trim();
            const model = item.evaluate(xpaths.modelXPath, item, null, XPathResult.STRING_TYPE, null).stringValue.trim();
            const price = item.evaluate(xpaths.priceXPath, item, null, XPathResult.STRING_TYPE, null).stringValue.trim();
            const link = item.evaluate(xpaths.linkXPath, item, null, XPathResult.STRING_TYPE, null).stringValue.trim();

            results.push({
                ID: id,
                Модель: model,
                Цена: price,
                Ссылка: link
            });
        });

        return results;
    }, xpaths);

    await browser.close();
    return data;
}

async function saveJson(data, filePath) {
    try {
        const directory = path.dirname(filePath);
        await fs.mkdir(directory, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Данные успешно сохранены в файл: ${filePath}`);
    } catch (error) {
        console.error(`Ошибка сохранения файла: ${error}`);
    }
}

// Пример вызова функции
(async () => {
    const url = process.env.URL;  // URL передается через переменные окружения
    const xpaths = {
        itemXPath: process.env.ITEM_XPATH,
        idXPath: process.env.ID_XPATH,
        modelXPath: process.env.MODEL_XPATH,
        priceXPath: process.env.PRICE_XPATH,
        linkXPath: process.env.LINK_XPATH,
    };

    const data = await scrapePage(url, xpaths);
    
    const outputFilePath = process.env.OUTPUT_PATH || './output/data.json';
    await saveJson(data, outputFilePath);
})();
