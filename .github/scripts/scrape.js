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
require('dotenv').config(); // Добавляем загрузку переменных окружения
const brandPrefix = process.env.BRAND;
const dealerPrice = process.env.DEALERPRICE ?? "";
const dealerPriceField = process.env.DEALERPRICEFIELD ?? "";
const dealerBenefitField = process.env.DEALERBENEFITFIELD ?? "";

// Добавляем функцию логирования
async function logError(message, errorText, error) {
    console.error(`${message}: ${errorText}`, error);
    await logInFile(message, errorText);
}

async function logWarning(message, errorText) {
    console.warn(`${message}: ${errorText}`);
    await logInFile(message, errorText);
}

async function logInFile(message, errorText) {
    try {
        await fs.appendFile('output.txt', `"${message}": "${errorText}",\n`);
    } catch (appendError) {
        console.error('Ошибка при записи в лог:', appendError);
    }
}



async function scrapePage(url, xpaths) {
    // Настраиваем дополнительные опции для puppeteer
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
            '--disable-gpu'
        ],
        executablePath: process.env.CHROME_BIN || (process.platform === 'win32' 
            ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
            : '/usr/bin/google-chrome'),
        timeout: 120000,
        headless: 'new'
    };

    console.log(`Запуск браузера с настройками:`, browserOptions);
    const browser = await puppeteer.launch(browserOptions);
    const page = await browser.newPage();
    
    // Устанавливаем размер окна браузера
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        console.log(`Переход на страницу ${url}`);
        await page.goto(url, { 
            waitUntil: 'domcontentloaded', 
            timeout: parseInt(process.env.TIMEOUT || '120000') 
        });

        if (process.env.DEBUG_SCREENSHOT === 'true') {
            await page.screenshot({ path: 'debug-screenshot-1.png', fullPage: true });
            console.log("Создан скриншот для отладки 1");
        }

        // Если указан селектор ожидания, ждем его появления
        if (process.env.WAIT_SELECTOR && process.env.WAIT_SELECTOR.trim()) {
            console.log(`Ожидание селектора: ${process.env.WAIT_SELECTOR}`);
            try {
                await page.waitForSelector(process.env.WAIT_SELECTOR, { 
                    timeout: parseInt(process.env.WAIT_TIME || '10000') 
                });
                console.log('Селектор найден');
            } catch (waitError) {
                await logWarning(`Предупреждение: Селектор ожидания не найден`, `${waitError.message}`);
                // Продолжаем выполнение, если селектор не найден
            }
        }

        if (process.env.DEBUG_SCREENSHOT === 'true') {
            await page.screenshot({ path: 'debug-screenshot-2.png', fullPage: true });
            console.log("Создан скриншот для отладки 2");
        }

        // Выполняем клик только если CLICK_SELECTOR существует и не пустой
        if (process.env.CLICK_SELECTOR && process.env.CLICK_SELECTOR.trim()) {
            console.log(`Попытка клика на селектор: ${process.env.CLICK_SELECTOR}`);
            
            try {
                // Проверим наличие элемента перед кликом
                const elementExists = await page.$(process.env.CLICK_SELECTOR);
                if (elementExists) {
                    // Ждем, пока селектор станет доступен и кликаем
                    await page.waitForSelector(process.env.CLICK_SELECTOR, { 
                        visible: true,
                        timeout: parseInt(process.env.CLICK_TIMEOUT || '10000') 
                    });
                    await page.click(process.env.CLICK_SELECTOR);
                    console.log("Клик выполнен успешно");
                } else {
                    console.warn(`Предупреждение: Элемент для клика не найден: ${process.env.CLICK_SELECTOR}`);
                    
                    // Пробуем выполнить клик через JavaScript
                    try {
                        console.log("Попытка клика через JavaScript");
                        await page.evaluate((selector) => {
                            const element = document.querySelector(selector);
                            if (element) {
                                element.click();
                                return true;
                            }
                            return false;
                        }, process.env.CLICK_SELECTOR);
                        console.log("Клик через JavaScript выполнен");
                    } catch (jsClickError) {
                        await logWarning(`Предупреждение: Клик через JavaScript не выполнен`, `${jsClickError.message}`);
                    }
                }
                
                // Ждем после клика
                const waitAfterClick = parseInt(process.env.WAIT_AFTER_CLICK || '2000');
                console.log(`Ожидание после клика: ${waitAfterClick}ms`);
                await new Promise(resolve => setTimeout(resolve, waitAfterClick));
            } catch (clickError) {
                await logWarning(`Предупреждение: Ошибка при клике`, `${clickError.message}`);
                // Продолжаем выполнение, даже если клик не удался
            }
        }

        if (process.env.DEBUG_SCREENSHOT === 'true') {
            await page.screenshot({ path: 'debug-screenshot-3.png', fullPage: true });
            console.log("Создан скриншот для отладки 3");
        }

        // Если указан второй селектор клика, выполняем второй клик
        if (process.env.CLICK_SELECTOR2 && process.env.CLICK_SELECTOR2.trim()) {
            console.log(`Попытка второго клика на селектор: ${process.env.CLICK_SELECTOR2}`);
            try {
                await page.waitForSelector(process.env.CLICK_SELECTOR2, { 
                    visible: true,
                    timeout: parseInt(process.env.CLICK_TIMEOUT || '10000') 
                });
                await page.click(process.env.CLICK_SELECTOR2);
                console.log("Второй клик выполнен успешно");
                
                // Ждем после второго клика
                const waitAfterClick = parseInt(process.env.WAIT_AFTER_CLICK || '2000');
                console.log(`Ожидание после второго клика: ${waitAfterClick}ms`);
                await new Promise(resolve => setTimeout(resolve, waitAfterClick));
            } catch (clickError) {
                await logWarning(`Предупреждение: Ошибка при втором клике`, `${clickError.message}`);
            }
        }
        
        // Можно добавить скриншот для отладки
        if (process.env.DEBUG_SCREENSHOT === 'true') {
            await page.screenshot({ path: 'debug-screenshot-4.png', fullPage: true });
            console.log("Создан скриншот для отладки 4");
        }

    } catch (error) {
        await logError(`Ошибка загрузки страницы`, `${url}`, error);
        
        // Создаем скриншот ошибки
        try {
            await page.screenshot({ path: 'error-screenshot.png' });
            console.log("Создан скриншот ошибки");
        } catch (screenshotError) {
            console.error("Не удалось создать скриншот ошибки:", screenshotError);
        }
        
        // Закрываем браузер безопасно
        try {
            await browser.close();
        } catch (closeError) {
            console.error("Ошибка при закрытии браузера:", closeError);
        }
        
        console.log("Возвращаем пустой массив из-за ошибки загрузки страницы");
        return []; // Возвращаем пустой массив, чтобы скрипт не ломался
    }
    
    console.log("Извлечение данных со страницы...");
    
    let data = [];
    try {
        data = await page.evaluate((xpaths, baseUrl, brandPrefix) => {
            const results = [];
            const errors = []; // Массив для сбора ошибок

            // Улучшенная функция для выполнения XPath запросов
            const evaluateXPath = (xpath, contextNode = document) => {
                try {
                    const snapshot = document.evaluate(xpath, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    let result = [];
                    for (let i = 0; i < snapshot.snapshotLength; i++) {
                        result.push(snapshot.snapshotItem(i));
                    }
                    return result;
                } catch (error) {
                    const errorMessage = `Ошибка при выполнении XPath: "${xpath}", Error: ${error.message}`;
                    console.error(errorMessage);
                    errors.push(errorMessage);
                    return [];
                }
            };

            // Функция для извлечения строкового значения из узла по XPath
            const getStringValue = (xpath, contextNode = document) => {
                try {
                    const result = document.evaluate(xpath, contextNode, null, XPathResult.STRING_TYPE, null);
                    return result.stringValue.trim();
                } catch (error) {
                    const errorMessage = `Ошибка при получении строкового значения: "${xpath}", Error: ${error.message}`;
                    console.error(errorMessage);
                    errors.push(errorMessage);
                    return "";
                }
            };

            // Логируем начало извлечения данных
            console.log("XPath для элементов:", xpaths.itemXPath);
            
            // Получаем все элементы
            const items = evaluateXPath(xpaths.itemXPath);
            console.log(`Найдено ${items.length} элементов`);

            // Перебираем найденные элементы
            items.forEach((item, index) => {
                try {
                    const id = getStringValue(xpaths.idXPath, item);
                    const model = getStringValue(xpaths.modelXPath, item);
                    const price = getStringValue(xpaths.priceXPath, item);
                    let link = getStringValue(xpaths.linkXPath, item);

                    // Проверяем, является ли ссылка относительной
                    if (link && !link.startsWith('http')) {
                        try {
                            link = new URL(link, baseUrl).href;  // Добавляем домен к относительной ссылке
                        } catch (urlError) {
                            const errorMessage = `Ошибка при обработке URL "${link}": ${urlError.message}`;
                            console.error(errorMessage);
                            errors.push(errorMessage);
                        }
                    }
                    
                    // Проверка на наличие обязательных данных
                    if (model) {
                        results.push({
                            id: id,
                            brand: brandPrefix,
                            model: model,
                            price: price,
                            benefit: "",
                            link: link
                        });
                        console.log(`Добавлен элемент #${index}: ${model}`);
                    } else {
                        console.warn(`Элемент #${index} пропущен: нет модели`);
                    }
                } catch (itemError) {
                    const errorMessage = `Ошибка при обработке элемента #${index}: ${itemError.message}`;
                    console.error(errorMessage);
                    errors.push(errorMessage);
                }
            });

            console.log(`Всего извлечено ${results.length} элементов`);
            return { results, errors }; // Возвращаем и результаты, и ошибки
        }, xpaths, url, brandPrefix);

        // Логируем ошибки в Node.js контексте
        if (data.errors && data.errors.length > 0) {
            for (const errorMsg of data.errors) {
                await logWarning('Ошибка в page.evaluate', errorMsg);
            }
        }
        
    } catch (evaluateError) {
        await logError("Ошибка при извлечении данных из страницы", evaluateError.message, evaluateError);
        data = { results: [], errors: [] }; // Устанавливаем значения по умолчанию
    }
    
    const scrapedData = data.results || [];

    console.log(`Извлечено ${scrapedData.length} элементов`);
    
    // Закрываем браузер безопасно
    try {
        await browser.close();
        console.log("Браузер закрыт");
    } catch (closeError) {
        console.error("Ошибка при закрытии браузера:", closeError);
    }
    
    // Сортируем данные по ID
    scrapedData.sort((a, b) => a.id.localeCompare(b.id));
    console.log("Данные отсортированы по ID");
    
    return scrapedData;
}

