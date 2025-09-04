export BRAND='knewstar'
export URL="https://knewstar.ru/"
export ITEM_XPATH="//a[contains(@class,'menu-models__item-link')]"
export ID_XPATH="concat('', substring-before(substring-after(./@href, '/models/'),'/'))"
export MODEL_XPATH=".//div[contains(@class, 'menu-models__item-title')]"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'menu-models__item-price')]/text()), translate(string(.//div[contains(@class, 'menu-models__item-price')]/text()), '0123456789', ''), '')"
export LINK_XPATH="./@href"

export ITEM_CSS="div[class='menu-models__item']"
export MODEL_CSS="div[class*='menu-models__item-title']"
export PRICE_CSS="div[class*='menu-models__item-price']"
export LINK_CSS="a"

export OUTPUT_PATHS="./src/knewstar.alexsab.ru/data/cars.json"

# node .github/scripts/scrape.js
node .github/scripts/scrapejs/scrape.js