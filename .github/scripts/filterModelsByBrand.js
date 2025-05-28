const fs = require('fs');
const path = require('path');

// Утилиты
const readJson = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    logError(`Ошибка чтения JSON файла: ${filePath}`);
    return null;
  }
};

const parseList = (str) =>
  (str || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

const pickFields = (obj, keys) =>
  keys.reduce((res, key) => {
    if (obj.hasOwnProperty(key)) {
      res[key] = obj[key];
    }
    return res;
  }, {});

// Логирование с цветами
const logSuccess = (msg) => console.log('\x1b[30;42m%s\x1b[0m', msg);
const logWarning = (msg) => console.log('\x1b[30;43m%s\x1b[0m', msg);
const logError   = (msg) => console.log('\x1b[30;41m%s\x1b[0m', msg);

// Получаем путь к директории дилера из аргументов
const dealerDir = process.argv[2];
if (!dealerDir) {
  logError('Не указана директория дилера');
  process.exit(1);
}

// Пути к файлам
const settingsFilePath = path.join(dealerDir, 'data', 'settings.json');
const sourceModelsFilePath = path.join(process.cwd(), 'src', 'models.json');
const outputModelsFilePath = path.join(dealerDir, 'data', 'models.json');

// Основные данные
const data = {
  models: [],
  testDrive: [],
  services: []
};

try {
  const settings = readJson(settingsFilePath);
  const allModels = readJson(sourceModelsFilePath);

  if (!settings || !allModels) throw new Error('Не удалось загрузить файлы settings.json или src/models.json');

  // Проверяем, что allModels - это массив
  if (!Array.isArray(allModels)) {
    throw new Error('Файл src/models.json должен содержать массив моделей');
  }

  const brands = parseList(settings.brand);
  
  // Функция для проверки соответствия модели заданным параметрам
  const isModelMatch = (model, markId, modelId) => {
    return model.mark_id && 
           String(model.mark_id).toLowerCase() === String(markId).toLowerCase() &&
           model.id && 
           String(model.id).toLowerCase() === String(modelId).toLowerCase();
  };

  // Обработка моделей для test-drive
  if (settings.testDriveIDs && settings.testDriveIDs.length > 0) {
    data.testDrive = settings.testDriveIDs
      .map(id => allModels.find(m => isModelMatch(m, id.mark_id, id.id)))
      .filter(Boolean)
      .map(m => pickFields(m, ['mark_id', 'id', 'show', 'name', 'thumb', 'globalChars']));
  } else {
    // Если testDriveIDs не указаны, берем все модели указанных брендов
    data.testDrive = allModels
      .filter(m => m.mark_id && brands.includes(String(m.mark_id).toLowerCase()))
      .map(m => pickFields(m, ['mark_id', 'id', 'show', 'name', 'thumb', 'globalChars']));
  }

  // Обработка моделей для services
  if (settings.serviceIDs && settings.serviceIDs.length > 0) {
    data.services = settings.serviceIDs
      .map(id => allModels.find(m => isModelMatch(m, id.mark_id, id.id)))
      .filter(Boolean)
      .map(m => pickFields(m, ['mark_id', 'id', 'name']));
  } else {
    // Если serviceIDs не указаны, берем все модели указанных брендов
    data.services = allModels
      .filter(m => m.mark_id && brands.includes(String(m.mark_id).toLowerCase()))
      .map(m => pickFields(m, ['mark_id', 'id', 'name']));
  }

  // Обработка основных моделей
  if (settings.modelIDs && settings.modelIDs.length > 0) {
    data.models = settings.modelIDs
      .map(id => allModels.find(m => isModelMatch(m, id.mark_id, id.id)))
      .filter(Boolean);
  } else {
    // Если modelIDs не указаны, берем все модели указанных брендов
    data.models = allModels.filter(m => 
      m.mark_id && brands.includes(String(m.mark_id).toLowerCase())
    );
  }

  if (data.models.length === 0) {
    logWarning('Внимание: не найдено ни одной подходящей модели. models.json создан как пустой объект');
  } else {
    logSuccess('models.json успешно обновлён');
  }
} catch (err) {
  logError(`Ошибка при обработке моделей: ${err.message}`);
  logError('models.json будет создан как пустой объект');
}

// Сохраняем файл
fs.writeFileSync(outputModelsFilePath, JSON.stringify(data, null, 2));
