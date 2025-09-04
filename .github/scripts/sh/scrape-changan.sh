export BRAND='changan'
export URL="https://changanauto.ru/model/"
export ITEM_XPATH="//div[@class='flex flex-col justify-between']"
export ID_XPATH="concat('changan-', substring-after(.//a/@href, '/model/'))"
export MODEL_XPATH=".//div[contains(@class,'text-subheading-bold-24')]/text()"
export PRICE_XPATH="translate(string(.//div[contains(@class,'text-simple-14')]/text()), translate(string(.//div[contains(@class,'text-simple-14')]/text()), '0123456789', ''), '')"
export LINK_XPATH=".//a/@href"
export ITEM_CSS="div[class='flex flex-col justify-between']"
export MODEL_CSS="div[class='text-subheading-bold-24 lg:text-subheading-bold-32 mb-2 text-center']"
export PRICE_CSS="div[class='text-center text-simple-14 lg:text-simple-16 mb-4 lg:mb-6"
export LINK_CSS="a"

export OUTPUT_PATHS="./src/changan.alexsab.ru/data/cars.json"
node .github/scripts/scrapejs/scrape.js
