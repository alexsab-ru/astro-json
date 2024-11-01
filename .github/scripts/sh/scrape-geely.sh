export BRAND='geely'
export URL="https://www.geely-motors.com"
export ITEM_XPATH="//a[contains(@class,'v2-menu-curtain-automobiles__item')]"
export ID_XPATH="concat('geely-', substring(substring-after(./@href, '/model/'), 1 + 6 * starts-with(substring-after(./@href, '/model/'), 'geely-')))"
export MODEL_XPATH="./div/h4[@class='v2-automobile-menu-card__heading']/text()"
export PRICE_XPATH="translate(string(./div/p[@class='v2-automobile-menu-card__paragraph']/text()), translate(string(./div/p[@class='v2-automobile-menu-card__paragraph']/text()), '0123456789', ''), '')"
export LINK_XPATH="./@href"
export OUTPUT_PATHS="./src/geely-partner-orenburg.ru/data/cars.json,./src/geely-partner-samara.ru/data/cars.json,./src/geely-partner-saratov.ru/data/cars.json,./src/geely-partner-vostok.ru/data/cars.json,./tmp/auto-team.pro/data/geely.json"
node .github/scripts/scrape.js
