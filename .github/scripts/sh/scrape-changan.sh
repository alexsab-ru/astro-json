export BRAND='changan'
export URL="https://changanauto.ru/models/"
export ITEM_XPATH="//a[contains(@class,'card_bg-hover')]"
export ID_XPATH="concat('changan-', substring-before(substring-after(@href, '/models/'),'/'))"
export MODEL_XPATH=".//span[contains(@class,'card__info-title')]/text()"
export ITEM_CSS="a[class='flex-list__item flex-list__item_third']"
export MODEL_CSS="span[class='card__info-title']"
export PRICE_CSS="span[class='card__info-title']+span"
export LINK_CSS="a[class='flex-list__item flex-list__item_third']"
export PRICE_XPATH="translate(string(.//span[contains(@class,'card__info-title')]/following-sibling::span[1]/text()), translate(string(.//span[contains(@class,'card__info-title')]/following-sibling::span[1]/text()), '0123456789', ''), '')"

export LINK_XPATH="./@href"
export OUTPUT_PATHS="./tmp/auto-team.pro/data/changan.json,./tmp/atkmotors-vostok.ru/data/changan.json,./src/changan.alexsab.ru/data/cars.json"
node .github/scripts/scrapejs/scrape.js
