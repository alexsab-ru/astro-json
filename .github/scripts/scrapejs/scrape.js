const puppeteer = require('puppeteer');
require('dotenv').config();
const { BrowserOption, Viewport, Platform, ResponseOption, SearchType } = require('./variables');
const { getDataByXPath } = require('./getDataByXPath');
const { getDataByCSS } = require('./getDataByCSS');

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
          const model = await element.$(process.env.MODEL_CSS);
          if (model) {
            const text = await model.evaluate(node => node.textContent);
            console.log('model', text);
          } else {
            console.log('no model')
          }
          const price = await element.$(process.env.PRICE_CSS);
          console.log('price: ', price);
          if (price) {
            const text = await price.evaluate(node => node.textContent);
            console.log(text);
          } else {
            console.log('no price')
          }
        }
      } else {
        console.log('no items');
      }
    }
    
    // const elements = await page.$$(`xpath/${searchData.item}`);
    
    // if (elements && elements.length) {
    //   for (const element of elements) {
        
    //     if (searchData.type === SearchType.XPATH) {
    //       const model = await element.$eval('a');
    //       console.log(model);
    //     }
    //   }
    // }
    
        
  } catch (err) {
    console.log('Ошибка получения данных: ', err);
  } finally {
    await browser.close();
  }
})();


