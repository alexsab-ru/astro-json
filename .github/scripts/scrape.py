import requests
import json
import os
import re
import time
from lxml import html
import elementpath
from elementpath.xpath3 import XPath3Parser
from urllib.parse import urljoin
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# Загрузка переменных окружения из .env файла
load_dotenv()

def logError(message, errorText):
    print(f"{message}: {errorText}")
    with open('output.txt', 'a') as file:
        file.write(f'"{message}": "{errorText}"\n')

def process_xpath_result(result):
    if not result:
        return None
    if type(result) is list:
        return [item.strip() for item in result if item.strip()][0]
    return result.strip() if result else None

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
        logError("Ошибка при чтении файла", e)
        return None

def save_json(data, file_paths, dealer_price=None, dealer_price_field=None, dealer_benefit_field=None, brand_prefix=None):
    for file_path in file_paths:
        try:
            directory = os.path.dirname(file_path)
            dealer_data = data.copy()

            # Обработка дилерских цен
            # TODO: Отключить обработку дилерских цен
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

            # Создаем копию файла с именем federal-models_price.json
            if file_path.endswith('cars.json'):
                if os.path.exists(os.path.join(directory, 'models-price.json')):
                    os.remove(os.path.join(directory, 'models-price.json'))
                else:
                    print("The file does not exist")
                models_price_path = os.path.join(directory, 'federal-models_price.json')
                with open(models_price_path, 'w', encoding='utf-8') as f:
                    json.dump(dealer_data, f, ensure_ascii=False, indent=2)
                print(f"Создана копия файла: {models_price_path}")

        except Exception as e:
            logError(f"Ошибка при сохранении файла", f"{file_path}: {e}")

def load_page(url, click_selector=None, wait_selector=None, wait_time=1):
    """
    Загружает страницу с помощью requests или Selenium WebDriver в зависимости от параметров
    
    Args:
        url (str): URL страницы для загрузки
        click_selector (str, optional): CSS селектор для элемента, на который нужно кликнуть
        wait_selector (str, optional): CSS селектор элемента, появление которого нужно дождаться
        wait_time (int, optional): Время ожидания в секундах
        
    Returns:
        str: HTML содержимое страницы
    """
    # Если нужно кликнуть, используем Selenium
    if click_selector:
        print(f"Загрузка страницы через WebDriver с кликом на {click_selector}")
        
        # Настройка опций Chrome
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Безголовый режим
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        # Создаем экземпляр драйвера
        try:
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=chrome_options)
            
            # Загружаем страницу
            driver.get(url)
            print("Страница загружена")
            
            # Ждем если указан селектор ожидания
            if wait_selector:
                print(f"Ожидание элемента {wait_selector}")
                WebDriverWait(driver, wait_time).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, wait_selector))
                )
            
            # Кликаем на элемент
            print(f"Выполнение клика на элемент {click_selector}")
            try:
                element = WebDriverWait(driver, wait_time).until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, click_selector))
                )
                element.click()
                print("Клик выполнен успешно")
                
                # Дополнительное ожидание после клика
                time.sleep(2)
            except Exception as e:
                logError(f"Ошибка при клике", e)
                # Можно также попробовать альтернативный метод клика через JavaScript
                try:
                    driver.execute_script(f"document.querySelector('{click_selector}').click();")
                    print("Клик выполнен через JavaScript")
                    time.sleep(2)
                except Exception as js_e:
                    logError(f"Ошибка при клике через JavaScript", js_e)
            
            # Получаем HTML после всех действий
            html_content = driver.page_source
            driver.quit()
            return html_content
            
        except Exception as e:
            logError(f"Ошибка при использовании WebDriver", e)
            if 'driver' in locals():
                driver.quit()
            # Если не получилось через WebDriver, пробуем через requests
            print("Переключение на загрузку через requests")
            response = requests.get(url)
            return response.content
    
    # По умолчанию используем requests
    print(f"Загрузка страницы через requests")
    response = requests.get(url)
    return response.content

def scrape_page(url, xpaths):
    # Получаем параметры для кликов из переменных окружения
    click_selector = os.getenv('CLICK_SELECTOR')
    wait_selector = os.getenv('WAIT_SELECTOR')
    wait_time = int(os.getenv('WAIT_TIME', '1'))
    
    # Загружаем страницу
    page_content = load_page(url, click_selector, wait_selector, wait_time)
    
    # Парсим HTML с помощью lxml
    tree = html.fromstring(page_content)
    
    data = []
    
    # Используем elementpath для выполнения XPath 3.0 запроса
    items = elementpath.select(tree, xpaths['item_xpath'], parser=XPath3Parser)
    
    for item in items:
        # Извлекаем данные из результата elementpath
        id = elementpath.select(item, xpaths['id_xpath'], parser=XPath3Parser)
        model = elementpath.select(item, xpaths['model_xpath'], parser=XPath3Parser)
        price = elementpath.select(item, xpaths['price_xpath'], parser=XPath3Parser)
        link = elementpath.select(item, xpaths['link_xpath'], parser=XPath3Parser)

        if model:  # Добавляем только если есть модель
            # Обрабатываем ссылку
            link_value = process_xpath_result(link)
            if link_value and not link_value.startswith('http'):
                link_value = urljoin(url, link_value)

            data.append({
                'id': process_xpath_result(id),
                'model': process_xpath_result(model),
                'price': process_xpath_result(price),
                'benefit': "",  # Добавляем поле benefit как в JS версии
                'link': link_value
            })

    # Сортируем данные по ID
    data.sort(key=lambda x: x['id'])
    print("Данные отсортированы по ID")

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
    print(json.dumps(data, indent=2))
    
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
