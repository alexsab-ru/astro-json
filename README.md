# JSON for websites

## Цены с федеральных сайтов

Чтобы получить данные цен с федеральных сайтов можно запустить

```sh
export BRAND='geely'
export URL="https://www.geely-motors.com"
export ITEM_XPATH="//a[contains(@class,'v2-menu-curtain-automobiles__item')]"
export ID_XPATH="concat('geely-', substring(substring-after(./@href, '/model/'), 1 + 6 * starts-with(substring-after(./@href, '/model/'), 'geely-')))"
export MODEL_XPATH="./div/h4[@class='v2-automobile-menu-card__heading']/text()"
export PRICE_XPATH="translate(string(./div/p[@class='v2-automobile-menu-card__paragraph']/text()), translate(string(./div/p[@class='v2-automobile-menu-card__paragraph']/text()), '0123456789', ''), '')"
export LINK_XPATH="./@href"
export OUTPUT_PATHS="./src/geely-partner-orenburg.ru/data/cars.json,./src/geely-partner-samara.ru/data/cars.json,./src/geely-partner-saratov.ru/data/cars.json,./src/geely-partner-vostok.ru/data/cars.json,./tmp/auto-team.pro/data/geely.json"
node .github/scripts/scrape.js
```

```sh
export BRAND='belgee'
export URL="https://belgee.ru"
export ITEM_XPATH="//header/div[@data-id='models']/div"
export ID_XPATH="concat('belgee-', substring-after(substring-after(./a/@href, '/model/'), 'belgee-'))"
export MODEL_XPATH="./a/span[@class='title']/text()"
export PRICE_XPATH="translate(string(./a/span[@class='subtitle']/text()), translate(string(./a/span[@class='subtitle']/text()), '0123456789', ''), '')"
export LINK_XPATH="./a/@href"
export OUTPUT_PATHS="./src/belgee-orenburg.ru/data/cars.json,./src/belgee-smr.ru/data/cars.json,./src/belgee-partner-saratov.ru/data/cars.json,./src/belgee-samara.ru/data/cars.json,./tmp/auto-team.pro/data/belgee.json"
node .github/scripts/scrape.js
```

```sh
export BRAND='jac'
export URL="https://jaccar.ru"
export ITEM_XPATH="//li[contains(@class, 'menu-models__item')]"
export ID_XPATH="concat('jac-', substring-before(substring-after(.//a[contains(@class, 'js-menu-models-link')]/@href, '/models/'), '/'))"
export MODEL_XPATH="substring-after(.//div[contains(@class, 'menu-models__item-title')]/text(), 'JAC ')"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'menu-models__item-price')]/text()), translate(string(.//div[contains(@class, 'menu-models__item-price')]/text()), '0123456789', ''), '')"
export LINK_XPATH="./a[contains(@class, 'js-menu-models-link')]/@href"
export OUTPUT_PATHS="./src/jac-samara.ru/data/cars.json"
node .github/scripts/scrape.js
```

```sh
export BRAND='jetour'
export URL="https://jetour-ru.com"
export ITEM_XPATH="//li[contains(@class, 'menu-model-card')]"
export ID_XPATH="concat('jetour-', substring-before(substring-after(.//div[contains(@class, 'td-submenu__body')]//a[starts-with(@href, '/models/')]/@href, '/models/'), '?'))"
export MODEL_XPATH=".//div[@class='td-submenu__title']/text()"
export PRICE_XPATH="translate(string(.//div[@class='td-submenu__description']/span[1]/span[1]/text()), translate(string(.//div[@class='td-submenu__description']/span[1]/span[1]/text()), '0123456789', ''), '')"
export LINK_XPATH="substring-before(.//div[contains(@class, 'td-submenu__body')]//a[starts-with(@href, '/models/')]/@href, '?')"
export OUTPUT_PATHS="./src/jetour-alpha.ru/data/cars.json,./src/jetour-krasnodar.ru/data/cars.json,./src/nika-jetour.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrape.js
```

```sh
export BRAND='livan'
export URL="https://livan-motors.ru/model/"
export ITEM_XPATH="//img[starts-with(@src, 'https://livan-motors.ru/storage/model')]/parent::*"
export ID_XPATH="concat('livan-', substring-before(substring-after(./a[contains(text(),'Подробнее')][starts-with(@href, 'https://livan-motors.ru/model/')]/@href, '/model/'), '/'))"
export MODEL_XPATH="substring-after(./div[@class='text-xl leading-none mb-6']/text(),'LIVAN ')"
export PRICE_XPATH="translate(string(./div[@class='text-sm mb-6']/text()), translate(string(./div[@class='text-sm mb-6']/text()), '0123456789', ''), '')"
export LINK_XPATH="./a[contains(text(),'Подробнее')][starts-with(@href, 'https://livan-motors.ru/model/')]/@href"
export OUTPUT_PATHS="./src/livan-samara.ru/data/cars.json,./src/livanorenburg.ru/data/cars.json"
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
node .github/scripts/scrape.js
```

