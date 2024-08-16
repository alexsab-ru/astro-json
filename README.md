# JSON for websites

Чтобы получить данные цен с сайтов можно запустить

```sh
export URL="https://www.geely-motors.com"
export ITEM_XPATH="//header/div[@data-id='carmodels']/div"
export ID_XPATH="substring-after(./a/@href, '/model/')"
export MODEL_XPATH="./a/span[@class='title']/text()"
export PRICE_XPATH="translate(string(./a/span[@class='subtitle']/text()), translate(string(./a/span[@class='subtitle']/text()), '0123456789', ''), '')"
export LINK_XPATH="./a/@href"
export OUTPUT_PATHS="./src/geelyorenburg.ru/data/cars.json,./src/geely-partner-vostok.ru/data/cars.json"
node .github/scripts/scrape.js
```

```sh
export URL="https://belgee.ru"
export ITEM_XPATH="//header/div[@data-id='models']/div"
export ID_XPATH="substring-after(./a/@href, '/model/')"
export MODEL_XPATH="./a/span[@class='title']/text()"
export PRICE_XPATH="translate(string(./a/span[@class='subtitle']/text()), translate(string(./a/span[@class='subtitle']/text()), '0123456789', ''), '')"
export LINK_XPATH="./a/@href"
export OUTPUT_PATHS="./src/belgee-partner-samara.ru/data/cars.json,./src/belgee-partner-saratov.ru/data/cars.json,./src/belgee-samara.ru/data/cars.json"
node .github/scripts/scrape.js
```

```sh
export URL="https://jaccar.ru"
export ITEM_XPATH="//li[contains(@class, 'menu-models__item')]"
export ID_XPATH="substring-before(substring-after(.//a[contains(@class, 'js-menu-models-link')]/@href, '/models/'), '/')"
export MODEL_XPATH="substring-after(.//div[contains(@class, 'menu-models__item-title')]/text(), 'JAC ')"
export PRICE_XPATH="translate(string(.//div[contains(@class, 'menu-models__item-price')]/text()), translate(string(.//div[contains(@class, 'menu-models__item-price')]/text()), '0123456789', ''), '')"
export LINK_XPATH="./a[contains(@class, 'js-menu-models-link')]/@href"
export OUTPUT_PATHS="./src/jac-samara.ru/data/cars.json"
node .github/scripts/scrape.js
```

```sh
export URL="https://jetour-ru.com"
export ITEM_XPATH="//li[contains(@class, 'menu-model-card')]"
export ID_XPATH="substring-before(substring-after(.//div[contains(@class, 'td-submenu__body')]//a[starts-with(@href, '/models/')]/@href, '/models/'), '?')"
export MODEL_XPATH=".//div[@class='td-submenu__title']/text()"
export PRICE_XPATH="translate(string(.//div[@class='td-submenu__description']/span[1]/span[1]/text()), translate(string(.//div[@class='td-submenu__description']/span[1]/span[1]/text()), '0123456789', ''), '')"
export LINK_XPATH="substring-before(.//div[contains(@class, 'td-submenu__body')]//a[starts-with(@href, '/models/')]/@href, '?')"
export OUTPUT_PATHS="./src/jetour-alpha.ru/data/cars.json,./src/jetour-krasnodar.ru/data/cars.json,./src/nika-jetour.ru/data/cars.json"
node .github/scripts/scrape.js
```

```sh
export URL="https://livan-motors.ru/model/"
export ITEM_XPATH="//img[starts-with(@src, 'https://livan-motors.ru/storage/model')]/parent::*"
export ID_XPATH="substring-before(substring-after(./a[contains(text(),'Подробнее')][starts-with(@href, 'https://livan-motors.ru/model/')]/@href, '/model/'), '/')"
export MODEL_XPATH="substring-after(./div[@class='text-xl leading-none mb-6']/text(),'LIVAN ')"
export PRICE_XPATH="translate(string(./div[@class='text-sm mb-6']/text()), translate(string(./div[@class='text-sm mb-6']/text()), '0123456789', ''), '')"
export LINK_XPATH="./a[contains(text(),'Подробнее')][starts-with(@href, 'https://livan-motors.ru/model/')]/@href"
export OUTPUT_PATHS="./src/livan-samara.ru/data/cars.json,./src/livanorenburg.ru/data/cars.json"
node .github/scripts/scrape.js
```

```sh
export URL="https://gacmotor.com.ru/models"
export ITEM_XPATH="//div[@class='td-models-grid__item']"
export ID_XPATH="substring-after(.//a[starts-with(@href, '/models/')]/@href, '/models/')"
export MODEL_XPATH="substring-after(.//a[starts-with(@href, '/models/')]/@href, '/models/')"
export PRICE_XPATH="translate(string(.//span[@class='price']/text()), translate(string(.//span[@class='price']/text()), '0123456789', ''), '')"
export LINK_XPATH=".//a[starts-with(@href, '/models/')]/@href"
export OUTPUT_PATHS="./src/gac-smr.ru/data/cars.json,./src/gac-orenburg.ru/data/cars.json"
node .github/scripts/scrape.js
```