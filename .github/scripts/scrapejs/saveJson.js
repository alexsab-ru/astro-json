const { JSON_INDENT_SIZE } = require('./variables');
const fs = require('fs');

const saveJson = (data, paths) => {
  for (const path of paths) {
    console.log('Сохраняю данные по пути: ', path);
    fs.writeFileSync(path, JSON.stringify(data, null, JSON_INDENT_SIZE), 'utf-8');
  }
};

module.exports = {
  saveJson,
};