export BRAND='changan'
export URL="https://changanauto.ru/model"
export ITEM_XPATH="//div[@class='flex flex-col justify-between']"
export ID_XPATH="concat('changan-', substring-after(.//a/@href, '/model/'))"
export MODEL_XPATH=".//div[contains(@class,'text-subheading-bold-24')]/text()"
export PRICE_XPATH="translate(string(.//div[contains(@class,'text-simple-14')]/text()), translate(string(.//div[contains(@class,'text-simple-14')]/text()), '0123456789', ''), '')"
export LINK_XPATH=".//a/@href"
export OUTPUT_PATHS="./src/changan.alexsab.ru/data/cars.json"
node .github/scripts/scrape.js
# https://models.changan.alexsab.ru/model
# JSON.parse(document.querySelector("#app").dataset.page)
