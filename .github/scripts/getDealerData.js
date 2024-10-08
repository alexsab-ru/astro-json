// node .github/scripts/getDealerData.js
const fs = require('fs');
const fsPromises = require('fs').promises; // Добавляем промисы из fs
const path = require('path');
const https = require('https');
const csv = require('csv-parse');

// Получение переменных среды
const csvUrl = process.env.CSV_URL;
const queryString = process.env.QUERY_STRING;
const query = csvUrl + encodeURIComponent(queryString);
const keyColumn = process.env.KEY_COLUMN;

// Функция для скачивания CSV
function downloadCsv(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                resolve(data);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Функция для парсинга CSV и конвертации в JSON
function convertCsvToJson(csvData, keyColumn) {
    return new Promise((resolve, reject) => {
        csv.parse(csvData, { columns: true }, (err, records) => {
            if (err) {
                reject(err);
                return;
            }

            const result = {};
            records.forEach(record => {
                if (Object.values(record).some(value => value.trim() !== '')) {
                    const key = record[keyColumn];
                    const transformedRecord = {};

                    // Проходим по всем полям записи и приводим значения к числу, если возможно
                    Object.keys(record).forEach(field => {
                        if (field !== keyColumn) { // Исключаем поле с ключом
                            let value = record[field].trim(); // Убираем лишние пробелы
                            // Преобразуем строку в число, если это возможно
                            if (/^-?\d+(\s\d+)*(\.\d+)?$/.test(value)) {
                                // Убираем пробелы внутри числа и преобразуем в число
                                value = Number(value.replace(/\s+/g, ''));
                            }
                            transformedRecord[field] = value;
                        }
                    });
                    result[key] = transformedRecord;
                }
            });

            resolve(result);
        });
    });
}

async function saveJson(data, filePaths) {
    for (const filePath of filePaths) {
        try {
            const directory = path.dirname(filePath);
            await fsPromises.mkdir(directory, { recursive: true }); // Используем fsPromises
            await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8'); // Используем fsPromises
            console.log(`Данные успешно сохранены в файл: ${filePath}`);
        } catch (error) {
            console.error(`Ошибка сохранения файла ${filePath}: ${error}`);
        }
    }
}

// Основная функция
async function main() {
    try {
        const csvData = await downloadCsv(query);
        const jsonData = await convertCsvToJson(csvData, keyColumn);
        
        const outputFilePaths = process.env.OUTPUT_PATHS ? process.env.OUTPUT_PATHS.split(',') : ['./output/prices.json'];
        await saveJson(jsonData, outputFilePaths);
    } catch (error) {
        console.error('Произошла ошибка:', error);
    }
}

main();
