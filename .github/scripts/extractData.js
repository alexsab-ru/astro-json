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
const dealerPrice = process.env.DEALERPRICE ?? "";
const dealerPriceField = process.env.DEALERPRICEFIELD ?? "";

// Функция для загрузки HTML-страницы
async function fetchHTML(url) {
    try {
        const { data } = await axios.get(url);
        return data;
    } catch (error) {
        console.error(`Ошибка при загрузке URL: ${error}`);
        process.exit(1);
    }
}

// Основная функция для выполнения поиска и извлечения данных
async function extractData() {
    // Загружаем HTML по URL
    const html = await fetchHTML(url);

    // Применяем регулярное выражение для поиска нужной строки
    const regex = new RegExp(regexPattern);
    const match = html.match(regex);

    if (!match || match.length < 2) {
        console.error("Не удалось найти соответствие регулярному выражению.");
        process.exit(1);
    }

    // Парсим JSON из найденной строки
    const jsonString = match[1];
    let jsonData;
    try {
        jsonData = JSON.parse(jsonString);
    } catch (error) {
        console.error("Ошибка при парсинге JSON: ", error);
        process.exit(1);
    }

    // Достаем объекты по пути desktopMenu.sections[0].data.tabs.items[0].content.cards
    const cards = jsonData.desktopMenu.sections[0].data.tabs.items[0].content.cards;

    if (!cards || !Array.isArray(cards)) {
        console.error("Не удалось найти объекты cards по заданному пути.");
        process.exit(1);
    }

    // Преобразуем объекты в нужный формат
    const result = cards.map(card => {
        const linkParts = card.link.url.split('/').filter(part => part !== ''); // Убираем пустые значения
        let id = linkParts[linkParts.length - 1]; // Берем последнее непустое значение

        // Проверяем и добавляем префикс BRAND, если необходимо
        if (!id.startsWith(`${brandPrefix}-`)) {
            id = `${brandPrefix}-${id}`;
        }
        let price = card.price.value.replace(/\D/g, ''); // Убираем все нецифровые символы из цены
        if(price > 9999999) {
            price = processNumber(price);
        }
        if(price > 9999999) {
            price = card.price.value.toLowerCase();
            price = price.replace(/text-decoration: line-through">от/g, 'text-decoration: line-through; display: block;"><span class=\"text-sm text-gray-400 inline-block line-through\">от</span>');
            price = price.replace(/span> от/g, 'span> <span class="text-sm text-gray-400 inline-block ">от</span>');
            price = JSON.stringify(price).slice(1, -1);;
        }
        return {
            id: id,
            model: card.title.text.value,
            price: price,
            link: card.link.url
        };
    });

    return result;
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
            const jsonData = await readJsonFile(path.join(directory, '/', dealerPrice));
            if(jsonData) {
                dealerdata.map(car => {
                    model = cleanString(car["model"], brandPrefix);
                    if(jsonData[model]) {
                        car["price"] = Math.min(parseInt(car["price"]), jsonData[model][dealerPriceField]).toString();
                    }
                    return car;
                });
            }
            await fs.mkdir(directory, { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(dealerdata, null, 2), 'utf8');
            console.log(`Данные успешно сохранены в файл: ${filePath}`);
        } catch (error) {
            console.error(`Ошибка сохранения файла ${filePath}: ${error}`);
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
    // Запускаем основную функцию
    const data = await extractData();
    
    // Разделение путей сохранения по запятой и обработка их как списка
    const outputFilePaths = process.env.OUTPUT_PATHS ? process.env.OUTPUT_PATHS.split(',') : ['./output/data.json'];
    await saveJson(data, outputFilePaths);
})();