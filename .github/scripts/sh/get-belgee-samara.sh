#!/bin/bash

# Если CSV_URL не установлен, пытаемся получить его из .env
if [ -z "$CSV_URL" ] && [ -f .env ]; then
    export CSV_URL=$(grep '^CSV_URL=' .env | awk -F'=' '{print substr($0, index($0,$2))}' | sed 's/^"//; s/"$//')
fi

# Проверяем, что CSV_URL установлен
if [ -z "$CSV_URL" ]; then
    echo "Error: CSV_URL is not set"
    exit 1
fi

# Устанавливаем остальные переменные
export QUERY_STRING="SELECT C, D, E, F WHERE A='ЦнМ' and B='Belgee'"
export KEY_COLUMN="Модель"
export OUTPUT_PATHS="./src/belgee-samara.ru/data/dealer_price.json"

# Запускаем скрипт
node .github/scripts/getDealerData.js