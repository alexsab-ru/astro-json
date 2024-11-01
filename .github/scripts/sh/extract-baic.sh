export BRAND='baic'
export URL='http://baic-auto.ru/models/'
export REGEXP='\$\{JSON\.stringify\((\{"menuType":.*)\).replace\('
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
export OUTPUT_PATHS="./src/baic-alpha.ru/data/cars.json,./src/baic-krasnodar.ru/data/cars.json,./src/baic-samara.ru/data/cars.json"
node .github/scripts/extractData.js
