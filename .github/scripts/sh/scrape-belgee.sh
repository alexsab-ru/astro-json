export BRAND='belgee'
export URL="https://belgee.ru/about-belgee/"
export ITEM_XPATH="//li[@class='menu-models__item']"
export ID_XPATH="concat('belgee-', substring-before(substring-after(substring-after(./a[@class='btn btn_secondary menu-models__item-btn']/@href, '/model/'), 'belgee-'), '/'))"
export MODEL_XPATH="./div[@class='menu-models__item-title h3']/text()"
export PRICE_XPATH="translate(string(./div[@class='menu-models__item-price caps mb-green']/text()), translate(string(./div[@class='menu-models__item-price caps mb-green']/text()), '0123456789', ''), '')"
export LINK_XPATH="./a[@class='btn btn_secondary menu-models__item-btn']/@href"
export ITEM_CSS="li[class='menu-models__item']"
export MODEL_CSS="div[class*='menu-models__item-title']"
export PRICE_CSS="div[class*='menu-models__item-price']"
export LINK_CSS="a[class*='menu-models__item-btn']"
export OUTPUT_PATHS="./src/belgee-orenburg.ru/data/cars.json,./src/belgee-smr.ru/data/cars.json,./src/belgee-partner-saratov.ru/data/cars.json,./src/belgee-samara.ru/data/cars.json,./tmp/auto-team.pro/data/belgee.json,./src/belgee.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrapejs/scrape.js
