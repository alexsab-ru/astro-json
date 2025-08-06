const fs = require('fs');
const path = require('path');

const WriteFileConfig = {
  JSON_INDENT_SIZE: 2,
  CHARSET: 'utf-8'
};

const FileName = {
  ORIGINAL: 'cars.json',
  COPY: 'federal-models_price.json'
};

const checkDirectory = (filePath) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  fs.mkdirSync(dirname, { recursive: true });
};

const saveJson = (data, paths) => {
  for (const path of paths) {
    checkDirectory(path);
    console.log('Сохраняю данные по пути: ', path);
    fs.writeFileSync(path, JSON.stringify(data, null, WriteFileConfig.JSON_INDENT_SIZE), WriteFileConfig.CHARSET);
    const copyPath = path.replace(FileName.ORIGINAL, FileName.COPY);
    console.log(`Создаю копию файла: ${copyPath}`);
    fs.copyFileSync(path, copyPath);
  }
};

module.exports = {
  saveJson,
};