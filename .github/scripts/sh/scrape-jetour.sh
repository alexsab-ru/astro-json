export BRAND='jetour'
export URL="https://jetour-ru.com"
export ITEM_XPATH="//li[contains(@class, 'menu-model-card')]"
export ID_XPATH="concat('jetour-', substring-before(concat(substring-after(.//a[starts-with(@href, '/models/')]/@href, '/models/'), '?'), '?'))"
export MODEL_XPATH=".//div[@class='td-submenu__title']/text()"
export PRICE_XPATH="translate(string(.//div[@class='td-submenu__description']/span[1]/span[1]/text()), translate(string(.//div[@class='td-submenu__description']/span[1]/span[1]/text()), '0123456789', ''), '')"
export LINK_XPATH="substring-before(concat(.//div[contains(@class, 'td-submenu__body')]//a[starts-with(@href, '/models/')]/@href, '?'), '?')"
export OUTPUT_PATHS="./src/jetour.alexsab.ru/data/cars.json"
node .github/scripts/scrape.js
