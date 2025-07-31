const puppeteer = require('puppeteer');
require('dotenv').config();
const { BrowserOption, Viewport, Platform, ResponseOption, SearchType } = require('./variables');
const { getDataByXPath } = require('./getDataByXPath');
const { getModel, getPrice, getLink } = require('./getDataByCSS');

const browserOptions = {
  args: BrowserOption.ARGS,
  executablePath: process.env.CHROME_BIN || (process.platform === Platform.WIN ? BrowserOption.WIN_PATH : BrowserOption.DEFAULT_PATH),
  timeout: BrowserOption.TIMEOUT,
  headless: true,
  ignoreHTTPSErrors: true
};

const searchData = {
  type: process.env.SEARCH_TYPE,
  url: process.env.URL,
};

(async () => {
  const browser = await puppeteer.launch(browserOptions);
  const page = await browser.newPage();
  const brand = process.env.BRAND;
  let data = [];
  await page.setViewport({width: Viewport.WIDTH, height: Viewport.HEIGHT});
  try {
    const response = await page.goto(searchData.url, {
      waitUntil: ResponseOption.WAIT_UNTIL.dom,
      timeout: ResponseOption.TIMEOUT,
    });

    if (!response.ok()) {
      throw new Error(`Статус загрузки страницы: ${response.status()}`);
    }

    if (searchData.type === SearchType.CSS) {
      const elements = await page.$$(process.env.ITEM_CSS);
      if (elements && elements.length) {
        for (const element of elements) {
          const model = await getModel(element, process.env.MODEL_CSS, brand);
          const price = await getPrice(element, process.env.PRICE_CSS);
          const link = await getLink(element, process.env.LINK_CSS);
          const id = `${brand}-${model.toLowerCase()}`;
          data.push({
            id,
            brand,
            model,
            price,
            benefit: '',
            link,
          });
        }
        console.log('data: ', data);
      } else {
        console.log('Не найдено ни одного элемента.');
      }
    }   
  } catch (err) {
    console.log('Ошибка получения данных: ', err);
  } finally {
    await browser.close();
  }
})();


