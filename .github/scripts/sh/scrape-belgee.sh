export BRAND='belgee'
export URL="https://belgee.ru"
export ITEM_XPATH="//header//li[@class='menu-models__item']"
export ID_XPATH="concat('belgee-', substring-before(substring-after(substring-after(.//a[contains(@class,'menu-models__item-btn')]/@href, '/model/'), 'belgee-'), '/'))"
export MODEL_XPATH=".//div[@class='menu-models__item-title h3']/text()"
export PRICE_XPATH="translate(string(.//div[contains(@class,'menu-models__item-price')]/text()), translate(string(.//div[contains(@class,'menu-models__item-price')]/text()), '0123456789', ''), '')"
export LINK_XPATH=".//a[@class='btn btn_secondary menu-models__item-btn']/@href"
export OUTPUT_PATHS="./src/belgee.alexsab.ru/data/cars.json"
node .github/scripts/scrape.js
