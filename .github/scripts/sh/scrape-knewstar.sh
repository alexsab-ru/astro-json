export BRAND='knewstar'
export URL="https://knewstar.ru/"
export ITEM_XPATH="//a[contains(concat(' ', normalize-space(@class), ' '), ' v2-menu-curtain-automobiles__item ')]"
export ID_XPATH="substring-after(.//a[contains(concat(' ', normalize-space(@class), ' '), ' v2-menu-curtain-automobiles__item ')]/@href, '/model/')"
export MODEL_XPATH="substring-after(.//a[contains(concat(' ', normalize-space(@class), ' '), ' v2-menu-curtain-automobiles__item ')]/@href, '/model/knewstar-')"
export PRICE_XPATH="translate(string(.//p[contains(@class, 'v2-automobile-menu-card__paragraph')]/text()), translate(string(.//p[contains(@class, 'v2-automobile-menu-card__paragraph')]/text()), '0123456789', ''), '')"
export LINK_XPATH=".//a[contains(concat(' ', normalize-space(@class), ' '), ' v2-menu-curtain-automobiles__item ')]/@href"
export OUTPUT_PATHS="./src/knewstar.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrape.js