export BRAND='chery'
export URL="https://www.chery.ru/models/"
export ITEM_XPATH="//div[contains(concat(' ', normalize-space(@class), ' '), ' js-menu-models-desc menu-models__desc-wrap ')]"
export ID_XPATH="concat('chery-', substring-before(substring-after(.//div[contains(@class, 'menu-models__desc-btns')]/a[@href[starts-with(.,'/models/')]]/@href, '/models/'), '/'))"
export MODEL_XPATH=".//div[contains(concat(' ', normalize-space(@class), ' '), ' menu-models__desc-title ')]"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'menu-models__desc-price')]/text()), translate(string(.//div[contains(@class, 'menu-models__desc-price')]/text()), '0123456789', ''), '')"
export LINK_XPATH=".//div[contains(@class, 'menu-models__desc-btns')]/a[2]/@href"
export ITEM_CSS="div[class*='menu-models__desc-wrap']"
export MODEL_CSS="div[class*='menu-models__desc-title']"
export PRICE_CSS="div[class*='menu-models__desc-price']"
export LINK_CSS="a[class*='btn_secondary']"
export OUTPUT_PATHS="./src/chery.alexsab.ru/data/cars.json,./tmp/atkmotors-vostok.ru/data/chery.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrapejs/scrape.js
