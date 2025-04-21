/* * /
export URL="https://www.geely-motors.com"
export ITEM_XPATH="//header/div[@data-id='carmodels']/div"
export ID_XPATH="substring-after(./a/@href, '/model/')"
export MODEL_XPATH="./a/span[@class='title']/text()"
export PRICE_XPATH="translate(string(./a/span[@class='subtitle']/text()), translate(string(./a/span[@class='subtitle']/text()), '0123456789', ''), '')"
export LINK_XPATH="./a/@href"
export OUTPUT_PATHS="./src/geely-partner-orenburg.ru/data/cars.json,./src/geely-partner-vostok.ru/data/cars.json"
node .github/scripts/scrape.js
/**/
const puppeteer = require('puppeteer-core');
const fs = require('fs').promises;
const path = require('path');
const brandPrefix = process.env.BRAND;
const dealerPrice = process.env.DEALERPRICE ?? "";
const dealerPriceField = process.env.DEALERPRICEFIELD ?? "";
const dealerBenefitField = process.env.DEALERBENEFITFIELD ?? "";

// Добавляем функцию логирования
async function logError(error) {
    console.error(error);
    try {
        await fs.appendFile('output.txt', `${new Date().toISOString()}: ${error}\n`);
    } catch (appendError) {
        console.error('Ошибка при записи в лог:', appendError);
    }
}

async function scrapePage(url, xpaths) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.CHROME_BIN || (process.platform === 'win32' 
            ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
            : '/usr/bin/google-chrome'),
        timeout: 120000,
        headless: 'new'
    });
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 }); // Можно поменять timeout
    } catch (error) {
        await logError(`Ошибка загрузки страницы: ${url}, ${error.message}`);
        await browser.close();
        return []; // Возвращаем пустой массив, чтобы скрипт не ломался
    }

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
                benefit: "",
                link: link
            });
        });

        return results;
    }, xpaths, url);

    await browser.close();
    return data;
}

async function readJsonFile(filePath) {
    try {
        // Чтение файла
        const data = await fs.readFile(filePath, 'utf8');
        
        // Парсинг JSON
        const jsonData = JSON.parse(data);
        
        // Возвращаем объект для дальнейших действий
        return jsonData;
    } catch (err) {
        // Ошибку парсинга Дилерского JSON файла не отображаем, потому что не все ДЦ используют свои цены
        console.error(`Ошибка при чтении или парсинге JSON файла: ${err.message}`);
        return false;
        // throw err; // Пробрасываем ошибку для обработки в вызывающем коде
    }
}

function cleanString(str, wordToRemove) {
    // Шаг 1: Удаляем все вхождения определённого слова (регистрозависимое удаление)
    let cleanedStr = str.replace(new RegExp(wordToRemove, 'gi'), '');

    // Шаг 2: Удаляем все символы, кроме букв и цифр (буквы и цифры из любой языковой группы)
    cleanedStr = cleanedStr.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    return cleanedStr;
}

async function saveJson(data, filePaths) {
    for (const filePath of filePaths) {
        try {
            const directory = path.dirname(filePath);
            const dealerdata = JSON.parse(JSON.stringify(data));
            if(dealerPrice) {
                const jsonData = await readJsonFile(path.join(directory, '/', dealerPrice));
                if(jsonData) {
                    dealerdata.map(car => {
                        model = cleanString(car["model"], brandPrefix);
                        if(jsonData[model] && jsonData[model][dealerPriceField] != "") {

                            car["price"] = Math.min(parseInt(car["price"]), jsonData[model][dealerPriceField]).toString();
                        }
                        if(jsonData[model] && jsonData[model][dealerBenefitField] != "") {

                            car["benefit"] = car["benefit"] != "" ? Math.max(parseInt(car["benefit"]), jsonData[model][dealerBenefitField]).toString() : jsonData[model][dealerBenefitField].toString();
                        }
                        return car;
                    });
                }
            }
            await fs.mkdir(directory, { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(dealerdata, null, 2), 'utf8');
            console.log(`Данные успешно сохранены в файл: ${filePath}`);
        } catch (error) {
            await logError(`Ошибка сохранения файла ${filePath}: ${error}`);
        }
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
    console.log(data);

    if (data.length > 0) {
        // Разделение путей сохранения по запятой и обработка их как списка
        const outputFilePaths = process.env.OUTPUT_PATHS ? process.env.OUTPUT_PATHS.split(',') : ['./output/data.json'];
        await saveJson(data, outputFilePaths);
    } else {
        console.log("Данные не были получены, файл не записывается.");
    }
})();
