const fs = require('fs');

const ERROR_FILE_NAME = 'output.txt';

const logError = (error) => {
  const timestamp = new Date().toISOString();
  let errorMessage = `[${timestamp}] `;
  errorMessage = `${error}\n`;

  try {
    fs.appendFileSync(ERROR_FILE_NAME, errorMessage);
  } catch (err) {
    console.error('Не удалось записать ошибку в файл:', err);
  }
};

module.exports = {
  logError
};