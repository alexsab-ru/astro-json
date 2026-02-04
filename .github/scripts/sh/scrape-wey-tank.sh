export BRAND='wey'
export URL="https://tank.ru/"
export ITEM_XPATH="//div[contains(@class, 'main-page-model-item')]"
export ID_XPATH="concat('wey-', substring-after(.//*[contains(concat(' ', normalize-space(@class), ' '), ' car-info-title ')]//text(), 'WEY '))"
export MODEL_XPATH="concat('WEY ', substring-after(.//*[contains(concat(' ', normalize-space(@class), ' '), ' car-info-title ')]//text(), 'WEY '))"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'car-info-price')]/span/b), translate(string(.//div[contains(@class, 'car-info-price')]/span/b), '0123456789', ''), '')"
export LINK_XPATH=".//a[contains(@class, 'car-info-btn') and contains(@class, 'text-black')]/@href"
export OUTPUT_PATHS="./src/wey.alexsab.ru/data/cars.json"
node .github/scripts/scrape.js