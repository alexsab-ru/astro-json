export BRAND='vgv'
export URL="https://vgvmotor.ru/models/"
export ITEM_XPATH="//div[contains(concat(' ', normalize-space(@class), ' '), ' home-models__item ')]"
export ID_XPATH="concat('vgv-', substring-before(substring-after(.//div[contains(@class, 'model-preview__button-wrap')]/a/@href, '/models/'), '/'))"
export MODEL_XPATH=".//div[contains(concat(' ', normalize-space(@class), ' '), ' model-preview__title ')]/text()"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'model-preview__subtitle')]), translate(string(.//div[contains(@class, 'model-preview__subtitle')]), '0123456789', ''), '')"
export LINK_XPATH=".//div[contains(@class, 'model-preview__button-wrap')]/a/@href"
export OUTPUT_PATHS="./src/vgv.alexsab.ru/data/cars.json"
node .github/scripts/scrape.js