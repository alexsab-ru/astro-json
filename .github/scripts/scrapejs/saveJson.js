const fs = require('fs');

const WriteFileConfig = {
  JSON_INDENT_SIZE: 2,
  CHARSET: 'utf-8'
};

const saveJson = (data, paths) => {
  for (const path of paths) {
    console.log('Сохраняю данные по пути: ', path);
    fs.writeFileSync(path, JSON.stringify(data, null, WriteFileConfig.JSON_INDENT_SIZE), WriteFileConfig.CHARSET);
  }
};

module.exports = {
  saveJson,
};