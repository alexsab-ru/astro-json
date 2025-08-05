const Selector = {
  IMG: 'img',
};

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
};

const ResponseOption = {
  TIMEOUT: 60000,
  TIMEOUT_BETWEEN_RETRIES: 2000,
  MAX_RETRIES: 3
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

module.exports = {
  Selector,
  BrowserOption,
  Viewport,
  Platform,
  ResponseOption,
  WaitForSelectorOption,
  WaitUntil,
};