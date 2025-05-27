export BRAND='haval'
export URL="https://haval.ru/models/"
export ITEM_XPATH="//li[contains(concat(' ', normalize-space(@class), ' '), ' web_block_models__item ')]"
export ID_XPATH="concat('haval-', substring-before(substring-after(.//div[contains(@class, 'web_block_models__item-btn')]/a/@href, '/models/'), '/'))"
export MODEL_XPATH=".//div[contains(concat(' ', normalize-space(@class), ' '), ' web_block_models__item-title ')]/text()"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'web_block_models__item-price')]), translate(string(.//div[contains(@class, 'web_block_models__item-price')]), '0123456789', ''), '')"
export LINK_XPATH=".//div[contains(@class, 'web_block_models__item-btn')]/a/@href"
export OUTPUT_PATHS="./src/haval-ulyanovsk.ru/data/cars.json,./src/haval.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrape.js