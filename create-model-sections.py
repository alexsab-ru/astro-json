#!/usr/bin/env python3
"""
Скрипт для создания файлов секций для каждой модели из models.json
Создает файлы в формате: src/model-sections/{mark_id_normalized}/{model_id_lowercase}.yml

Особенности:
- Пробелы в именах папок заменяются на дефисы
- Названия файлов приводятся к нижнему регистру
- Убираются дубликаты (например, xray.yml и XRAY.yml будут одним файлом)
"""

import json
import os
from pathlib import Path
from collections import defaultdict

# Путь к файлу models.json
MODELS_JSON_PATH = Path(__file__).parent / "src" / "models.json"

# Базовый путь для создания файлов секций
BASE_OUTPUT_PATH = Path(__file__).parent / "src" / "model-sections"


def normalize_mark_id(mark_id):
    """
    Нормализует mark_id для использования в пути файла
    - Преобразует в нижний регистр
    - Заменяет пробелы на дефисы
    """
    return mark_id.lower().replace(" ", "-")


def normalize_model_id(model_id):
    """
    Нормализует model_id для имени файла
    - Преобразует в нижний регистр
    - Заменяет пробелы на дефисы
    """
    return model_id.lower().replace(" ", "-")


def create_model_section_file(mark_id, model_id):
    """
    Создает файл секций для модели
    
    Args:
        mark_id: ID бренда (например, "Baic" или "Great Wall")
        model_id: ID модели (например, "x75" или "XRAY")
    
    Файл содержит только массив секций без обертки с id модели.
    Формат: просто пустой массив []
    
    Returns:
        tuple: (путь к файлу, был ли создан новый файл)
    """
    # Нормализуем mark_id для пути (нижний регистр, пробелы -> дефисы)
    normalized_mark = normalize_mark_id(mark_id)
    
    # Нормализуем model_id для имени файла (нижний регистр)
    normalized_model = normalize_model_id(model_id)
    
    # Создаем путь к директории бренда
    brand_dir = BASE_OUTPUT_PATH / normalized_mark
    brand_dir.mkdir(parents=True, exist_ok=True)
    
    # Путь к файлу секций
    section_file = brand_dir / f"{normalized_model}.yml"
    
    # Базовая структура файла секций (просто пустой массив секций)
    # В YAML пустой массив можно записать как [] (flow style) - это валидный синтаксис
    yaml_content = "[]\n"
    
    # Проверяем, существует ли файл
    file_exists = section_file.exists()
    
    # Записываем файл (перезаписываем существующие, чтобы обновить структуру)
    section_file.write_text(yaml_content, encoding='utf-8')
    
    if file_exists:
        print(f"⊘ Обновлен файл: {section_file}")
        return section_file, False
    else:
        print(f"✓ Создан файл: {section_file}")
        return section_file, True


def find_and_remove_duplicates():
    """
    Находит и удаляет дубликаты файлов (например, xray.yml и XRAY.yml)
    Оставляет только файл с именем в нижнем регистре
    """
    print("\nПоиск дубликатов файлов...")
    
    # Словарь для хранения файлов по нормализованному имени
    files_by_normalized_name = defaultdict(list)
    
    # Собираем все файлы
    for yml_file in BASE_OUTPUT_PATH.rglob("*.yml"):
        normalized_name = normalize_model_id(yml_file.stem)
        files_by_normalized_name[(yml_file.parent, normalized_name)].append(yml_file)
    
    # Находим дубликаты
    duplicates_removed = 0
    for (parent, normalized_name), files in files_by_normalized_name.items():
        if len(files) > 1:
            # Сортируем файлы: сначала те, что уже в нижнем регистре
            files_sorted = sorted(files, key=lambda f: (f.stem != normalized_name, f.name))
            
            # Оставляем первый файл (должен быть в нижнем регистре)
            keep_file = files_sorted[0]
            
            # Удаляем остальные
            for file_to_remove in files_sorted[1:]:
                print(f"  🗑 Удален дубликат: {file_to_remove} (оставлен: {keep_file.name})")
                file_to_remove.unlink()
                duplicates_removed += 1
    
    if duplicates_removed > 0:
        print(f"  Удалено дубликатов: {duplicates_removed}")
    else:
        print("  Дубликатов не найдено")
    
    return duplicates_removed


def main():
    """
    Основная функция: читает models.json и создает файлы секций для каждой модели
    """
    # Проверяем существование файла models.json
    if not MODELS_JSON_PATH.exists():
        print(f"Ошибка: файл {MODELS_JSON_PATH} не найден")
        return
    
    # Читаем models.json
    print(f"Чтение файла {MODELS_JSON_PATH}...")
    with open(MODELS_JSON_PATH, 'r', encoding='utf-8') as f:
        models = json.load(f)
    
    print(f"Найдено моделей: {len(models)}")
    print(f"Создание файлов секций в {BASE_OUTPUT_PATH}...")
    print("(пробелы в именах папок заменяются на дефисы, имена файлов в нижнем регистре)\n")
    
    # Словарь для отслеживания уникальных комбинаций (mark_id, model_id)
    # чтобы не создавать дубликаты
    seen_combinations = set()
    
    # Счетчики для статистики
    created_count = 0
    updated_count = 0
    skipped_count = 0
    
    # Создаем файлы секций для каждой модели
    for model in models:
        mark_id = model.get('mark_id')
        model_id = model.get('id')
        
        # Пропускаем модели без mark_id или id
        if not mark_id or not model_id:
            print(f"⚠ Пропущена модель без mark_id или id: {model.get('name', 'unknown')}")
            skipped_count += 1
            continue
        
        # Нормализуем для проверки дубликатов
        normalized_mark = normalize_mark_id(mark_id)
        normalized_model = normalize_model_id(model_id)
        combination = (normalized_mark, normalized_model)
        
        # Пропускаем, если уже обработали эту комбинацию
        if combination in seen_combinations:
            print(f"⊘ Пропущен дубликат: {mark_id}/{model_id} -> {normalized_mark}/{normalized_model}.yml")
            skipped_count += 1
            continue
        
        seen_combinations.add(combination)
        
        # Создаем файл секций
        _, is_new = create_model_section_file(mark_id, model_id)
        if is_new:
            created_count += 1
        else:
            updated_count += 1
    
    # Ищем и удаляем дубликаты среди существующих файлов
    duplicates_removed = find_and_remove_duplicates()
    
    # Выводим статистику
    print(f"\n{'='*60}")
    print(f"Статистика:")
    print(f"  Создано новых файлов: {created_count}")
    print(f"  Обновлено существующих файлов: {updated_count}")
    print(f"  Пропущено дубликатов: {skipped_count}")
    print(f"  Удалено дубликатов из файловой системы: {duplicates_removed}")
    print(f"  Всего обработано: {created_count + updated_count + skipped_count}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
