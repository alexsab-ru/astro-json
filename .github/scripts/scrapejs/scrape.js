const puppeteer = require('puppeteer');
require('dotenv').config();
const { BrowserOption, Viewport, Platform, ResponseOption, WaitUntil, WaitForSelectorOption } = require('./variables');
const { getId, getModel, getPrice, getLink } = require('./getDataByCSS');

const DEBUG_SCREENSHOT = process.env.DEBUG_SCREENSHOT === 'true' ? true : false;

const browserOptions = {
  args: BrowserOption.ARGS,
  executablePath: process.env.CHROME_BIN || (process.platform === Platform.WIN ? BrowserOption.PATHS.WIN : BrowserOption.PATHS.LINUX),
  timeout: BrowserOption.TIMEOUT,
  headless: true,
  ignoreHTTPSErrors: true
};

(async () => {
  const browser = await puppeteer.launch(browserOptions);
  const page = await browser.newPage();
  const brand = process.env.BRAND;
  const data = [];
  await page.setViewport({width: Viewport.WIDTH, height: Viewport.HEIGHT});
  try {
    const response = await page.goto(process.env.URL, {
      waitUntil: process.env.CLICK_SELECTOR ? WaitUntil.DOM : WaitUntil.FULL,
      timeout: ResponseOption.TIMEOUT,
    });

    if (!response.ok()) {
      throw new Error(`Статус загрузки страницы: ${response.status()}`);
    }

    if (process.env.CLICK_SELECTOR) {
      await page.waitForSelector(process.env.CLICK_SELECTOR, { visible: true, timeout: WaitForSelectorOption.TIMEOUT });
      if (DEBUG_SCREENSHOT) {
        await page.screenshot({ path: 'before-click.png' });
      }
      const modelsLink = await page.$(process.env.CLICK_SELECTOR);
      await modelsLink.click();
      if (DEBUG_SCREENSHOT) {
        await page.screenshot({ path: 'after-click.png' });
      }
    }

    const elements = await page.$$(process.env.ITEM_CSS);
    if (elements.length) {
      for (const element of elements) {
        const price = await getPrice(element, process.env.PRICE_CSS);
        const link = process.env.LINK_CSS ? await getLink(element, process.env.LINK_CSS) : null;
        const model = await getModel(element, process.env.MODEL_CSS, brand, link);
        const id = getId(brand, link);
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
  } catch (err) {
    console.log('Ошибка получения данных: ', err);
  } finally {
    await browser.close();
  }
})();


