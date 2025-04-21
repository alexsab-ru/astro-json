import requests
import json
import os
import re
from lxml import html
from urllib.parse import urljoin
from dotenv import load_dotenv

# Загрузка переменных окружения из .env файла
load_dotenv()

def clean_string(text, word_to_remove):
    # Удаляем все вхождения определённого слова (регистрозависимое удаление)
    cleaned = re.sub(word_to_remove, '', text, flags=re.IGNORECASE)
    # Удаляем все символы, кроме букв и цифр
    cleaned = re.sub(r'[^a-zA-Z0-9]', '', cleaned).lower()
    return cleaned

def read_json_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Ошибка при чтении файла {file_path}: {e}")
        return None

def save_json(data, file_paths, dealer_price=None, dealer_price_field=None, dealer_benefit_field=None, brand_prefix=None):
    for file_path in file_paths:
        try:
            directory = os.path.dirname(file_path)
            dealer_data = data.copy()

            # Обработка дилерских цен
            if dealer_price:
                dealer_price_path = os.path.join(directory, dealer_price)
                json_data = read_json_file(dealer_price_path)
                
                if json_data:
                    for car in dealer_data:
                        model = clean_string(car["model"], brand_prefix)
                        if model in json_data:
                            if dealer_price_field and json_data[model].get(dealer_price_field):
                                car_price = int(car["price"]) if car["price"] else float('inf')
                                dealer_price = int(json_data[model][dealer_price_field])
                                car["price"] = str(min(car_price, dealer_price))
                            
                            if dealer_benefit_field and json_data[model].get(dealer_benefit_field):
                                car_benefit = int(car.get("benefit", 0))
                                dealer_benefit = int(json_data[model][dealer_benefit_field])
                                car["benefit"] = str(max(car_benefit, dealer_benefit))

            # Создаем директорию, если её нет
            os.makedirs(directory, exist_ok=True)
            
            # Сохраняем данные
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(dealer_data, f, ensure_ascii=False, indent=2)
            
            print(f"Данные успешно сохранены в файл: {file_path}")
        except Exception as e:
            print(f"Ошибка при сохранении файла {file_path}: {e}")

def scrape_page(url, xpaths):
    response = requests.get(url)
    response.raise_for_status()  # Проверяем успешность запроса

    # Парсим HTML с помощью lxml
    tree = html.fromstring(response.content)
    
    # Выбираем элементы по XPath
    items = tree.xpath(xpaths['item_xpath'])

    data = []
    for item in items:
        print(item.xpath(xpaths['model_xpath']))
        # Получаем значения через XPath
        id = item.xpath(xpaths['id_xpath'])
        model = item.xpath(xpaths['model_xpath'])
        link = item.xpath(xpaths['link_xpath'])
        price = item.xpath(xpaths['price_xpath'])

        if model:  # Добавляем только если есть модель
            # Обрабатываем ссылку
            link_value = link[0].strip() if link else None
            if link_value and not link_value.startswith('http'):
                link_value = urljoin(url, link_value)

            data.append({
                'id': id.strip() if id else None,
                'model': model.strip() if model else None,
                'price': price.strip() if price else None,
                'benefit': "",  # Добавляем поле benefit как в JS версии
                'link': link_value
            })

    return data

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
    
    if data:
        # Разделяем пути по запятой
        output_file_paths = os.getenv('OUTPUT_PATHS', './output/data.json').split(',')
        
        # Получаем параметры для дилерских цен
        dealer_price = os.getenv('DEALERPRICE')
        dealer_price_field = os.getenv('DEALERPRICEFIELD')
        dealer_benefit_field = os.getenv('DEALERBENEFITFIELD')
        brand_prefix = os.getenv('BRAND')
        
        save_json(
            data, 
            output_file_paths,
            dealer_price,
            dealer_price_field,
            dealer_benefit_field,
            brand_prefix
        )
    else:
        print("Данные не были получены, файл не записывается.")
