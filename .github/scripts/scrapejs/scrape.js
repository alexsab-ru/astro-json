// const puppeteer = require('puppeteer');
require('dotenv').config();

const { getElements } = require('./getElements');
const { saveJson } = require('./saveJson');
const { logError } = require('./logError');
const { validateEnv } = require('./utils');

validateEnv(['BRAND', 'URL', 'OUTPUT_PATHS', 'ITEM_CSS', 'MODEL_CSS', 'PRICE_CSS', 'LINK_CSS']);

const MAX_RETRIES = 3;
const TIMEOUT_BETWEEN_RETRIES = 2000;
const OUTPUT_PATHS = process.env.OUTPUT_PATHS.split(',');
const Message = {
  SUCCESS: 'Данные успешно сохранены!',
  ERROR: 'Ошибка получения данных. '
};
const brand = process.env.BRAND;
const url = process.env.URL;

(async () => {
  let data;
  let retryCount = 0;

  console.log(`Сайт ${brand.toUpperCase()} ${url}`);
  while (retryCount <= MAX_RETRIES) {
    console.log(`Попытка получения данных ${retryCount + 1} из ${MAX_RETRIES} ...`);
    try {
      data = await getElements();
      break;
    } catch (err) {
      console.error(`Попытка #${retryCount + 1} не удалась.`, err.message);
      retryCount++;
      
      if (retryCount === MAX_RETRIES) {
        throw new Error(`\nНе удалось получить данные ${brand.toUpperCase()}. ${err.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, TIMEOUT_BETWEEN_RETRIES));
    }
  }
  return data;
})().then(data => {
  // Безопасная сортировка по id
  data.sort((a, b) => (a.id || '').localeCompare(b.id || ''));
  // console.log(data);
  saveJson(data, OUTPUT_PATHS);
  console.log(Message.SUCCESS);
}).catch(err => {
  console.log(Message.ERROR, err.message);
  logError(err.message);
  process.exit(0);
});
