export INPUT_PATHS="./tmp/auto-team.pro/data/belgee.json,./tmp/auto-team.pro/data/geely.json,./tmp/auto-team.pro/data/gac.json,./tmp/auto-team.pro/data/changan.json,./tmp/auto-team.pro/data/knewstar.json"
export OUTPUT_PATHS="./src/auto-team.pro/data/cars.json"
node .github/scripts/mergeJson.js

export INPUT_PATHS="./tmp/atkmotors-vostok.ru/data/chery.json,./tmp/atkmotors-vostok.ru/data/changan.json"
export OUTPUT_PATHS="./src/atkmotors-vostok.ru/data/cars.json"
node .github/scripts/mergeJson.js

export INPUT_PATHS="./src/baic.alexsab.ru/data/cars.json,./src/kaiyi.alexsab.ru/data/cars.json,./src/belgee.alexsab.ru/data/cars.json,./src/changan.alexsab.ru/data/cars.json,./src/chery.alexsab.ru/data/cars.json,./src/gac.alexsab.ru/data/cars.json,./src/evolute.alexsab.ru/data/cars.json,./src/geely.alexsab.ru/data/cars.json,./src/haval.alexsab.ru/data/cars.json,./src/jac.alexsab.ru/data/cars.json,./src/jaecoo.alexsab.ru/data/cars.json,./src/jetour.alexsab.ru/data/cars.json,./src/knewstar.alexsab.ru/data/cars.json,./src/livan.alexsab.ru/data/cars.json,./src/omoda.alexsab.ru/data/cars.json,./src/solaris.alexsab.ru/data/cars.json,./src/soueast.alexsab.ru/data/cars.json,./src/tank.alexsab.ru/data/cars.json,./src/vgv.alexsab.ru/data/cars.json,./src/wey.alexsab.ru/data/cars.json"
export OUTPUT_PATHS="./src/cars.json"
node .github/scripts/mergeJson.js


