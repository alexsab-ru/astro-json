export BRAND='kaiyi'
export URL='https://kaiyi-auto.ru/models/'
export REGEXP='\$\{JSON\.stringify\((\{"menuType":.*)\).replace\('
export OUTPUT_PATHS="./src/kaiyi.alexsab.ru/data/cars.json"
node .github/scripts/extractDataUPDAuto.js
