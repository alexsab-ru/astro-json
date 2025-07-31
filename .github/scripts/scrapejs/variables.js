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
  WIN_PATH: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  DEFAULT_PATH: '/usr/bin/google-chrome',
  TIMEOUT: 60000,
};

const Viewport = {
  WIDTH: 1080,
  HEIGHT: 1024
};

const Platform = {
  WIN: 'win32',
};

const ResponseOption = {
  WAIT_UNTIL: {
    full: 'load', // Полная загрузка страницы (включая CSS, изображения, скрипты).
    dom: 'domcontentloaded', // Быстрое завершение (DOM готов, но ресурсы могут догружаться).
    network0: 'networkidle0', // Нет активных запросов (хорош для SPA и AJAX-сайтов).
    network2: 'networkidle2' // Почти нет запросов (подходит для фоновых процессов).
  },
  TIMEOUT: 60000,
};

const SearchType = {
  XPATH: 'xpath',
  CSS: 'css'
};

module.exports = {
  BrowserOption,
  Viewport,
  Platform,
  ResponseOption,
  SearchType
};