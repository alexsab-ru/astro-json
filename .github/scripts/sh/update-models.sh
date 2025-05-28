#!/bin/bash

Color_Off='\033[0m'
BGYELLOW='\033[30;43m'
BGGREEN='\033[30;42m'
BGRED='\033[30;41m'
TEXTRED='\033[30;31m'

# Функция для обработки одного дилера
process_dealer() {
    local dealer_dir=$1
    echo "Обработка дилера: $dealer_dir"
    
    # Проверяем наличие settings.json
    if [ ! -f "$dealer_dir/data/settings.json" ]; then
        printf "\n${BGRED}Ошибка: settings.json не найден в $dealer_dir${Color_Off}\n"
        return 1
    fi
    
    # Запускаем скрипт filterModelsByBrand.js
    node .github/scripts/filterModelsByBrand.js "$dealer_dir"
}

# Основной код
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"
SRC_DIR="$PROJECT_ROOT/src"

# Переходим в корневую директорию проекта
cd "$PROJECT_ROOT"

# Если передан параметр
if [ $# -gt 0 ]; then
    dealer_name=$1
    dealer_dir="$SRC_DIR/$dealer_name"
    
    if [ ! -d "$dealer_dir" ]; then
        printf "\n${BGRED}Ошибка: Директория дилера $dealer_name не найдена${Color_Off}\n"
        exit 1
    fi
    
    process_dealer "$dealer_dir"
else
    # Обрабатываем все директории в src
    for dealer_dir in "$SRC_DIR"/*/; do
        if [ -d "$dealer_dir" ]; then
            process_dealer "$dealer_dir"
        fi
    done
fi
