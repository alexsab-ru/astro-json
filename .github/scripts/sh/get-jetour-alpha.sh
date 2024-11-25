export CSV_URL=$(grep '^CSV_URL=' .env | awk -F'=' '{print substr($0, index($0,$2))}' | sed 's/^"//; s/"$//')
export QUERY_STRING="SELECT C, D, E, F WHERE A='Эксперт' and B='Jetour'"
export KEY_COLUMN="Модель"
export OUTPUT_PATHS="./src/jetour-alpha.ru/data/dealer_price.json"
node .github/scripts/getDealerData.js
