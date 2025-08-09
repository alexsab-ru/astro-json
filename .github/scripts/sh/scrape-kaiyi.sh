export BRAND='kaiyi'
export URL='https://kaiyi-auto.ru/models/'
export REGEXP='\$\{JSON\.stringify\((\{"menuType":.*)\).replace\('
export CLICK_SELECTOR="ul[class='n103-00__list']>li:first-child>a"
export ITEM_CSS="div[class='u123-03__item']"
export MODEL_CSS="div[class='u105-00__text h5']"
export PRICE_CSS="span[class='u114-00__price']"
export LINK_CSS="a"
export OUTPUT_PATHS="./src/kaiyi-alpha.ru/data/cars.json,./src/kaiyi-krd.ru/data/cars.json,./src/kaiyi-samara.ru/data/cars.json,./src/kaiyi.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/extractDataUPDAuto.js
# node .github/scripts/scrapejs/scrape.js
