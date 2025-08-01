export BRAND='geely'
export URL="https://www.geely-motors.com"
export ITEM_XPATH="//div[@class='menu__models-item']"
export ID_XPATH="concat('geely-', substring-before(substring(substring-after(./a/@href, '/model/'), 1 + 6 * starts-with(substring-after(./a/@href, '/model/'), 'geely-')), '/'))"
export MODEL_XPATH=".//div[contains(concat(' ', normalize-space(@class), ' '), ' menu__models-item-title ')]/text()"
export PRICE_XPATH="translate(string(.//div[contains(concat(' ', normalize-space(@class), ' '), ' menu__models-item-price ')]/text()), translate(string(.//div[contains(concat(' ', normalize-space(@class), ' '), ' menu__models-item-price ')]/text()), '0123456789', ''), '')"
export LINK_XPATH="./a/@href"
export ITEM_CSS="div[class='menu__models-item']"
export MODEL_CSS="div[class='menu__models-item-title']"
export PRICE_CSS="div[class*='menu__models-item-price']"
export LINK_CSS="a[class*='menu__models-item-link']"
export OUTPUT_PATHS="./src/geely-partner-orenburg.ru/data/cars.json,./src/geely-partner-samara.ru/data/cars.json,./src/geely-partner-saratov.ru/data/cars.json,./src/geely-partner-vostok.ru/data/cars.json,./tmp/auto-team.pro/data/geely.json,./src/geely.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrapejs/scrape.js
