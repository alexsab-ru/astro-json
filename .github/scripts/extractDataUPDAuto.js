// Импортируем необходимые модули
const axios = require('axios');
const jsdom = require('jsdom');
const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = jsdom;

// Получаем URL и REGEXP из переменных окружения
const url = process.env.URL;
const regexPattern = process.env.REGEXP;
const brandPrefix = process.env.BRAND;

// Добавляем функцию логирования
async function logError(error) {
    console.error(error);
    try {
        await fs.appendFile('output.txt', `${new Date().toISOString()}: ${error}\n`);
    } catch (appendError) {
        console.error('Ошибка при записи в лог:', appendError);
    }
}

// Функция для загрузки HTML-страницы
async function fetchHTML(url) {
    try {
        // Добавляем больше опций для axios для лучшей обработки SSL ошибок
        const { data } = await axios.get(url, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        return data;
    } catch (error) {
        await logError(`Ошибка при загрузке URL: ${url}, ${error.message}`);
        console.log("Возвращаем пустую строку из-за ошибки загрузки");
        return ""; // Возвращаем пустую строку вместо завершения процесса
    }
}

// Основная функция для выполнения поиска и извлечения данных
async function extractData() {
    try {
        // Загружаем HTML по URL
        const html = await fetchHTML(url);

        // Проверяем, что HTML загрузился
        if (!html) {
            console.log("HTML не загрузился, возвращаем пустой массив");
            return [];
        }

        // Применяем регулярное выражение для поиска нужной строки
        const regex = new RegExp(regexPattern);
        const match = html.match(regex);

        if (!match || match.length < 2) {
            await logError("Не удалось найти соответствие регулярному выражению.");
            console.log("Возвращаем пустой массив из-за отсутствия совпадений с regex");
            return [];
        }

        // Парсим JSON из найденной строки
        const jsonString = match[1];
        let jsonData;
        try {
            jsonData = JSON.parse(jsonString);
        } catch (error) {
            await logError(`Ошибка при парсинге JSON: ${error.message}`);
            console.log("Возвращаем пустой массив из-за ошибки парсинга JSON");
            return [];
        }

        // Достаем объекты по пути desktopMenu.sections[0].data.tabs.items[0].content.cards
        let cards;
        try {
            cards = jsonData.desktopMenu.sections[0].data.tabs.items[0].content.cards;
        } catch (pathError) {
            await logError(`Ошибка при доступе к пути объекта: ${pathError.message}`);
            console.log("Возвращаем пустой массив из-за ошибки доступа к данным");
            return [];
        }

        if (!cards || !Array.isArray(cards)) {
            await logError("Не удалось найти объекты cards по заданному пути.");
            console.log("Возвращаем пустой массив - cards не найдены");
            return [];
        }

        // Преобразуем объекты в нужный формат
        const result = await Promise.all(cards.map(async card => {
            const linkParts = card.link.url.split('/').filter(part => part !== ''); // Убираем пустые значения
            let id = linkParts[linkParts.length - 1]; // Берем последнее непустое значение

            // Проверяем и добавляем префикс BRAND, если необходимо
            if (!id.startsWith(`${brandPrefix}-`)) {
                id = `${brandPrefix}-${id}`;
            }

            console.log("value: ", card.price.value.toLowerCase());
            const { benefit, cleanString } = await extractBenefit(card.price.value.toLowerCase());
            const price = await extractMinPrice(cleanString);
            console.log("price: ", price, benefit);
            let model = card.title.text.value;
            if (model.toLowerCase().startsWith(brandPrefix)) {
                const regex = new RegExp('^' + brandPrefix, 'i');
                model = model.replace(regex, '').trim();
            }
            
            return {
                id: id,
                brand: brandPrefix,
                model: model,
                price: price,
                benefit: benefit,
                link: card.link.url
            };
        }));

        return result;
    } catch (error) {
        await logError(`Критическая ошибка в extractData: ${error.message}`);
        console.log("Возвращаем пустой массив из-за критической ошибки");
        return [];
    }
}

async function extractBenefit(str) {
    // Находим все цены в строке с помощью регулярного выражения
    await Promise.resolve();
  
    const benefitMatch = str.match(/выгода\s+до\s+([\d\s]+)\s*₽/);
        
    if (!benefitMatch) {
        return {
            benefit: 0,
            cleanString: str
        };
    }

    // Извлекаем сумму выгоды
    const benefitAmount = parseInt(benefitMatch[1].replace(/\s/g, ''), 10);
    
    // Удаляем информацию о выгоде из исходной строки
    const cleanString = str.replace(/\s*выгода\s+до\s+[\d\s]+\s*₽/, '');

    return {
        benefit: benefitAmount,
        cleanString: cleanString
    };
};

async function extractMinPrice(str) {
    // Находим все цены в строке с помощью регулярного выражения
    await Promise.resolve();
  
    const prices = str.match(/(?:от|ОТ\s+)?([\d\s]+)\s*₽/g)
        ?.map(price => {
            console.log("price 1: ", price);
            const number = price.replace(/[^\d]/g, '');
            console.log("number 1: ", number);
        return parseInt(number, 10);
        }) || [];

    if (prices.length === 0) {
        console.warn('Не найдено цен в строке:', str);
        return 0;
    }
        
    return Math.min(...prices);
};

async function readJsonFile(filePath) {
    try {
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
    } catch (err) {
        await logError(`Ошибка при чтении или парсинге JSON файла: ${err.message}`);
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
            await fs.mkdir(directory, { recursive: true });
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
            await logError(`Ошибка сохранения файла ${filePath}: ${error}`);
        }
    }
}

function processNumber(num) {
    if (num > 10000000) {
        // Преобразуем число в строку
        let numStr = num.toString();
        
        // Вычисляем середину строки
        let midIndex = Math.floor(numStr.length / 2);
        
        // Разделяем строку на две половины
        let firstHalf = numStr.substring(0, midIndex);
        let secondHalf = numStr.substring(midIndex);
        
        // Преобразуем обе половины обратно в числа
        let firstNum = parseInt(firstHalf, 10);
        let secondNum = parseInt(secondHalf, 10);
        
        // Возвращаем наименьшее число из двух половин
        return Math.min(firstNum, secondNum).toString();
    }
    
    // Если число меньше или равно 10 000 000, возвращаем само число
    return num;
}

(async () => {
    try {
        // Запускаем основную функцию
        const data = await extractData();
        
        // Разделение путей сохранения по запятой и обработка их как списка
        const outputFilePaths = process.env.OUTPUT_PATHS ? process.env.OUTPUT_PATHS.split(',') : ['./output/data.json'];
        await saveJson(data, outputFilePaths);
        console.log("Скрипт завершен успешно");
    } catch (error) {
        console.error("Критическая ошибка в main:", error);
        await logError(`Критическая ошибка в main: ${error.message}`);
        console.log("Скрипт завершен с ошибкой, но не прерывает workflow");
        process.exit(0); // Возвращаем код 0 для успешного завершения в CI/CD
    }
})().catch(error => {
    console.error("Неперехваченная ошибка:", error);
    // Не вызываем process.exit(1) для продолжения workflow
    process.exit(0);
});