export BRAND='jaecoo'
export URL="https://jaecoo.ru/models/"
export ITEM_XPATH="//li[contains(concat(' ', normalize-space(@class), ' '), ' menu-models__item ')]"
export ID_XPATH="concat('jaecoo-', substring-before(substring-after(.//a[contains(@class, 'menu-models__item-link')]/@href, '/models/'), '/'))"
export MODEL_XPATH=".//div[contains(@class, 'menu-models__item-title')]/text()"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'menu-models__item-price')]/text()), translate(string(.//div[contains(@class, 'menu-models__item-price')]/text()), '0123456789', ''), '')"
export LINK_XPATH=".//a[contains(@class, 'menu-models__item-link')]/@href"
export OUTPUT_PATHS="./src/jaecoo-ulyanovsk.ru/data/cars.json,./src/jaecoo.alexsab.ru/data/cars.json"
node .github/scripts/scrape.js