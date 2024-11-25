export CSV_URL=$(grep '^CSV_URL=' .env | awk -F'=' '{print substr($0, index($0,$2))}' | sed 's/^"//; s/"$//')
export QUERY_STRING="SELECT C, D, E, F WHERE A='Мега' and B='Baic'"
export KEY_COLUMN="Модель"
export OUTPUT_PATHS="./src/baic-samara.ru/data/dealer_price.json"
node .github/scripts/getDealerData.js
