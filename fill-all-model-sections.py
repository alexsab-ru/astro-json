#!/usr/bin/env python3
"""
Скрипт для заполнения всех файлов секций данными из models-sections.yml
Находит все файлы models-sections.yml во всех проектах и заполняет соответствующие файлы
в src/model-sections/{brand}/{model}.yml

Особенности:
- Заполняет только пустые файлы (содержащие только [])
- Пропускает уже заполненные файлы
- Обрабатывает все проекты и извлекает секции для всех моделей
"""

import yaml
import json
from pathlib import Path
from collections import defaultdict

# Базовый путь к исходным файлам
SOURCE_BASE_PATH = Path(__file__).parent / "src"

# Базовый путь для целевых файлов
TARGET_BASE_PATH = Path(__file__).parent / "src" / "model-sections"

# Путь к models.json для получения информации о брендах и моделях
MODELS_JSON_PATH = Path(__file__).parent / "src" / "models.json"


def normalize_mark_id(mark_id):
    """Нормализует mark_id для использования в пути файла"""
    return mark_id.lower().replace(" ", "-")


def normalize_model_id(model_id):
    """Нормализует model_id для имени файла"""
    return model_id.lower().replace(" ", "-")


def is_file_empty(file_path):
    """
    Проверяет, является ли файл пустым (содержит только [])
    
    Args:
        file_path: Путь к файлу
    
    Returns:
        bool: True если файл пустой, False если заполнен
    """
    if not file_path.exists():
        return False
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            # Проверяем, что файл содержит только пустой массив
            return content == "[]" or content == ""
    except Exception:
        return False


