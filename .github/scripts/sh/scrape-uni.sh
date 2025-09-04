export BRAND='changan'
export URL="https://uni-motors.ru/model"
export ITEM_XPATH="//div[@itemtype='http://schema.org/Offer']"
export ID_XPATH="concat('changan-', substring-after(./a[contains(@href,'https://uni-motors.ru/model/')]/@href, '/model/'))"
export MODEL_XPATH="translate(substring-after(./a[contains(@href,'https://uni-motors.ru/model/')]/@href, '/model/'),'abcdefghijklmnopqrstuvwxyz','ABCDEFGHIJKLMNOPQRSTUVWXYZ')"
export PRICE_XPATH=".//meta[@itemprop='price']/@content"
export LINK_XPATH=".//a[contains(@href,'https://uni-motors.ru/model/')]/@href"
export OUTPUT_PATHS="./src/uni.alexsab.ru/data/cars.json"
node .github/scripts/scrape.js