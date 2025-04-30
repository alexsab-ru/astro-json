export BRAND='wey'
export URL="https://gwm-wey.ru/configurator"
export ITEM_XPATH="//div[contains(concat(' ', normalize-space(@class), ' '), ' main-navigation-widgets__car ')]"
export ID_XPATH="concat('', replace((.//a[starts-with(@href, '/models/')]/@href)[1], '^.*(?:/models/|variant_slug=)', ''))"
export MODEL_XPATH=".//article[@class='main-navigation-widget-card__title']/text()"
export PRICE_XPATH="translate(string(.//article[contains(concat(' ', normalize-space(@class), ' '), ' main-navigation-widget-card__subtitle ')]/article[@class='text']/text()), translate(string(.//article[contains(concat(' ', normalize-space(@class), ' '), ' main-navigation-widget-card__subtitle ')]/article[@class='text']/text()), '0123456789', ''), '')"
export LINK_XPATH="concat('/models/', substring-after(.//a[starts-with(@href, '/models/')]/@href, '/models/'))"
export OUTPUT_PATHS="./src/wey.alexsab.ru/data/cars.json,./src/wey-penza.ru/data/cars.json"
export CLICK_SELECTOR="#__nuxt > div > div.navigation-header > div > div.main-navigation-menu.flex.navigation-header__menu-left > div:nth-child(2)"
export WAIT_SELECTOR="#__nuxt > div > div.navigation-header > div > div.main-navigation-menu.flex.navigation-header__menu-left > div:nth-child(2)"
export WAIT_TIME=1
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
python3 .github/scripts/scrape.py
