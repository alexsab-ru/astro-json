export BRAND='chery'
export URL="https://www.chery.ru/models/"
export ITEM_XPATH="//div[contains(concat(' ', normalize-space(@class), ' '), ' js-menu-models-desc menu-models__desc-wrap ')]"
export ID_XPATH="concat('chery-', substring-before(substring-after(.//div[contains(@class, 'menu-models__desc-btns')]/a[2]/@href, '/models/'), '/'))"
export MODEL_XPATH="substring-before(substring-after(.//div[contains(@class, 'menu-models__desc-btns')]/a[2]/@href, '/models/'), '/')"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'menu-models__desc-price')]/text()), translate(string(.//div[contains(@class, 'menu-models__desc-price')]/text()), '0123456789', ''), '')"
export LINK_XPATH=".//div[contains(@class, 'menu-models__desc-btns')]/a[2]/@href"
export OUTPUT_PATHS="./src/chery.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrape.js

/html/body/main/div[2]/div/div/div[1]