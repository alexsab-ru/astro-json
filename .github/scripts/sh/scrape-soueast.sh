export BRAND='soueast'
export URL="https://soueast.ru/models"
export ITEM_XPATH="//div[contains(@class, 'td-model-card__content')]"
export ID_XPATH="concat('soueast-', substring-after(.//div[contains(@class, 'td-model-card__btns')]/a/@href, '/'))"
export MODEL_XPATH=".//div[contains(@class, 'td-model-card__head')]//div[contains(@class, 'td-model-card__title')]"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'td-model-card__price-wrap')]/div/text()[1]), translate(string(.//div[contains(@class, 'td-model-card__price')]/div/text()[1]), '0123456789', ''), '')"
export LINK_XPATH=".//div[contains(@class, 'td-model-card__btns')]/a/@href"
export ITEM_CSS="div[class='td-models-grid__item']"
export MODEL_CSS="span[class='td-model-card__name']"
export PRICE_CSS="div[class='td-model-card__price']"
export LINK_CSS="a[class*='td-btn td-btn-tertiary']"
export OUTPUT_PATHS="./src/soueast.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrapejs/scrape.js