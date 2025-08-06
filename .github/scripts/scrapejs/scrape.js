// const puppeteer = require('puppeteer');
require('dotenv').config();
const { getElements } = require('./getElements');
const { saveJson } = require('./saveJson');

const MAX_RETRIES = 3;
const TIMEOUT_BETWEEN_RETRIES = 2000;
const OUTPUT_PATHS = process.env.OUTPUT_PATHS.split(',');
const Message = {
  SUCCESS: 'Данные успешно сохранены!',
  ERROR: 'Ошибка получения данных: '
};

(async () => {
  let data;
  let retryCount = 1;

  while (retryCount <= MAX_RETRIES) {
    console.log(`Попытка получения данных ${retryCount} из ${MAX_RETRIES} ...`);
    try {
      data = await getElements();
      break;
    } catch (err) {
      console.error(`Попытка #${retryCount} не удалась:`, err.message);
      retryCount++;
      
      if (retryCount === MAX_RETRIES) {
        throw new Error(`Не удалось загрузить страницу после ${MAX_RETRIES} попыток`);
      }
      
      await new Promise(resolve => setTimeout(resolve, TIMEOUT_BETWEEN_RETRIES));
    }
  }
  return data;
})().then(data => {
  data.sort((a, b) => a.id.localeCompare(b.id));
  console.log(data);
  saveJson(data, OUTPUT_PATHS);
  console.log(Message.SUCCESS);
}).catch(err => {
  console.log(Message.ERROR, err.message);
  process.exit(0);
});


