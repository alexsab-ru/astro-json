import os
import json

# Корневая папка
base_dir = "/home/diywebdev/dev/astro/astro-json/src/"

# Имена файлов, которые нужно проверить
required_files = ["federal-disclaimer.json"]

created_files_count = 0
folders_with_creations = 0

for root, dirs, files in os.walk(base_dir):
    if "data" in dirs:
        data_dir = os.path.join(root, "data")
        folder_created_any = False

        # Поиск исходных файлов
        src_json = None
        for candidate in ["federal-models_price.json", "all-prices.json"]:
            candidate_path = os.path.join(data_dir, candidate)
            if os.path.exists(candidate_path):
                src_json = candidate_path
                break

        disclaimer_data = {}

        if src_json:
            with open(src_json, "r", encoding="utf-8") as f:
                try:
                    models = json.load(f)
                    for item in models:
                        # Если это список, а не объект
                        if isinstance(item, dict) and "id" in item:
                            disclaimer_data[item["id"]] = {
                                "price": "",
                                "benefit": ""
                            }
                except Exception as e:
                    print(f"Ошибка чтения {src_json}: {e}")
        # Если исходных файлов нет, оставляем пустой объект

        for filename in required_files:
            file_path = os.path.join(data_dir, filename)
            if not os.path.exists(file_path):
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump(disclaimer_data, f, ensure_ascii=False, indent=2)
                created_files_count += 1
                folder_created_any = True
                print(f"Создан файл: {file_path}")

        if folder_created_any:
            folders_with_creations += 1

print("\n--- Итог ---")
print(f"Создано файлов: {created_files_count}")
print(f"Папок с созданными файлами: {folders_with_creations}")