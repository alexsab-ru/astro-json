export BRAND='omoda'
export URL="https://omoda.ru/models/"
export ITEM_XPATH="//div[contains(concat(' ', normalize-space(@class), ' '), ' web_block_media-text ')]"
export ID_XPATH="concat('omoda-', substring-before(substring-after(.//div[contains(@class, 'web_block_media-text__btns')]/a/@href, '/models/'), '/'))"
export MODEL_XPATH="substring-before(substring-after(.//div[contains(@class, 'web_block_media-text__btns')]/a/@href, '/models/'), '/')"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'web_block_media-text__text')]/h3/text()), translate(string(.//div[contains(@class, 'web_block_media-text__text')]/h3/text()), '0123456789', ''), '')"
export LINK_XPATH=".//div[contains(@class, 'web_block_media-text__btns')]/a/@href"
export OUTPUT_PATHS="./src/omoda-ulyanovsk.ru/data/cars.json,./src/omoda.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrape.js