export BRAND='jac'
export URL="https://jaccar.ru"
export ITEM_XPATH="//li[contains(@class, 'menu-models__item')]"
export ID_XPATH="concat('jac-', substring-before(substring-after(.//a[contains(@class, 'js-menu-models-link')]/@href, '/models/'), '/'))"
export MODEL_XPATH="substring-after(.//div[contains(@class, 'menu-models__item-title')]/text(), 'JAC ')"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'menu-models__item-price')]/text()), translate(string(.//div[contains(@class, 'menu-models__item-price')]/text()), '0123456789', ''), '')"
export LINK_XPATH="./a[contains(@class, 'js-menu-models-link')]/@href"
export OUTPUT_PATHS="./src/jac-samara.ru/data/cars.json,./src/jac.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrape.js
