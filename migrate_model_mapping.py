#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Скрипт миграции: перенос данных из src/model_mapping.json в src/models.json.

Цели миграции:
1) Обновить поле feed_names у моделей, добавив все варианты названий из 1С
   (ключи моделей в model_mapping.json) по каждому бренду (mark_id) и папке модели (folder).
2) Перенести названия цветов (ключи в color) в массив имён у соответствующих цветов
   в models.json. Для этого мы группируем ключи по имени файла (значение в color),
   ищем соответствующий цвет по имени файла carImage (сопоставление по базовому имени без расширения)
   и добавляем новый массив синонимов в поле names у каждого цвета.
   ВАЖНО: файлы уехали на CDN, а сами имена файлов из 1С больше не нужны, мы используем их
   только для сопоставления с цветами.
3) Добавить кириллическое название cyrillic для каждой модели из поля cyrillic в model_mapping.json
   (не перезаписываем непустые существующие значения).

Примечания по реализации:
- Мы намеренно не удаляем существующие данные, а только дополняем их.
- Мы сохраняем резервную копию src/models.json перед перезаписью.
- Мы не вводим сложных структур и не переусложняем код — всё максимально просто и модульно.

Как проверить результат (ручной тест):
- Откройте несколько моделей (например, Baic → X75, U5 Plus) в src/models.json
  и убедитесь, что:
  * feed_names содержит варианты названий из model_mapping.json для соответствующей модели;
  * в каждом элементе colors появился массив names с синонимами цвета из model_mapping.json;
  * у модели присутствует поле cyrillic (если его не было ранее).
