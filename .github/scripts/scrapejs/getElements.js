const puppeteer = require('puppeteer'); 
const fs = require('fs');
const path = require('path');
const { getId, getModel, getPrice, getLink } = require('./utils');

const DEBUG_SCREENSHOT = process.env.DEBUG_SCREENSHOT === 'true' ? true : false;

const BrowserOption = {
  ARGS: [
    '--no-sandbox', // Обязательно для Linux (GitHub Actions использует Ubuntu)
    '--disable-setuid-sandbox', // Для избежания проблем с правами
    '--disable-dev-shm-usage', // Помогает избежать проблем с памятью в Docker/CI
    '--disable-accelerated-2d-canvas', // Уменьшает использование ресурсов
    '--disable-gpu', // Отключает GPU (не нужен в headless)
    '--single-process', // Может помочь на слабых серверах (но не всегда стабильно)
    '--no-zygote', // Уменьшает использование памяти
  ],
  PATHS: {
    WIN: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    MAC: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    LINUX: '/usr/bin/google-chrome'
  },
  TIMEOUT: 60000,
};

const Viewport = {
  WIDTH: 1980,
  HEIGHT: 1080
};

const Platform = {
  WIN: 'win32',
  MAC: 'darwin',
  LINUX: 'linux',
};

const ResponseOption = {
  TIMEOUT: 60000,
};

const WaitForSelectorOption = {
  TIMEOUT: 60000,
};

const WaitUntil = {
  FULL: 'load', // Полная загрузка страницы (включая CSS, изображения, скрипты).
  DOM: 'domcontentloaded', // Быстрое завершение (DOM готов, но ресурсы могут догружаться).
  NETWORK_IDLE_0: 'networkidle0', // Нет активных запросов (хорош для SPA и AJAX-сайтов).
  NETWORK_IDLE_2: 'networkidle2' // Почти нет запросов (подходит для фоновых процессов).
};

const Config = {
  URL: process.env.URL,
  BRAND: process.env.BRAND,
  CLICK_SELECTOR: process.env.CLICK_SELECTOR || null,
  WAIT_SELECTOR: process.env.WAIT_SELECTOR || null,
  ITEM: process.env.ITEM_CSS,
  PRICE: process.env.PRICE_CSS,
  MODEL: process.env.MODEL_CSS,
  LINK: process.env.LINK_CSS || null,
  SCRAPE_JSON: process.env.SCRAPE_JSON || null // JSON-шаги: путь к файлу либо JSON-строка
};

const browserOptions = {
  args: BrowserOption.ARGS,
  executablePath: process.env.CHROME_BIN || (
    process.platform === Platform.WIN ? BrowserOption.PATHS.WIN : 
    process.platform === Platform.MAC ? BrowserOption.PATHS.MAC : 
    BrowserOption.PATHS.LINUX
  ),
  timeout: BrowserOption.TIMEOUT,
  headless: true,
  ignoreHTTPSErrors: true
};

/**
 * Загружает и парсит шаги из переменной окружения SCRAPE_JSON.
 * Поддерживает как путь к файлу, так и JSON-строку. Возвращает массив шагов.
 */
function loadScrapeStepsFromEnv() {
  if (!Config.SCRAPE_JSON) return null;
  try {
    const raw = Config.SCRAPE_JSON.trim();
    const content = (raw.startsWith('[') || raw.startsWith('{'))
      ? raw
      : fs.readFileSync(path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw), 'utf8');
    const steps = JSON.parse(content);
    if (!Array.isArray(steps)) {
      throw new Error('SCRAPE_JSON должен быть массивом шагов');
    }
    return steps;
  } catch (err) {
    throw new Error(`${Config.BRAND?.toUpperCase() || 'SCRAPER'}: Не удалось загрузить SCRAPE_JSON: ${err.message}`);
  }
}

/**
 * Выполняет шаги сценария на странице. Возвращает объект с переопределёнными селекторами.
 * Поддерживаемые шаги:
 * - { type: 'waitForNetworkIdle' }
 * - { type: 'wait', selector?: string, wait?: number }
 * - { type: 'click', selector: string, wait?: number }
 * - { type: 'get', selector: string, variable: 'item'|'model'|'price'|'link' }
 */
