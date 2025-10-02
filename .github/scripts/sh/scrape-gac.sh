export BRAND='gac'
# export URL="https://models.gac.alexsab.ru/models"
export URL="https://gac.ru/models"

# export ITEM_XPATH="//div[@class='td-models-grid__item']"
# export ID_XPATH="concat('gac-', substring-after(.//a[starts-with(@href, '/models/')]/@href, '/models/'))"
# export MODEL_XPATH="substring-after(.//a[starts-with(@href, '/models/')]/@href, '/models/')"
# export PRICE_XPATH="translate(string(.//span[@class='price']/text()[1]), translate(string(.//span[@class='price']/text()[1]), '0123456789', ''), '')"
# export LINK_XPATH=".//a[starts-with(@href, '/models/')]/@href"

export ITEM_XPATH="//div[@class='td-models-menu__about-model']"
export ID_XPATH="concat('gac-', substring-after(.//a[starts-with(@href, '/models/')]/@href, '/models/'))"
export MODEL_XPATH="./@id"
export PRICE_XPATH="translate(string(.//div[@class='td-about-model__price']/text()), translate(string(.//div[@class='td-about-model__price']/text()), '0123456789', ''), '')"
export LINK_XPATH=".//a[starts-with(@href, '/models/')]/@href"

export OUTPUT_PATHS="./src/gac.alexsab.ru/data/cars.json,./src/gac-smr.alexsab.ru/data/cars.json,./src/gac-orenburg.alexsab.ru/data/cars.json,./src/gac-stavauto.alexsab.ru/data/cars.json,./src/gac-partner-samara.alexsab.ru/data/cars.json,./src/gac-samara.ru/data/cars.json,./src/gac-armada-avto.ru/data/cars.json"
python3 .github/scripts/scrape.py