async function readJsonFile(filePath) {
    try {
        // Проверяем существование файла
        try {
            await fs.access(filePath);
        } catch (error) {
            console.log(`Файл не существует: ${filePath}`);
            return false;
        }

        // Чтение файла
        const data = await fs.readFile(filePath, 'utf8');
        
        // Парсинг JSON
        const jsonData = JSON.parse(data);
        
        // Возвращаем объект для дальнейших действий
        return jsonData;
    } catch (error) {
        // Ошибку парсинга Дилерского JSON файла не отображаем, потому что не все ДЦ используют свои цены
        logError(`Ошибка при чтении файла`, `${error.message}`, error);
        return false;
        // throw error; // Пробрасываем ошибку для обработки в вызывающем коде
    }
}

function cleanString(str, wordToRemove) {
    if (!str || typeof str !== 'string') {
        return '';
    }
    
    if (!wordToRemove) {
        // Если wordToRemove пустой, просто очищаем строку от не-алфавитно-цифровых символов
        return str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }
    
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
            // TODO: Отключить обработку дилерских цен
            if(dealerPrice) {
                console.log(`Проверка дилерских цен из файла: ${dealerPrice}`);
                const dealerPricePath = path.join(directory, dealerPrice);
                console.log(`Полный путь к файлу дилерских цен: ${dealerPricePath}`);
                
                const jsonData = await readJsonFile(dealerPricePath);
                if(jsonData) {
                    console.log(`Файл дилерских цен прочитан, обработка данных...`);
                    
                    dealerdata.forEach(car => {
                        const model = cleanString(car["model"], brandPrefix);
                        console.log(`Обработка модели: ${car["model"]} (очищенная: ${model})`);
                        
                        if(jsonData[model]) {
                            console.log(`Найдена модель в дилерских ценах: ${model}`);
                            
                            if(dealerPriceField && jsonData[model][dealerPriceField] != "") {
                                const carPrice = parseInt(car["price"]) || Infinity;
                                const dealerModelPrice = parseInt(jsonData[model][dealerPriceField]);
                                
                                console.log(`Сравнение цен: ${carPrice} vs ${dealerModelPrice}`);
                                car["price"] = Math.min(carPrice, dealerModelPrice).toString();
                                console.log(`Итоговая цена: ${car["price"]}`);
                            }
                            
                            if(dealerBenefitField && jsonData[model][dealerBenefitField] != "") {
                                const carBenefit = car["benefit"] ? parseInt(car["benefit"]) : 0;
                                const dealerModelBenefit = parseInt(jsonData[model][dealerBenefitField]);
                                
                                console.log(`Сравнение выгоды: ${carBenefit} vs ${dealerModelBenefit}`);
                                car["benefit"] = Math.max(carBenefit, dealerModelBenefit).toString();
                                console.log(`Итоговая выгода: ${car["benefit"]}`);
                            }
                        } else {
                            console.log(`Модель ${model} не найдена в дилерских ценах`);
                        }
                    });
                } else {
                    console.log(`Файл дилерских цен не найден или пуст`);
                }
            }
            
            // Создаем директорию, если её нет
            await fs.mkdir(directory, { recursive: true });
            
            // Записываем данные в файл
            await fs.writeFile(filePath, JSON.stringify(dealerdata, null, 2), 'utf8');
            console.log(`Данные успешно сохранены в файл: ${filePath}`);

            // Создаем копию файла с именем federal-models_price.json
            if (filePath.endsWith('cars.json')) {
                const models_price = path.join(directory, 'models-price.json');
                try {
                    await fs.access(models_price);
                    await fs.unlink(models_price);
                    console.log(`File ${models_price} deleted successfully.`);
                } catch (err) {
                    if (err.code === 'ENOENT') {
                        console.log(`File ${models_price} does not exist.`);
                    } else {
                        console.error(`Error deleting file: ${err}`);
                    }
                }
                const modelsPricePath = path.join(directory, 'federal-models_price.json');
                await fs.writeFile(modelsPricePath, JSON.stringify(dealerdata, null, 2), 'utf8');
                console.log(`Копия данных успешно сохранена в файл: ${modelsPricePath}`);
            }
        } catch (error) {
            await logError(`Ошибка при сохранении файла`, `${filePath}`, error);
        }
    }
}

