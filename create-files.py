import os
import json

# Корневая папка
base_dir = "/home/diywebdev/dev/astro/astro-json/src/"

# Имена файлов, которые нужно проверить
# required_files = ["faq.json", "reviews.json", "special-services.json", "menu.json"]
required_files = ["menu.json"]

created_files_count = 0
folders_with_creations = 0

for root, dirs, files in os.walk(base_dir):
    if "data" in dirs:
        data_dir = os.path.join(root, "data")
        folder_created_any = False

        for filename in required_files:
            file_path = os.path.join(data_dir, filename)
            if not os.path.exists(file_path):
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump([], f, ensure_ascii=False, indent=2)
                created_files_count += 1
                folder_created_any = True
                print(f"Создан файл: {file_path}")

        if folder_created_any:
            folders_with_creations += 1

print("\n--- Итог ---")
print(f"Создано файлов: {created_files_count}")
print(f"Папок с созданными файлами: {folders_with_creations}")