def extract_sections_from_file(source_file, models_cache=None):
    """
    Извлекает все модели и их секции из файла models-sections.yml
    
    Args:
        source_file: Путь к файлу models-sections.yml
        models_cache: Кэш моделей из models.json (опционально)
    
    Returns:
        dict: Словарь {normalized_mark: {normalized_model: sections}}
    """
    result = defaultdict(dict)
    
    try:
        # Определяем имя директории проекта из пути к файлу
        # Путь: src/belgee-samara.ru/data/models-sections.yml
        # Нужно извлечь: belgee-samara.ru
        project_dir_name = None
        try:
            # Путь относительно src/
            parts = source_file.parts
            if 'src' in parts:
                src_index = parts.index('src')
                if src_index + 1 < len(parts):
                    project_dir_name = parts[src_index + 1]
        except Exception:
            pass
        
        with open(source_file, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        
        if not isinstance(data, list):
            return result
        
        # Обрабатываем каждую модель в файле
        for model in data:
            if not isinstance(model, dict):
                continue
            
            model_id = model.get('id')
            sections = model.get('sections', [])
            
            if not model_id or not sections:
                continue
            
            # Нормализуем ID модели
            normalized_model = normalize_model_id(model_id)
            
            # Пробуем найти бренд, используя контекст проекта
            mark_id = find_mark_id_for_model(model_id, models_cache, project_dir_name)
            
            if mark_id:
                normalized_mark = normalize_mark_id(mark_id)
                # Сохраняем секции (если для этой модели еще нет секций)
                if normalized_model not in result[normalized_mark]:
                    result[normalized_mark][normalized_model] = sections
            else:
                # Пропускаем, если не можем определить бренд
                # (не логируем, чтобы не засорять вывод)
                pass
    
    except Exception as e:
        print(f"  ⚠ Ошибка при чтении {source_file}: {e}")
    
    return result


def find_mark_id_from_project_dir(project_dir_name):
    """
    Определяет бренд по имени директории проекта
    
    Args:
        project_dir_name: Имя директории проекта (например, "belgee-samara.ru")
    
    Returns:
        str: mark_id или None
    """
    # Словарь соответствий имен проектов и брендов
    # Формат: часть имени проекта -> mark_id
    project_to_brand = {
        'baic': 'Baic',
        'belgee': 'Belgee',
        'changan': 'Changan',
        'chery': 'Chery',
        'evolute': 'Evolute',
        'forthing': 'Forthing',
        'venucia': 'Venucia',
        'gac': 'Gac',
        'geely': 'Geely',
        'haval': 'Haval',
        'great-wall': 'Great Wall',
        'greatwall': 'Great Wall',
        'infiniti': 'Infiniti',
        'jac': 'JAC',
        'jaecoo': 'JAECOO',
        'jetour': 'Jetour',
        'kaiyi': 'Kaiyi',
        'knewstar': 'KNEWSTAR',
        'livan': 'Livan',
        'omoda': 'OMODA',
        'kia': 'Kia',
        'solaris': 'Solaris',
        'soueast': 'Soueast',
        'tank': 'Tank',
        'toyota': 'Toyota',
        'vgv': 'VGV',
        'wey': 'WEY',
        'mazda': 'Mazda',
        'dongfeng': 'Dongfeng',
        'hyundai': 'Hyundai',
        'datsun': 'Datsun',
        'lada': 'Lada (ВАЗ)',
        'ваз': 'Lada (ВАЗ)',
        'opel': 'Opel',
        'nissan': 'Nissan',
        'renault': 'Renault',
        'daewoo': 'Daewoo',
        'chevrolet': 'Chevrolet',
        'lexus': 'Lexus',
        'subaru': 'Subaru',
        'jaguar': 'Jaguar',
        'bmw': 'BMW',
        'mercedes-benz': 'Mercedes-Benz',
        'mercedes': 'Mercedes-Benz',
        'suzuki': 'Suzuki',
        'land-rover': 'Land Rover',
        'landrover': 'Land Rover',
        'audi': 'Audi',
        'volkswagen': 'Volkswagen',
        'vw': 'Volkswagen',
        'газ': 'ГАЗ',
        'skoda': 'Skoda',
        'ford': 'Ford',
    }
    
    project_name_lower = project_dir_name.lower()
    
    # Ищем совпадение в имени проекта
    for key, brand in project_to_brand.items():
        if key in project_name_lower:
            return brand
    
    return None


def find_mark_id_for_model(model_id, models_cache=None, project_dir_name=None):
    """
    Находит mark_id для модели в models.json
    
    Args:
        model_id: ID модели
        models_cache: Кэш моделей (опционально, для ускорения)
        project_dir_name: Имя директории проекта для определения бренда по контексту
    
    Returns:
        str: mark_id или None
    """
    # Сначала пытаемся определить бренд по контексту проекта
    if project_dir_name:
        mark_id_from_project = find_mark_id_from_project_dir(project_dir_name)
        if mark_id_from_project:
            # Проверяем, что такая комбинация model_id + mark_id существует в models.json
            if models_cache:
                normalized_target = normalize_model_id(model_id)
                normalized_mark = normalize_mark_id(mark_id_from_project)
                
                for model in models_cache:
                    if (normalize_model_id(model.get('id', '')) == normalized_target and
                        normalize_mark_id(model.get('mark_id', '')) == normalized_mark):
                        return mark_id_from_project
    
    # Если не удалось определить по контексту, ищем в models.json
    if models_cache is None:
        if not MODELS_JSON_PATH.exists():
            return None
        
        try:
            with open(MODELS_JSON_PATH, 'r', encoding='utf-8') as f:
                models_cache = json.load(f)
        except Exception:
            return None
    
    if not models_cache:
        return None
    
    normalized_target = normalize_model_id(model_id)
    
    # Если есть несколько моделей с одинаковым ID, возвращаем None
    # чтобы не выбрать неправильный бренд
    found_marks = []
    for model in models_cache:
        if normalize_model_id(model.get('id', '')) == normalized_target:
            found_marks.append(model.get('mark_id'))
    
    # Если найдена только одна модель с таким ID, возвращаем её бренд
    if len(found_marks) == 1:
        return found_marks[0]
    
    # Если найдено несколько моделей с одинаковым ID, возвращаем None
    # чтобы использовать контекст проекта
    return None


def write_sections_to_file(target_file, sections):
    """
    Записывает секции в целевой файл
    
    Args:
        target_file: Путь к целевому файлу
        sections: Массив секций
    """
    try:
        with open(target_file, 'w', encoding='utf-8') as f:
            yaml.dump(sections, f, allow_unicode=True, default_flow_style=False, sort_keys=False)
        return True
    except Exception as e:
        print(f"  ❌ Ошибка при записи {target_file}: {e}")
        return False


def main():
    """Основная функция"""
    print("Заполнение файлов секций из models-sections.yml")
    print("=" * 60)
    
    # Загружаем models.json один раз для кэширования
    models_cache = None
    if MODELS_JSON_PATH.exists():
        try:
            with open(MODELS_JSON_PATH, 'r', encoding='utf-8') as f:
                models_cache = json.load(f)
            print(f"Загружен models.json: {len(models_cache)} моделей")
        except Exception as e:
            print(f"⚠ Ошибка при загрузке models.json: {e}")
    
    # Находим все файлы models-sections.yml
    source_files = list(SOURCE_BASE_PATH.rglob("models-sections.yml"))
    print(f"Найдено файлов models-sections.yml: {len(source_files)}\n")
    
    # Словарь для хранения секций по брендам и моделям
    # Структура: {normalized_mark: {normalized_model: sections}}
    all_sections = defaultdict(dict)
    
    # Обрабатываем все исходные файлы
    print("Извлечение секций из исходных файлов...")
    processed = 0
    for source_file in source_files:
        processed += 1
        if processed % 10 == 0:
            print(f"  Обработано: {processed}/{len(source_files)}")
        sections_dict = extract_sections_from_file(source_file, models_cache)
        
        # Объединяем результаты (не перезаписываем существующие)
        for mark, models in sections_dict.items():
            for model_id, sections in models.items():
                if model_id not in all_sections[mark] or not all_sections[mark][model_id]:
                    all_sections[mark][model_id] = sections
    
    total_models = sum(len(models) for models in all_sections.values())
    print(f"\nИзвлечено секций для {total_models} моделей")
    print(f"Брендов: {len(all_sections)}")
    
    # Отладочный вывод первых 5 моделей
    print("\nПримеры извлеченных моделей:")
    count = 0
    for mark, models in list(all_sections.items())[:3]:
        for model_id, sections in list(models.items())[:2]:
            if count < 5:
                print(f"  {mark}/{model_id}: {len(sections)} секций")
                count += 1
    print()
    
    # Заполняем целевые файлы
    print("\nЗаполнение целевых файлов...")
    filled_count = 0
    skipped_count = 0
    skipped_not_exist = 0
    skipped_filled = 0
    error_count = 0
    
    for normalized_mark, models in all_sections.items():
        for normalized_model, sections in models.items():
            target_file = TARGET_BASE_PATH / normalized_mark / f"{normalized_model}.yml"
            
            # Проверяем, существует ли целевой файл
            if not target_file.exists():
                if skipped_not_exist < 3:  # Показываем первые 3
                    print(f"  ⊘ Файл не существует: {normalized_mark}/{normalized_model}.yml")
                skipped_not_exist += 1
                continue
            
            # Проверяем, пуст ли файл
            is_empty = is_file_empty(target_file)
            if not is_empty:
                if skipped_filled < 3:  # Показываем первые 3
                    print(f"  ⊘ Пропущен (уже заполнен): {normalized_mark}/{normalized_model}.yml")
                skipped_filled += 1
                continue
            
            # Заполняем файл
            if write_sections_to_file(target_file, sections):
                print(f"  ✓ Заполнен: {normalized_mark}/{normalized_model}.yml ({len(sections)} секций)")
                filled_count += 1
            else:
                error_count += 1
    
    skipped_count = skipped_not_exist + skipped_filled
    
    # Выводим статистику
    print(f"\n{'=' * 60}")
    print("Статистика:")
    print(f"  Заполнено файлов: {filled_count}")
    print(f"  Пропущено (файл не существует): {skipped_not_exist}")
    print(f"  Пропущено (уже заполнены): {skipped_filled}")
    print(f"  Ошибок: {error_count}")
    print(f"  Всего обработано: {filled_count + skipped_count + error_count}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