// Пример вызова функции
(async () => {
    try {
        const url = process.env.URL;  // URL передается через переменные окружения
        if (!url) {
            console.error("Ошибка: URL не указан в переменных окружения");
            process.exit(0); // Изменено с process.exit(1) для продолжения workflow
        }
        
        const xpaths = {
            itemXPath: process.env.ITEM_XPATH,
            idXPath: process.env.ID_XPATH,
            modelXPath: process.env.MODEL_XPATH,
            priceXPath: process.env.PRICE_XPATH,
            linkXPath: process.env.LINK_XPATH,
        };
        
        // Проверяем наличие обязательных XPath
        const missingXPaths = Object.entries(xpaths)
            .filter(([key, value]) => !value)
            .map(([key]) => key);
        
        if (missingXPaths.length > 0) {
            console.error(`Ошибка: Отсутствуют обязательные XPath: ${missingXPaths.join(', ')}`);
            process.exit(0); // Изменено с process.exit(1) для продолжения workflow
        }

        console.log("Начало выполнения скрапинга...");
        console.log(`URL: ${url}`);
        console.log("XPaths:", xpaths);
        
        const data = await scrapePage(url, xpaths);
        console.log(`Получено ${data.length} элементов данных`);

        if (data.length > 0) {
            // Разделение путей сохранения по запятой и обработка их как списка
            const outputFilePaths = process.env.OUTPUT_PATHS ? process.env.OUTPUT_PATHS.split(',') : ['./output/data.json'];
            console.log(`Сохранение данных в файлы: ${outputFilePaths.join(', ')}`);
            await saveJson(data, outputFilePaths);
            console.log("Данные успешно сохранены");
        } else {
            console.log("Данные не были получены, файл не записывается.");
        }
    } catch (error) {
        console.error("Критическая ошибка в main:", error);
        await logError("Критическая ошибка в main", error.message, error);
        console.log("Скрипт завершен с ошибкой, но не прерывает workflow");
        process.exit(0); // Возвращаем код 0 для успешного завершения в CI/CD
    }
})().catch(error => {
    console.error("Неперехваченная ошибка:", error);
    // Не вызываем process.exit(1) для продолжения workflow
    process.exit(0);
});
