export BRAND='jetour'
export URL="https://jetour-ru.com"
export ITEM_XPATH="//li[contains(@class, 'menu-model-card')]"
export ID_XPATH="concat('jetour-', substring-before(concat(substring-after(.//a[starts-with(@href, '/models/')]/@href, '/models/'), '?'), '?'))"
export MODEL_XPATH=".//div[@class='td-submenu__title']/text()"
export PRICE_XPATH="translate(string(.//div[@class='td-submenu__description']/span[1]/span[1]/text()), translate(string(.//div[@class='td-submenu__description']/span[1]/span[1]/text()), '0123456789', ''), '')"
export LINK_XPATH="substring-before(concat(.//div[contains(@class, 'td-submenu__body')]//a[starts-with(@href, '/models/')]/@href, '?'), '?')"
export ITEM_CSS="li[class*='menu-model-card']"
export MODEL_CSS="div[class='td-submenu__title']"
export PRICE_CSS="div[class='td-submenu__description']>span>span"
export LINK_CSS="div[class='td-submenu__link']+a"
export OUTPUT_PATHS="./src/jetour-alpha.ru/data/cars.json,./src/jetour-krasnodar.ru/data/cars.json,./src/nika-jetour.alexsab.ru/data/cars.json,./src/jetour.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrapejs/scrape.js
