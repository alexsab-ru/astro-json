export BRAND='soueast'
export URL="https://soueast.ru/"
export ITEM_XPATH="//*[@id='widgetBlock_185']/div/div/div[2]/div/div"
export ID_XPATH="concat('soueast-', substring-after(.//div[contains(@class, 'td-model-card__btns')]/a/@href, '/'))"
export MODEL_XPATH="substring-after(.//div[contains(@class, 'td-model-card__btns')]/a/@href, '/')"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'td-model-card__price-wrap')]/div/text()), translate(string(.//div[contains(@class, 'td-model-card__price')]/text()), '0123456789', ''), '')"
export LINK_XPATH=".//div[contains(@class, 'td-model-card__btns')]/a/@href"
export OUTPUT_PATHS="./src/soueast.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrape.js