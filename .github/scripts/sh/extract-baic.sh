export BRAND='baic'
export URL='http://baic-auto.ru/models/'
export REGEXP='\$\{JSON\.stringify\((\{"menuType":.*)\).replace\('
export OUTPUT_PATHS="./src/baic-alpha.ru/data/cars.json,./src/baic-krasnodar.ru/data/cars.json,./src/baic-samara.ru/data/cars.json,./src/baic.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/extractDataUPDAuto.js
