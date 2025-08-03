export BRAND='vgv'
export URL="https://vgvmotor.ru/models/"
export ITEM_XPATH="//div[contains(concat(' ', normalize-space(@class), ' '), ' home-models__item ')]"
export ID_XPATH="concat('vgv-', substring-before(substring-after(.//div[contains(@class, 'model-preview__button-wrap')]/a/@href, '/models/'), '/'))"
export MODEL_XPATH=".//div[contains(concat(' ', normalize-space(@class), ' '), ' model-preview__title ')]/text()"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'model-preview__subtitle')]), translate(string(.//div[contains(@class, 'model-preview__subtitle')]), '0123456789', ''), '')"
export LINK_XPATH=".//div[contains(@class, 'model-preview__button-wrap')]/a/@href"
export ITEM_CSS="div[class='home-models__item']"
export MODEL_CSS="div[class*='model-preview__title']"
export PRICE_CSS="div[class*='model-preview__subtitle']"
export LINK_CSS="a"
export OUTPUT_PATHS="./src/vgv-krd.ru/data/cars.json,./src/vgv.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrapejs/scrape.js