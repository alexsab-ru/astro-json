export BRAND='tank'
export URL="https://tank.ru/"
export ITEM_XPATH="//div[contains(@class, 'main-page-model-item')]"
export ID_XPATH="concat('tank-', substring-after(.//*[contains(concat(' ', normalize-space(@class), ' '), ' car-info__header ')]//h3/text(), 'TANK '))"
export MODEL_XPATH="concat('TANK ', substring-after(.//*[contains(concat(' ', normalize-space(@class), ' '), ' car-info__header ')]//h3/text(), 'TANK '))"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'car-info')]/div[3]/span/b), translate(string(.//div[contains(@class, 'car-info')]/div[3]/span/b), '0123456789', ''), '')"
export LINK_XPATH=".//a[contains(@class, 'car-info-btn') and contains(@class, 'text-black')]/@href"
export OUTPUT_PATHS="./src/tank-penza.ru/data/cars.json,./src/tank.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrape.js