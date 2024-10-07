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
            price = card.price.value.toLowerCase();
            // price = price.replace(/от/g, '<span class="text-sm text-gray-400">от</span>');
            // price = price.replace(/text-decoration: line-through/g, 'text-decoration: line-through; display: block;');
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

async function saveJson(data, filePaths) {
    for (const filePath of filePaths) {
        try {
            const directory = path.dirname(filePath);
            await fs.mkdir(directory, { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`Данные успешно сохранены в файл: ${filePath}`);
        } catch (error) {
            console.error(`Ошибка сохранения файла ${filePath}: ${error}`);
        }
    }
}

(async () => {
    // Запускаем основную функцию
    const data = await extractData();

    // Разделение путей сохранения по запятой и обработка их как списка
    const outputFilePaths = process.env.OUTPUT_PATHS ? process.env.OUTPUT_PATHS.split(',') : ['./output/data.json'];
    await saveJson(data, outputFilePaths);
})();