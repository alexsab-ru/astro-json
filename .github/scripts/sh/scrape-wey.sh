export BRAND='wey'
export URL="https://gwm-wey.ru/"
export ITEM_XPATH="//*[@id='car-variants']//div[contains(@class, 'swiper-slide')]"
export ID_XPATH="replace((.//a[starts-with(@href, '/models/')]/@href)[1], '^.*(?:/models/|variant_slug=)', '')"
export MODEL_XPATH=".//article[@class='title']/p/text()"
export PRICE_XPATH="translate(string(.//article[@class='price']/p/text()[1]), translate(string(.//article[@class='price']/p/text()[1]), '0123456789', ''), '')"
export LINK_XPATH="concat('models/', substring-after(.//a[starts-with(@href, '/configurator/')]/@href, '/configurator/'))"
export OUTPUT_PATHS="./src/wey-penza.ru/data/cars.json,./src/wey.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
python3 .github/scripts/scrape.py
