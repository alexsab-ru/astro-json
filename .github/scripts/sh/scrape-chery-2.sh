export BRAND='chery'
export URL="https://www.chery.ru/models/"
export ITEM_XPATH="//div[contains(concat(' ', normalize-space(@class), ' '), ' web_block_flow ')]/div/div/div"
export ID_XPATH="concat('chery-', substring-before(substring-after(./div/a/@href, '/models/'), '/'))"
export MODEL_XPATH="normalize-space(.//div[contains(concat(' ', normalize-space(@class), ' '), ' text-block-flow__title ')]/text()[1])"
export PRICE_XPATH="translate(string(.//div[contains(concat(' ', normalize-space(@class), ' '), ' text-block-flow__title ')]/text()[2]), translate(string(.//div[contains(concat(' ', normalize-space(@class), ' '), ' text-block-flow__title ')]/text()[2]), '0123456789', ''), '')"
export LINK_XPATH="./div/a/@href"
export OUTPUT_PATHS="./src/chery.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrape.js
