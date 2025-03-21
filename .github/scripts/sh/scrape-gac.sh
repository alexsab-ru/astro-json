export BRAND='gac'
export URL="https://gac.ru/models"
export ITEM_XPATH="//div[@class='td-models-grid__item']"
export ID_XPATH="concat('gac-', substring-after(.//a[starts-with(@href, '/models/')]/@href, '/models/'))"
export MODEL_XPATH="substring-after(.//a[starts-with(@href, '/models/')]/@href, '/models/')"
export PRICE_XPATH="translate(string(.//span[@class='price']/text()), translate(string(.//span[@class='price']/text()), '0123456789', ''), '')"
export LINK_XPATH=".//a[starts-with(@href, '/models/')]/@href"
export OUTPUT_PATHS="./src/gac.alexsab.ru/data/cars.json,./src/gac-smr.alexsab.ru/data/cars.json,./src/gac-orenburg.alexsab.ru/data/cars.json,./src/gac-stavauto.alexsab.ru/data/cars.json,./src/gac-partner-samara.alexsab.ru/data/cars.json,./tmp/auto-team.pro/data/gac.json"
node .github/scripts/scrape.js
