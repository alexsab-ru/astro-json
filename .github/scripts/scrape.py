import requests
from lxml import html
import json
import os

def scrape_page(url, xpaths):
    response = requests.get(url)
    response.raise_for_status()  # Проверяем успешность запроса

    tree = html.fromstring(response.content)

    items = tree.xpath(xpaths['item_xpath'])

    data = []
    for item in items:
        id = item.xpath(xpaths['id_xpath'])[0].strip() if item.xpath(xpaths['id_xpath']) else None
        model = item.xpath(xpaths['model_xpath'])[0].strip() if item.xpath(xpaths['model_xpath']) else None
        price = item.xpath(xpaths['price_xpath'])[0].strip() if item.xpath(xpaths['price_xpath']) else None
        link = item.xpath(xpaths['link_xpath'])[0].strip() if item.xpath(xpaths['link_xpath']) else None

        data.append({
            'ID': id,
            'Модель': model,
            'Цена': price,
            'Ссылка': link
        })

    return data

def save_json(data, file_path):
    directory = os.path.dirname(file_path)
    if not os.path.exists(directory):
        os.makedirs(directory)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Данные успешно сохранены в файл: {file_path}")

# Пример вызова функции
if __name__ == "__main__":
    url = os.getenv('URL')  # URL передается через переменные окружения
    xpaths = {
        'item_xpath': os.getenv('ITEM_XPATH'),
        'id_xpath': os.getenv('ID_XPATH'),
        'model_xpath': os.getenv('MODEL_XPATH'),
        'price_xpath': os.getenv('PRICE_XPATH'),
        'link_xpath': os.getenv('LINK_XPATH'),
    }

    data = scrape_page(url, xpaths)
    
    output_file_path = os.getenv('OUTPUT_PATH', './output/data.json')
    save_json(data, output_file_path)
