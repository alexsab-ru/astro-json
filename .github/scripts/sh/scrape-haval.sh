export BRAND='haval'
export URL="https://haval.ru/models/"
export ITEM_XPATH="//li[contains(concat(' ', normalize-space(@class), ' '), ' web_block_models__item ')]"
export ID_XPATH="concat('haval-', replace(substring-before(substring-after((.//div[contains(@class, 'web_block_models__item-btn')]/a/@href)[1], '/models/'), '/'), '(haval-)', ''))"
export MODEL_XPATH="replace((.//div[contains(concat(' ', normalize-space(@class), ' '), ' web_block_models__item-title ')]/text()), 'НОВЫЙ1 ', '')"
export PRICE_XPATH="translate(string(substring-before(.//div[contains(@class, 'web_block_models__item-price')], '₽')), translate(string(substring-before(.//div[contains(@class, 'web_block_models__item-price')], '₽')), '0123456789', ''), '')"
export LINK_XPATH=".//div[contains(@class, 'web_block_models__item-btn')]/a/@href"
export OUTPUT_PATHS="./src/haval.alexsab.ru/data/cars.json"
export WAIT_TIME=1
python3 .github/scripts/scrape.py