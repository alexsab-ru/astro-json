const puppeteer = require('puppeteer');
require('dotenv').config();
const { BrowserOption, Viewport, Platform, ResponseOption, WaitUntil, WaitForSelectorOption } = require('./variables');
const { getId, getModel, getPrice, getLink } = require('./getDataByCSS');
const { saveJson } = require('./saveJson');

const DEBUG_SCREENSHOT = process.env.DEBUG_SCREENSHOT === 'true' ? true : false;
const OUTPUT_PATHS = process.env.OUTPUT_PATHS.split(',');

const Config = {
  URL: process.env.URL,
  BRAND: process.env.BRAND,
  CLICK_SELECTOR: process.env.CLICK_SELECTOR || null,
  WAIT_SELECTOR: process.env.WAIT_SELECTOR || null,
  ITEM: process.env.ITEM_CSS,
  PRICE: process.env.PRICE_CSS,
  MODEL: process.env.MODEL_CSS,
  LINK: process.env.LINK_CSS || null
};


const browserOptions = {
  args: BrowserOption.ARGS,
  executablePath: process.env.CHROME_BIN || (process.platform === Platform.WIN ? BrowserOption.PATHS.WIN : BrowserOption.PATHS.LINUX),
  timeout: BrowserOption.TIMEOUT,
  headless: true,
  ignoreHTTPSErrors: true
};

const getElements = async () => {
  const browser = await puppeteer.launch(browserOptions);
  const page = await browser.newPage();
  const data = [];

  await page.setViewport({width: Viewport.WIDTH, height: Viewport.HEIGHT});

  try {
    const response = await page.goto(Config.URL, {
      waitUntil: Config.CLICK_SELECTOR ? WaitUntil.DOM : WaitUntil.FULL,
      timeout: ResponseOption.TIMEOUT,
    });
  
    if (!response.ok()) {
      throw new Error(`Статус загрузки страницы: ${response.status()}`);
    }
  } catch (err) {
    await browser.close();
    throw new Error(err.message);
  }
  

  if (Config.CLICK_SELECTOR) {
    try {
      await page.waitForSelector(Config.CLICK_SELECTOR, { visible: true, timeout: WaitForSelectorOption.TIMEOUT });
    } catch (err) {
      console.log('CLICK_SELECTOR не появился');
    }
    
    if (DEBUG_SCREENSHOT) {
      await page.screenshot({ path: 'before-click.png' });
    }
    const modelsLink = await page.$(Config.CLICK_SELECTOR);
    await modelsLink.click();
    
    if (Config.WAIT_SELECTOR) {
      try {
        await page.waitForSelector(Config.WAIT_SELECTOR, { timeout: WaitForSelectorOption.TIMEOUT });
      } catch (err) {
        console.log('WAIT_SELECTOR не появлися');
      }
    }
   
    if (DEBUG_SCREENSHOT) {
      await page.screenshot({ path: 'after-click.png' });
    }
  }

  const elements = await page.$$(Config.ITEM);
  if (elements.length) {
    for (const element of elements) {
      const price = await getPrice(element, Config.PRICE);
      const link = Config.LINK ? await getLink(element, Config.LINK, Config.BRAND) : null;
      const model = await getModel(element, Config.MODEL, Config.BRAND, link);
      const id = getId(Config.BRAND, link);
      data.push({
        id,
        brand: Config.BRAND,
        model,
        price,
        benefit: '',
        link,
      });
    }
    await browser.close();
    return data;
  } else {
    await browser.close();
    throw new Error('Не найдено ни одного элемента.');
  }
};

(async () => {
  let data;
  let retryCount = 1;

  while (retryCount <= ResponseOption.MAX_RETRIES) {
    console.log(`Попытка получения данных ${retryCount} из ${ResponseOption.MAX_RETRIES} ...`);
    try {
      data = await getElements();
      break;
    } catch (err) {
      console.error(`Попытка #${retryCount} не удалась:`, err.message);
      retryCount++;
      
      if (retryCount === ResponseOption.MAX_RETRIES) {
        throw new Error(`Не удалось загрузить страницу после ${ResponseOption.MAX_RETRIES} попыток`);
      }
      
      await new Promise(resolve => setTimeout(resolve, ResponseOption.TIMEOUT_BETWEEN_RETRIES));
    }
  }
  return data;
})().then(data => {
  data.sort((a, b) => a.id.localeCompare(b.id));
  console.log('sort data: ', data);
  saveJson(data, OUTPUT_PATHS);
  console.log('Данные успешно сохранены.');
}).catch(err => {
  console.log('Ошибка получения данных: ', err.message);
  process.exit(0);
});