async function runScrapeSteps(page, steps, options) {
  const overrides = { ITEM: null, MODEL: null, PRICE: null, LINK: null };
  let currentScreenshotCount = options?.screenshotCount ?? 0;
  for (const step of steps) {
    const type = step?.type;
    if (!type) continue;
    if (type === 'waitForNetworkIdle') {
      await page.waitForNetworkIdle();
      continue;
    }

    if (type === 'wait') {
      if (step.selector) {
        await page.waitForSelector(step.selector, { timeout: step.wait || WaitForSelectorOption.TIMEOUT });
      }
      continue;
    }

    if (type === 'click') {
      const handle = await page.waitForSelector(step.selector, { visible: true, timeout: step.wait || WaitForSelectorOption.TIMEOUT });
      if (options?.debugScreenshot) {
        await page.screenshot({ path: `${options.timestamp}-${Config.BRAND?.toUpperCase() || 'SCRAPER'}-${currentScreenshotCount}-before-json-click.png` });
        currentScreenshotCount++;
      }
      await handle.click();
      continue;
    }

    if (type === 'get') {
      const variable = (step.variable || '').toString().toUpperCase();
      if (['ITEM', 'MODEL', 'PRICE', 'LINK'].includes(variable)) {
        overrides[variable] = step.selector;
      }
      continue;
    }
  }
  return { overrides, screenshotCount: currentScreenshotCount };
}

const getElements = async () => {
  let browser;
  try {
    browser = await puppeteer.launch(browserOptions);
    const page = await browser.newPage();
    const data = [];
    const timestamp = new Date().toISOString().substring(0, 19).replace('T', '-');
    let screenshotCount = 0;

    await page.setViewport({width: Viewport.WIDTH, height: Viewport.HEIGHT});

    const response = await page.goto(Config.URL, {
      // Если используется SCRAPE_JSON, позволим странице полностью загрузиться,
      // иначе поведение по старой логике
      waitUntil: Config.SCRAPE_JSON ? WaitUntil.FULL : (Config.CLICK_SELECTOR ? WaitUntil.DOM : WaitUntil.FULL),
      timeout: ResponseOption.TIMEOUT,
    });
  
    if (!response.ok()) {
      throw new Error(`${Config.BRAND.toUpperCase()}: Статус загрузки страницы: ${response.status()}`);
    }

    await page.waitForNetworkIdle();

    if (DEBUG_SCREENSHOT) {
      await page.screenshot({ path: `${timestamp}-${Config.BRAND.toUpperCase()}-${screenshotCount}-after-wait.png` });
      screenshotCount++;
    }  

    // Подготовим рантайм-селекторы (могут быть переопределены SCRAPE_JSON)
    const RuntimeSelectors = {
      ITEM: Config.ITEM,
      PRICE: Config.PRICE,
      MODEL: Config.MODEL,
      LINK: Config.LINK,
    };

    // Если переданы JSON-шаги, выполняем их и переопределяем селекторы
    const steps = loadScrapeStepsFromEnv();
    if (steps && Array.isArray(steps)) {
      const result = await runScrapeSteps(page, steps, {
        debugScreenshot: DEBUG_SCREENSHOT,
        timestamp,
        screenshotCount,
      });
      // Обновим счётчик скриншотов
      screenshotCount = result.screenshotCount;

      RuntimeSelectors.ITEM = result.overrides.ITEM || RuntimeSelectors.ITEM;
      RuntimeSelectors.MODEL = result.overrides.MODEL || RuntimeSelectors.MODEL;
      RuntimeSelectors.PRICE = result.overrides.PRICE || RuntimeSelectors.PRICE;
      RuntimeSelectors.LINK = result.overrides.LINK || RuntimeSelectors.LINK;
    } else if (Config.CLICK_SELECTOR) {
      // Старая логика клика, если SCRAPE_JSON не используется
      const modelsLink = await page.waitForSelector(Config.CLICK_SELECTOR, { visible: true, timeout: WaitForSelectorOption.TIMEOUT });
      
      if (DEBUG_SCREENSHOT) {
        await page.screenshot({ path: `${timestamp}-${Config.BRAND.toUpperCase()}-${screenshotCount}-before-click.png` });
        screenshotCount++;
      }
      
      await modelsLink.click();
      
      if (Config.WAIT_SELECTOR) {
        await page.waitForSelector(Config.WAIT_SELECTOR, { timeout: WaitForSelectorOption.TIMEOUT });
      }
     
      if (DEBUG_SCREENSHOT) {
        await page.screenshot({ path: `${timestamp}-${Config.BRAND.toUpperCase()}-${screenshotCount}-after-click.png` });
        screenshotCount++;
      }
    }

    const elements = await page.$$(RuntimeSelectors.ITEM);
    if (!elements.length) throw new Error(`${Config.BRAND.toUpperCase()}: Не найдено ни одного элемента.`);
    
    for (const element of elements) {
      const price = await getPrice(element, RuntimeSelectors.PRICE, Config.BRAND);
      const link = RuntimeSelectors.LINK ? await getLink(element, RuntimeSelectors.LINK, Config.BRAND) : null;
      const model = await getModel(element, RuntimeSelectors.MODEL, Config.BRAND, link);
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
    return data;
  } finally {
    if (browser) await browser.close();
  }
};

module.exports = {
  getElements
};