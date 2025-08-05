export BRAND='solaris'
export URL="https://solaris.auto/about-brand"
export ITEM_XPATH="//section[contains(@class, 'ModelSlide_container___a9d3')]"
export ID_XPATH="concat('', substring-after(.//a[contains(@href, 'models/')]/@href, 'models/'))"
export MODEL_XPATH=".//h1[contains(@class, 'ModelSlide_hideInMobile__G9Y_w')]"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'toolpip_container__rHDXy')]/h6/text()[1]), translate(string(.//div[contains(@class, 'toolpip_container__rHDXy')]/h6/text()[1]), '0123456789', ''), '')"
export LINK_XPATH="concat('/models/', substring-after(.//a[contains(@href, 'models/')]/@href, 'models/'))"
export CLICK_SELECTOR="nav[class*='header_right']>button[class*='button_button']"
export ITEM_CSS="ul[class*='openModelsMenu']>li"
export MODEL_CSS="p[class*='p2']"
export PRICE_CSS="p[class*='p4']"
export LINK_CSS="a"
export OUTPUT_PATHS="./src/solaris.alexsab.ru/data/cars.json,./src/solaris-krasnodar-autoholding.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrapejs/scrape.js
