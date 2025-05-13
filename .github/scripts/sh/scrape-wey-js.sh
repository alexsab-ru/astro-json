export BRAND='wey'
export URL="https://gwm-wey.ru/configurator"
export ITEM_XPATH="//div[contains(concat(' ', normalize-space(@class), ' '), ' car-card ')]"
export ID_XPATH="concat('wey-', substring-after(./a[starts-with(@href, '/configurator/')]/@href, '/configurator/'))"
export MODEL_XPATH=".//h3[contains(concat(' ', normalize-space(@class), ' '), ' car-card__title ')]/p/text()"
export PRICE_XPATH="translate(string(.//article[contains(concat(' ', normalize-space(@class), ' '), ' car-card__subtitle ')]/p/text()), translate(string(.//article[contains(concat(' ', normalize-space(@class), ' '), ' car-card__subtitle ')]/p/text()), '0123456789', ''), '')"
export LINK_XPATH="concat('/models/', substring-after(./a[starts-with(@href, '/configurator/')]/@href, '/configurator/'))"
export OUTPUT_PATHS="./src/wey.alexsab.ru/data/cars.json,./src/wey-penza.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrape.js