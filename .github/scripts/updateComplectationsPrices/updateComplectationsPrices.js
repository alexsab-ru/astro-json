const fs = require('fs');
const path = require('path');

// Утилиты для логирования
const logSuccess = (msg) => console.log('\x1b[30;42m%s\x1b[0m', msg);
const logWarning = (msg) => console.log('\x1b[30;43m%s\x1b[0m', msg);
const logError = (msg) => console.log('\x1b[30;41m%s\x1b[0m', msg);
const logInfo = (msg) => console.log('\x1b[36m%s\x1b[0m', msg);

// Утилита для чтения JSON
const readJson = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    // Не выводим полный стек ошибки, только информацию о том, что файл не найден
    return null;
  }
};

// Утилита для записи JSON
const writeJson = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    logWarning(`⚠ Ошибка записи JSON файла: ${err.message}`);
    return false;
  }
};

// Функция для поиска модели по ID с возвратом бренда
const findModelWithBrandById = (modelId, complectationsPrices) => {
  for (const [brand, brandModels] of Object.entries(complectationsPrices)) {
    const model = brandModels.find(m => m.model_id === modelId);
    if (model) {
      return { brand, model };
    }
  }
  return null;
};

// Основная функция обновления цен
const updateComplectationsPrices = () => {
  logInfo('=== Начало обновления цен комплектаций ===');
  
  // Пути к файлам
  const dataDirectory = path.join(process.cwd(), 'src');
  const modelsFilePath = path.join(dataDirectory, 'models.json');
  const complectationsPricesFilePath = path.join(dataDirectory, 'complectations-prices.json');
  
  // Читаем файлы
  const modelsData = readJson(modelsFilePath);
  const complectationsPrices = readJson(complectationsPricesFilePath);
  
  // Если не удалось загрузить файл с ценами - это не критично
  if (!complectationsPrices) {
    logWarning('⚠ Файл complectations-prices.json не найден или пуст');
    logWarning('⚠ Обновление цен пропущено. Будут использованы текущие цены из models.json');
    logInfo('=== Обновление завершено (пропущено) ===');
    return;
  }
  
  // Если нет models.json - это более критично, но всё равно не падаем
  if (!modelsData) {
    logWarning('⚠ Файл models.json не найден');
    logWarning('⚠ Обновление цен невозможно');
    return;
  }
  
  let updatedCount = 0;
  let totalComplectations = 0;
  // models.json в astro-json — это массив моделей на верхнем уровне
  // Но поддержим и вариант { models: [...] } на случай других проектов
  const isArrayRoot = Array.isArray(modelsData);
  const models = isArrayRoot ? modelsData : (modelsData?.models || []);
  
  // Группируем модели по брендам и логируем блоки
  const groups = {};
  for (const model of models) {
    const match = findModelWithBrandById(model.id, complectationsPrices);
    if (!match || !model.complectations || model.complectations.length === 0) {
      continue;
    }
    const { brand, model: priceModel } = match;
    if (!groups[brand]) groups[brand] = [];
    groups[brand].push({ model, priceModel });
  }

  // Вычисляем обновления с разметкой логов по брендам
  const updatesMap = new Map();

  for (const [brand, entries] of Object.entries(groups)) {
    logInfo(`\n===== Бренд: ${brand} =====`);
    for (const { model, priceModel } of entries) {
      logInfo(`Обновление цен для модели: ${model.name || model.id}`);

      const updatedComplectations = model.complectations.map(complectation => {
        totalComplectations++;

        const priceComplectation = priceModel.complectations.find(
          pc => pc.name === complectation.name
        );

        if (priceComplectation && priceComplectation.price) {
          const oldPrice = complectation.price;
          let newPrice = priceComplectation.price;

          if (priceComplectation.benefit) {
            const priceNum = parseInt(newPrice, 10);
            const benefitNum = parseInt(priceComplectation.benefit, 10);

            if (!isNaN(priceNum) && !isNaN(benefitNum) && benefitNum > 0) {
              const priceWithDiscount = priceNum - benefitNum;
              newPrice = String(priceWithDiscount);
              console.log(`  ✓ ${complectation.name}: ${oldPrice} → ${newPrice} (с учетом скидки: ${benefitNum})`);
            } else {
              console.log(`  ✓ ${complectation.name}: ${oldPrice} → ${newPrice}`);
            }
          } else {
            console.log(`  ✓ ${complectation.name}: ${oldPrice} → ${newPrice}`);
          }

          if (oldPrice !== newPrice) {
            updatedCount++;
          }

          return { ...complectation, price: newPrice };
        }

        return complectation;
      });

      updatesMap.set(model.id, { ...model, complectations: updatedComplectations });
    }
  }

  // Собираем обновленный список моделей, сохраняя исходный порядок
  const updatedModels = models.map(m => updatesMap.get(m.id) || m);
  
  // Сохраняем обновленные данные
  const updatedModelsData = isArrayRoot
    ? updatedModels
    : {
        ...modelsData,
        models: updatedModels
      };
  
  if (writeJson(modelsFilePath, updatedModelsData)) {
    logSuccess(`✓ Успешно обновлено цен: ${updatedCount} из ${totalComplectations} комплектаций`);
    logInfo('=== Обновление завершено ===');
  } else {
    logWarning('⚠ Не удалось сохранить обновленный файл models.json');
    logWarning('⚠ Будут использованы текущие цены');
  }
};

// Запуск скрипта
try {
  updateComplectationsPrices();
} catch (error) {
  logWarning('⚠ Ошибка при выполнении скрипта обновления цен');
  logWarning(`⚠ ${error.message}`);
  logWarning('⚠ Продолжаем работу со старыми ценами');
}

