export BRAND='livan'
export URL="https://livan-motors.ru/model/"
export ITEM_XPATH="//img[starts-with(@src, 'https://livan-motors.ru/storage/model')]/parent::*"
export ID_XPATH="concat('livan-', substring-before(substring-after(./a[contains(text(),'Подробнее')][starts-with(@href, 'https://livan-motors.ru/model/')]/@href, '/model/'), '/'))"
export MODEL_XPATH="substring-after(./div[@class='text-xl leading-none mb-6']/text(),'LIVAN ')"
export PRICE_XPATH="translate(string(./div[@class='text-sm mb-6']/text()), translate(string(./div[@class='text-sm mb-6']/text()), '0123456789', ''), '')"
export LINK_XPATH="./a[contains(text(),'Подробнее')][starts-with(@href, 'https://livan-motors.ru/model/')]/@href"
export ITEM_CSS="div[class='flex flex-col items-center']"
export MODEL_CSS="div[class*='text-xl']"
export PRICE_CSS="div[class*='text-sm']"
export LINK_CSS="a"
export OUTPUT_PATHS="./src/livan-samara.ru/data/cars.json,./src/livanorenburg.ru/data/cars.json,./src/livan.alexsab.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrapejs/scrape.js
