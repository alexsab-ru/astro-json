export BRAND='haval'
export URL="https://haval.ru/models/"
export ITEM_XPATH="//li[contains(concat(' ', normalize-space(@class), ' '), ' web_block_models__item ')]"
export ID_XPATH="concat('haval-', replace(substring-before(substring-after((.//div[contains(@class, 'web_block_models__item-btn')]/a/@href)[1], '/models/'), '/'), '(haval-)', ''))"
export MODEL_XPATH="replace((.//div[contains(concat(' ', normalize-space(@class), ' '), ' web_block_models__item-title ')]/text()), 'НОВЫЙ1 ', '')"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'web_block_models__item-price')]), translate(string(.//div[contains(@class, 'web_block_models__item-price')]), '0123456789', ''), '')"
export LINK_XPATH=".//div[contains(@class, 'web_block_models__item-btn')]/a/@href"
export ITEM_CSS="li[class*='web_block_models__item']"
export MODEL_CSS="div[class*='web_block_models__item-title']"
export PRICE_CSS="div[class*='web_block_models__item-price']"
export LINK_CSS="a"
export OUTPUT_PATHS="./src/haval-ulyanovsk.ru/data/cars.json,./src/haval.alexsab.ru/data/cars.json"
export WAIT_TIME=1
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
# python3 .github/scripts/scrape.py
node .github/scripts/scrapejs/scrape.js