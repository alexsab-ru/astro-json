export BRAND='knewstar'
export URL="https://knewstar.ru/"
export ITEM_XPATH="//a[contains(@class,'menu-models__item-link')]"
export ID_XPATH="concat('', substring-before(substring-after(./@href, '/models/'),'/'))"
export MODEL_XPATH=".//div[contains(@class, 'menu-models__item-title')]"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'menu-models__item-price')]/text()), translate(string(.//div[contains(@class, 'menu-models__item-price')]/text()), '0123456789', ''), '')"
export LINK_XPATH="./@href"
export OUTPUT_PATHS="./src/knewstar.alexsab.ru/data/cars.json"
node .github/scripts/scrape.js