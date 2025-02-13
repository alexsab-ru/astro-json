const fs = require('fs').promises;
const path = require('path');

async function combinedJson(inputFilePaths) {
    // Считываем файлы и парсим JSON
    const jsonObjects = await Promise.all(inputFilePaths.map(async (file) => {
        const fileData = await fs.readFile(file, 'utf-8');
        return JSON.parse(fileData);
    }));

    // Объединяем все JSON-объекты в один массив
    return jsonObjects.reduce((acc, obj) => acc.concat(obj), []);
}

// Добавляем функцию логирования
async function logError(error) {
    console.error(error);
    try {
        await fs.appendFile('output.txt', `${new Date().toISOString()}: ${error}\n`);
    } catch (appendError) {
        console.error('Ошибка при записи в лог:', appendError);
    }
}

async function saveJson(data, filePaths) {
    for (const filePath of filePaths) {
        try {
            const directory = path.dirname(filePath);
            await fs.mkdir(directory, { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`Данные успешно сохранены в файл: ${filePath}`);
        } catch (error) {
            await logError(`Ошибка сохранения файла ${filePath}: ${error}`);
        }
    }
}

// Пример вызова функции
(async () => {
    const inputFilePaths = process.env.INPUT_PATHS ? process.env.INPUT_PATHS.split(',') : [''];
    const outputFilePaths = process.env.OUTPUT_PATHS ? process.env.OUTPUT_PATHS.split(',') : ['./output/data.json'];

    if (inputFilePaths.length > 0 && inputFilePaths[0] !== '') {
        try {
            const data = await combinedJson(inputFilePaths);
            await saveJson(data, outputFilePaths);
        } catch (error) {
            await logError(`Ошибка слияния файлов: ${error.message}`);
        }
    }
})();
