export BRAND='baic'
export URL='http://baic-auto.ru/models/'
export REGEXP='\$\{JSON\.stringify\((\{"menuType":.*)\).replace\('
export CLICK_SELECTOR="ul[class='n103-00__list']>li:first-child>a"
export WAIT_SELECTOR="div[class='u123-03__row']"
export ITEM_CSS="div[class='u123-03__item']"
export MODEL_CSS="div[class='u105-00__text h6']"
export PRICE_CSS="span[class='u114-00__price']"
export LINK_CSS="a"
export OUTPUT_PATHS="./src/baic-alpha.ru/data/cars.json,./src/baic-krasnodar.ru/data/cars.json,./src/baic-samara.ru/data/cars.json,./src/baic.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
# node .github/scripts/extractDataUPDAuto.js
node .github/scripts/scrapejs/scrape.js
