export BRAND='kaiyi'
export URL='https://kaiyi-auto.ru/models/'
export REGEXP='\$\{JSON\.stringify\((\{"menuType":.*)\).replace\('
export OUTPUT_PATHS="./src/kaiyi-alpha.ru/data/cars.json,./src/kaiyi-krd.ru/data/cars.json,./src/kaiyi-samara.ru/data/cars.json,./src/kaiyi.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/extractDataUPDAuto.js