"""

from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple


ROOT = os.path.dirname(os.path.abspath(__file__))
MODELS_PATH = os.path.join(ROOT, "src", "models.json")
MAPPING_PATH = os.path.join(ROOT, "src", "model_mapping.json")


def load_json(path: str) -> Any:
    """Читает JSON из файла с поддержкой UTF-8.

    Возвращает питоновский объект (dict/list).
    """
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path: str, data: Any) -> None:
    """Сохраняет объект как JSON с читаемым форматированием.

    - indent=4: сохраняем отступы из исходного файла (4 пробела).
    - ensure_ascii=False: корректно сохраняем кириллицу.
    - sort_keys=False: не меняем порядок ключей.
    """
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


def make_backup(src_path: str) -> str:
    """Создаёт резервную копию файла рядом с оригиналом.

    Имя вида: <filename>.backup-YYYYmmdd-HHMMSS.json
    Возвращает путь к бэкапу.
    """
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    base, ext = os.path.splitext(src_path)
    backup_path = f"{base}.backup-{ts}{ext}"
    with open(src_path, "r", encoding="utf-8") as src, open(backup_path, "w", encoding="utf-8") as dst:
        dst.write(src.read())
    return backup_path


def path_filename(path_or_url: str) -> str:
    """Возвращает имя файла из пути или URL (часть после последнего /)."""
    return os.path.basename(path_or_url)


def filename_basename(fname: str) -> str:
    """Возвращает базовое имя файла без расширения.

    Пример: "silver.webp" → "silver"; "silver-black.png" → "silver-black".
    """
    name, _ext = os.path.splitext(fname)
    return name


def index_models_by_brand_and_id(models: List[Dict[str, Any]]) -> Dict[Tuple[str, str], Dict[str, Any]]:
    """Строит индекс моделей вида {(brand_lower, model_id_lower): model_object}.

    - brand соответствует полю mark_id (например, "Baic").
    - model_id соответствует полю id (например, "x75").
    - приводим к нижнему регистру для надёжного сопоставления.
    """
    index: Dict[Tuple[str, str], Dict[str, Any]] = {}
    for model in models:
        brand = str(model.get("mark_id", "")).strip()
        model_id = str(model.get("id", "")).strip()
        if not brand or not model_id:
            continue
        index[(brand.lower(), model_id.lower())] = model
    return index


def group_color_keys_by_file(color_map: Dict[str, str]) -> Dict[str, List[str]]:
    """Из словаря цветов {"Название": "file.ext"} строит группы по базовому имени файла.

    Возвращает {basename: [list_of_color_keys]}.
    Это помогает сопоставить ключи цветов из 1С с carImage в models.json.
    """
    groups: Dict[str, List[str]] = {}
    for color_name, filename in color_map.items():
        if not isinstance(filename, str) or not filename:
            continue
        base = filename_basename(filename)
        groups.setdefault(base, []).append(color_name)
    return groups


def ensure_list(value: Any) -> List[Any]:
    """Гарантирует, что значение — список. Если None, вернёт пустой список."""
    if value is None:
        return []
    if isinstance(value, list):
        return value
    # Если в данных вдруг встретится не список — делаем список из одного элемента
    return [value]


def update_model_feed_names(model: Dict[str, Any], names_to_add: List[str]) -> None:
    """Обновляет поле feed_names у модели, добавляя новые уникальные элементы.

    - Не дублируем уже существующие значения.
    - Порядок: сначала существующие, затем новые (в исходном порядке без сортировки).
    """
    existing = ensure_list(model.get("feed_names"))
    existing_set = {str(x) for x in existing}
    for name in names_to_add:
        s = str(name)
        if s not in existing_set:
            existing.append(s)
            existing_set.add(s)
    model["feed_names"] = existing


def set_model_cyrillic_if_missing(model: Dict[str, Any], cyrillic_value: Optional[str]) -> None:
    """Записывает cyrillic, если у модели его нет или он пустой.

    - Не перезаписывает непустые значения.
    """
    if not cyrillic_value:
        return
    cur = model.get("cyrillic")
    if isinstance(cur, str) and cur.strip():
        return
    model["cyrillic"] = cyrillic_value


def update_color_names(model: Dict[str, Any], color_groups: Dict[str, List[str]]) -> None:
    """Для модели добавляет массив синонимов имён цветов в поле names каждого цвета.

    - color_groups: {basename: [color_keys_from_mapping]} — сгруппированные ключи из model_mapping.json
    - Сопоставление происходит по carImage: извлекаем имя файла и берём его базовую часть без расширения.
    - Если совпадений нет — пропускаем (не считаем это ошибкой, т.к. данные дилеров могут отличаться).
    """
    colors = ensure_list(model.get("colors"))
    if not colors:
        return

    # Подготовим быстрый индекс цветов модели по base имени файла изображения
    # Пример: https://cdn.../colors/silver.webp → base "silver"
    color_idx: Dict[str, Dict[str, Any]] = {}
    for color in colors:
        if not isinstance(color, dict):
            continue
        car_image = str(color.get("carImage", ""))
        if not car_image:
            continue
        fname = path_filename(car_image)
        base = filename_basename(fname)
        if base:
            color_idx[base] = color

    # Пройдёмся по группам из mapping и добавим aliases
    for base, alias_names in color_groups.items():
        color_obj = color_idx.get(base)
        if not color_obj:
            # Иногда расширения/написание могут отличаться. Попробуем альтернативный матчинг:
            # 1) если base оканчивается на "-metallic" и т.п., можно попробовать упростить,
            #    но чтобы не усложнять, ограничимся прямым соответствием base.
            continue
        # Добавляем уникальные имена в поле names
        existing_names = ensure_list(color_obj.get("names"))
        existing_set = {str(x) for x in existing_names}
        for alias in alias_names:
            s = str(alias)
            if s not in existing_set:
                existing_names.append(s)
                existing_set.add(s)
        color_obj["names"] = existing_names


def migrate() -> int:
    """Основная функция миграции. Возвращает код выхода (0 — успех)."""
    if not os.path.exists(MODELS_PATH):
        print(f"Не найден файл: {MODELS_PATH}")
        return 1
    if not os.path.exists(MAPPING_PATH):
        print(f"Не найден файл: {MAPPING_PATH}")
        return 1

    models = load_json(MODELS_PATH)
    mapping = load_json(MAPPING_PATH)

    if not isinstance(models, list):
        print("Ожидался массив в src/models.json")
        return 1
    if not isinstance(mapping, dict):
        print("Ожидался объект в src/model_mapping.json")
        return 1

    # Индексируем модели по (brand, id)
    model_index = index_models_by_brand_and_id(models)

    # Пройдём по брендам и вариантам моделей в mapping
    for brand, models_map in mapping.items():
        if not isinstance(models_map, dict):
            continue
        brand_l = str(brand).lower()

        for model_variant_name, details in models_map.items():
            if not isinstance(details, dict):
                continue

            folder = str(details.get("folder", "")).strip()
            if not folder:
                # Без folder невозможно сопоставить с models.json
                print(f"Пропущен вариант модели {brand_l} {model_variant_name} без folder: {details}")
                continue

            cyrillic = details.get("cyrillic")
            color_map = details.get("color", {}) or {}

            key = (brand_l, folder.lower())
            model_obj = model_index.get(key)
            if not model_obj:
                # Соответствующая модель в models.json не найдена — пропускаем.
                print(f"Пропущен вариант модели {brand_l} {model_variant_name} без модели в models.json: {details}")
                continue

            # 1) feed_names: добавляем вариант названия модели из 1С (ключ из mapping)
            update_model_feed_names(model_obj, [model_variant_name])

            # 2) cyrillic: заполняем, если пусто
            set_model_cyrillic_if_missing(model_obj, cyrillic)

            # 3) colors: добавляем массив имён по сопоставлению файла
            if isinstance(color_map, dict) and color_map:
                groups = group_color_keys_by_file(color_map)
                update_color_names(model_obj, groups)

    # Перед сохранением: перенесём ключ cyrillic сразу после name у каждой модели
    def reorder_cyrillic_after_name(model: Dict[str, Any]) -> Dict[str, Any]:
        """Возвращает копию модели с ключом cyrillic, перемещённым сразу после name.

        - Если поля name нет — порядок не меняем.
        - Если cyrillic отсутствует — порядок не меняем.
        - Иначе создаём новый dict, сохраняя порядок остальных ключей.
        """
        if "name" not in model or "cyrillic" not in model:
            return model

        # Собираем итоговый порядок ключей
        result: Dict[str, Any] = {}
        cyr_value = model["cyrillic"]
        inserted = False
        for k in list(model.keys()):
            if k == "cyrillic":
                # пропускаем сейчас, вставим после name
                continue
            result[k] = model[k]
            if k == "name":
                result["cyrillic"] = cyr_value
                inserted = True

        # На случай если по какой-то причине "name" не встретился (хотя проверяли выше)
        if not inserted:
            result["cyrillic"] = cyr_value
        return result

    def reorder_color_names_after_name(model: Dict[str, Any]) -> Dict[str, Any]:
        """В каждом объекте цвета перемещает ключ names сразу после name.

        - Работает только если и name, и names существуют в объекте цвета.
        - Остальные ключи сохраняют исходный порядок.
        - Если colors отсутствуют или не список — пропускаем.
        """
        colors = model.get("colors")
        if not isinstance(colors, list) or not colors:
            return model

        new_colors: List[Dict[str, Any]] = []
        for color in colors:
            if not isinstance(color, dict):
                new_colors.append(color)
                continue
            if "name" not in color or "names" not in color:
                new_colors.append(color)
                continue

            # Пересобираем порядок ключей, вставляя names сразу после name
            result: Dict[str, Any] = {}
            names_value = color["names"]
            inserted = False
            for k in list(color.keys()):
                if k == "names":
                    # пропускаем сейчас, вставим после name
                    continue
                result[k] = color[k]
                if k == "name":
                    result["names"] = names_value
                    inserted = True
            if not inserted:
                result["names"] = names_value
            new_colors.append(result)

        model["colors"] = new_colors
        return model

    models = [reorder_cyrillic_after_name(m) for m in models]
    models = [reorder_color_names_after_name(m) for m in models]

    # Бэкапим и сохраняем
    backup_path = make_backup(MODELS_PATH)
    save_json(MODELS_PATH, models)
    print(f"Готово. Бэкап: {backup_path}")
    return 0


if __name__ == "__main__":
    sys.exit(migrate())


