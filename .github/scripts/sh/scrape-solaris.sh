export BRAND='solaris'
export URL="https://solaris.auto/"
export ITEM_XPATH="//a[contains(@class, 'openModelsMenu_item__8q8vd')]"
export ID_XPATH="concat('', substring-after(./@href, '/models/'))"
export MODEL_XPATH=".//p[contains(@class, 'uppercase')]/text()"
export PRICE_XPATH="translate(string(.//p[contains(@class, 'openModelsMenu_price__2HwTS')]/text()), translate(string(.//p[contains(@class, 'openModelsMenu_price__2HwTS')]/text()), '0123456789', ''), '')"
export LINK_XPATH="./@href"
export OUTPUT_PATHS="./src/solaris.alexsab.ru/data/cars.json,./src/solaris-krasnodar-autoholding.ru/data/cars.json"
export CLICK_SELECTOR="body > main > header > div > div.nYHeader_content__h_M7I.landing-section > nav > button:nth-child(1)"
export WAIT_SELECTOR="body > main > header > div > div.nYHeader_content__h_M7I.landing-section > nav > button:nth-child(1)"
export WAIT_TIME=1
python3 .github/scripts/scrape.py
