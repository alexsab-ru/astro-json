export BRAND='belgee'
export URL="https://belgee.ru"
export ITEM_XPATH="//header/div[@data-id='models']/div"
export ID_XPATH="concat('belgee-', substring-after(substring-after(./a/@href, '/model/'), 'belgee-'))"
export MODEL_XPATH="./a/span[@class='title']/text()"
export PRICE_XPATH="translate(string(./a/span[@class='subtitle']/text()), translate(string(./a/span[@class='subtitle']/text()), '0123456789', ''), '')"
export LINK_XPATH="./a/@href"
export OUTPUT_PATHS="./src/belgee-orenburg.ru/data/cars.json,./src/belgee-smr.ru/data/cars.json,./src/belgee-partner-saratov.ru/data/cars.json,./src/belgee-samara.ru/data/cars.json,./tmp/auto-team.pro/data/belgee.json,./src/belgee.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrape.js
