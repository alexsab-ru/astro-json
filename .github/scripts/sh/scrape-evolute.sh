export BRAND='evolute'
export URL="https://www.evolute.ru/models"
export ITEM_XPATH="//div[contains(concat(' ', normalize-space(@class), ' '), ' td-card-widget--models ')]/div"
export ID_XPATH="concat('evolute-', substring-after(.//div[contains(@class, 'td-card-widget__text-wrap')]/a/@href, '/models/'))"
export MODEL_XPATH=".//h2[contains(@class, 'td-card-widget__title')]/text()"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'td-card-widget__description')]/h4/text()), translate(string(.//div[contains(@class, 'td-card-widget__description')]/h4/text()), '0123456789', ''), '')"
export LINK_XPATH=".//div[contains(@class, 'td-card-widget__text-wrap')]/a/@href"
export OUTPUT_PATHS="./src/evolute.alexsab.ru/data/cars.json,./src/evolute.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrape.js