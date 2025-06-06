export INPUT_PATHS="./tmp/auto-team.pro/data/belgee.json,./tmp/auto-team.pro/data/geely.json,./tmp/auto-team.pro/data/gac.json,./tmp/auto-team.pro/data/changan.json,./tmp/auto-team.pro/data/knewstar.json"
export OUTPUT_PATHS="./src/auto-team.pro/data/cars.json"
node .github/scripts/mergeJson.js

export INPUT_PATHS="./tmp/atkmotors-vostok.ru/data/chery.json,./tmp/atkmotors-vostok.ru/data/changan.json"
export OUTPUT_PATHS="./src/atkmotors-vostok.ru/data/cars.json"
node .github/scripts/mergeJson.js