```sh
export BRAND='gac'
export URL="https://gac.ru/models"
export ITEM_XPATH="//div[@class='td-models-grid__item']"
export ID_XPATH="concat('gac-', substring-after(.//a[starts-with(@href, '/models/')]/@href, '/models/'))"
export MODEL_XPATH="substring-after(.//a[starts-with(@href, '/models/')]/@href, '/models/')"
export PRICE_XPATH="translate(string(.//span[@class='price']/text()), translate(string(.//span[@class='price']/text()), '0123456789', ''), '')"
export LINK_XPATH=".//a[starts-with(@href, '/models/')]/@href"
export OUTPUT_PATHS="./src/gac-smr.ru/data/cars.json,./src/gac-orenburg.ru/data/cars.json,./src/gac-stavauto.ru/data/cars.json,./tmp/auto-team.pro/data/gac.json"
node .github/scripts/scrape.js
```

```sh
export BRAND='changan'
export URL="https://changanauto.ru/models/"
export ITEM_XPATH="//a[contains(@class,'card_bg-hover')]"
export ID_XPATH="concat('changan-', substring-before(substring-after(@href, '/models/'),'/'))"
export MODEL_XPATH=".//span[contains(@class,'card__info-title')]/text()"
export PRICE_XPATH="translate(string(.//span[contains(@class,'card__info-title')]/following-sibling::span[1]/text()), translate(string(.//span[contains(@class,'card__info-title')]/following-sibling::span[1]/text()), '0123456789', ''), '')"
export LINK_XPATH="./@href"
export OUTPUT_PATHS="./tmp/auto-team.pro/data/changan.json"
node .github/scripts/scrape.js

export OUTPUT_PATH="./tmp/auto-team.pro/data/changan.json"
python3 .github/scripts/scrape.py
```

```sh
export INPUT_PATHS="./tmp/auto-team.pro/data/belgee.json,./tmp/auto-team.pro/data/geely.json,./tmp/auto-team.pro/data/gac.json,./tmp/auto-team.pro/data/changan.json"
export OUTPUT_PATHS="./src/auto-team.pro/data/cars.json"
node .github/scripts/mergeJson.js
```

```sh
export BRAND='kaiyi'
export URL='https://kaiyi-auto.ru/models/'
export REGEXP='\$\{JSON\.stringify\((\{"menuType":.*)\).replace\('
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
export OUTPUT_PATHS="./src/kaiyi-alpha.ru/data/cars.json,./src/kaiyi-krd.ru/data/cars.json,./src/kaiyi-samara.ru/data/cars.json"
node .github/scripts/extractData.js
```

```sh
export BRAND='baic'
export URL='http://baic-auto.ru/models/'
export REGEXP='\$\{JSON\.stringify\((\{"menuType":.*)\).replace\('
export DEALERPRICE='dealer_price.json'
export DEALERPRICEFIELD='Конечная цена'
export DEALERBENEFITFIELD='Скидка'
export OUTPUT_PATHS="./src/baic-alpha.ru/data/cars.json,./src/baic-krasnodar.ru/data/cars.json,./src/baic-samara.ru/data/cars.json"
node .github/scripts/extractData.js
```

## Цены из таблиц дилеров

```sh
export CSV_URL=$(grep '^CSV_URL=' .env | awk -F'=' '{print substr($0, index($0,$2))}' | sed 's/^"//; s/"$//')
export QUERY_STRING="SELECT C, D, E, F WHERE A='Альфа' and B='Baic'"
export KEY_COLUMN="Модель"
export OUTPUT_PATHS="./src/baic-alpha.ru/data/dealer_price.json"
node .github/scripts/getDealerData.js
```

```sh
export CSV_URL=$(grep '^CSV_URL=' .env | awk -F'=' '{print substr($0, index($0,$2))}' | sed 's/^"//; s/"$//')
export QUERY_STRING="SELECT C, D, E, F WHERE A='Альфа' and B='Kaiyi'"
export KEY_COLUMN="Модель"
export OUTPUT_PATHS="./src/kaiyi-alpha.ru/data/dealer_price.json"
node .github/scripts/getDealerData.js
```

```sh
export CSV_URL=$(grep '^CSV_URL=' .env | awk -F'=' '{print substr($0, index($0,$2))}' | sed 's/^"//; s/"$//')
export QUERY_STRING="SELECT C, D, E, F WHERE A='Альфа' and B='Livan'"
export KEY_COLUMN="Модель"
export OUTPUT_PATHS="./src/livan-samara.ru/data/dealer_price.json"
node .github/scripts/getDealerData.js
```

```sh
export CSV_URL=$(grep '^CSV_URL=' .env | awk -F'=' '{print substr($0, index($0,$2))}' | sed 's/^"//; s/"$//')
export QUERY_STRING="SELECT C, D, E, F WHERE A='Эксперт' and B='Jetour'"
export KEY_COLUMN="Модель"
export OUTPUT_PATHS="./src/jetour-alpha.ru/data/dealer_price.json"
node .github/scripts/getDealerData.js
```
