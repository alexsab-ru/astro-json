/* * /
export URL="https://www.geely-motors.com"
export ITEM_XPATH="//header/div[@data-id='carmodels']/div"
export ID_XPATH="substring-after(./a/@href, '/model/')"
export MODEL_XPATH="./a/span[@class='title']/text()"
export PRICE_XPATH="translate(string(./a/span[@class='subtitle']/text()), translate(string(./a/span[@class='subtitle']/text()), '0123456789', ''), '')"
export LINK_XPATH="./a/@href"
export OUTPUT_PATH="./src/geelyorenburg.ru/data/cars.json"
node .github/scripts/scrape.js
/**/
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function scrapePage(url, xpaths) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const data = await page.evaluate((xpaths, baseUrl) => {
        const results = [];

        const evaluateXPath = (xpath, contextNode = document) => {
            const snapshot = document.evaluate(xpath, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            let result = [];
            for (let i = 0; i < snapshot.snapshotLength; i++) {
                result.push(snapshot.snapshotItem(i));
            }
            return result;
        };

        const items = evaluateXPath(xpaths.itemXPath);

        items.forEach(item => {
            const idNode = document.evaluate(xpaths.idXPath, item, null, XPathResult.STRING_TYPE, null);
            const id = idNode.stringValue.trim();
            
            const modelNode = document.evaluate(xpaths.modelXPath, item, null, XPathResult.STRING_TYPE, null);
            const model = modelNode.stringValue.trim();
            
            const priceNode = document.evaluate(xpaths.priceXPath, item, null, XPathResult.STRING_TYPE, null);
            const price = priceNode.stringValue.trim();

            let linkNode = document.evaluate(xpaths.linkXPath, item, null, XPathResult.STRING_TYPE, null);
            let link = linkNode.stringValue.trim();

            // Проверяем, является ли ссылка относительной
            if (!link.startsWith('http')) {
                link = new URL(link, baseUrl).href;  // Добавляем домен к относительной ссылке
            }

            results.push({
                id: id,
                model: model,
                price: price,
                link: link
            });
        });

        return results;
    }, xpaths, url);

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
