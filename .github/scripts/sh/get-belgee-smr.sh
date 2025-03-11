#!/bin/bash

# Если CSV_URL не установлен, пытаемся получить его из .env
if [ -z "$CSV_URL" ] && [ -f .env ]; then
    export CSV_URL=$(grep '^CSV_PARTNER=' .env | cut -d'=' -f2- | sed 's/^"//; s/"$//')
fi

# Проверяем, что CSV_URL установлен
if [ -z "$CSV_URL" ]; then
    echo "Error: CSV_URL is not set"
    exit 1
fi

# Устанавливаем остальные переменные
export QUERY_STRING="SELECT E, J, K, L, M, N WHERE B='BelGee' and C='Самара'"
export KEY_COLUMN="Модель"
export OUTPUT_PATHS="./src/belgee-smr.ru/data/dealer_price.json"
export KEY_MAPPING='{"Цена без выгоды": "РРЦ","Выгода до (от дистрибьютора)": "Выгода дистрибьютора","Выгода до максимальная": "Скидка","Цена от (с учётом выгоды от дистрибьютора)": "Цена дистрибьютора","Цена от (с учётом максимальной выгоды)": "Конечная цена"}'

# Запускаем скрипт
node .github/scripts/getDealerData.js
