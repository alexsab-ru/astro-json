export BRAND='baic'
export URL='http://baic-auto.ru/models/'
export REGEXP='\$\{JSON\.stringify\((\{"menuType":.*)\).replace\('
export OUTPUT_PATHS="./src/baic.alexsab.ru/data/cars.json"
node .github/scripts/extractDataUPDAuto.js
