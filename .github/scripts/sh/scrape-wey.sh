export BRAND='wey'
export URL="https://gwm-wey.ru/configurator"
export ITEM_XPATH="//div[contains(concat(' ', normalize-space(@class), ' '), ' main-navigation-widgets__car ')]"
export ID_XPATH="concat('', replace((.//a[starts-with(@href, '/models/')]/@href)[1], '^.*(?:/models/|variant_slug=)', ''))"
export MODEL_XPATH=".//article[@class='main-navigation-widget-card__title']/text()"
export PRICE_XPATH="translate(string(.//article[contains(concat(' ', normalize-space(@class), ' '), ' main-navigation-widget-card__subtitle ')]/article[@class='text']/text()), translate(string(.//article[contains(concat(' ', normalize-space(@class), ' '), ' main-navigation-widget-card__subtitle ')]/article[@class='text']/text()), '0123456789', ''), '')"
export LINK_XPATH="concat('/models/', substring-after(.//a[starts-with(@href, '/models/')]/@href, '/models/'))"
export OUTPUT_PATHS="./src/wey.alexsab.ru/data/cars.json,./src/wey-penza.ru/data/cars.json"
export CLICK_SELECTOR="div[class='main-navigation-menu__item']:nth-child(2)"
export WAIT_SELECTOR="div[class*='navigation-header__submenu-container']"
export ITEM_CSS="div[class*='main-navigation-widgets__car']"
export MODEL_CSS="article[class='main-navigation-widget-card__title']"
export PRICE_CSS="article[class='main-navigation-widget-card__subtitle'] article[class='text']"
export LINK_CSS="a[class*='main-navigation-widget-car__link']"
export WAIT_TIME=1
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
# python3 .github/scripts/scrape.py
node .github/scripts/scrapejs/scrape.js
