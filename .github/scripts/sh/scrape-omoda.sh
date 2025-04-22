export BRAND='omoda'
export URL="https://omoda.ru/models/"
export ITEM_XPATH="//li[contains(concat(' ', normalize-space(@class), ' '), ' menu-models__item ')]"
export ID_XPATH="concat('omoda-', substring-before(substring-after(.//a[contains(@class, 'menu-models__item-link')]/@href, '/models/model'), '/'))"
export MODEL_XPATH="substring-before(substring-after(.//a[contains(@class, 'menu-models__item-link')]/@href, '/models/model'), '/')"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'menu-models__item-price')]/text()), translate(string(.//div[contains(@class, 'menu-models__item-price')]/text()), '0123456789', ''), '')"
export LINK_XPATH=".//a[contains(@class, 'menu-models__item-link')]/@href"
export OUTPUT_PATHS="./src/omoda-ulyanovsk.ru/data/cars.json,./src/omoda.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrape.js