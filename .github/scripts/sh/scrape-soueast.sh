export BRAND='soueast'
export URL="https://soueast.ru/block?key=obertka-dlya-modelnyj-ryad-animirovannyj_5VAQ&id=186&cache=1"
export ITEM_XPATH="//div[contains(@class, 'td-model-card__content')]"
export ID_XPATH="concat('soueast-', substring-after(.//div[contains(@class, 'td-model-card__btns')]/a/@href, '/'))"
export MODEL_XPATH=".//div[contains(@class, 'td-model-card__head')]//div[contains(@class, 'td-model-card__title')]"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'td-model-card__price-wrap')]/div/text()[1]), translate(string(.//div[contains(@class, 'td-model-card__price')]/div/text()[1]), '0123456789', ''), '')"
export LINK_XPATH=".//div[contains(@class, 'td-model-card__btns')]/a/@href"
export OUTPUT_PATHS="./src/soueast.alexsab.ru/data/cars.json"
node .github/scripts/scrape.js