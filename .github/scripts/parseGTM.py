# python3 .github/scripts/parseGTM.py
import json

# Загружаем данные из файла GTM
with open('./src/GTM-NMDLDB3F_workspace79.json', 'r') as f:
    gtm_data = json.load(f)

# Данные из scripts.json (мы можем их использовать для дополнительных полей)
def getScriptsJSON(data):
    scripts_data = {
        "site": data['site'],
        "gtm": "",
        "metrika": [
            {
                "id": data['Yandex Metrica ID'],
                "clickmap": True,
                "trackLinks": True,
                "accurateTrackBounce": True,
                "webvisor": True
            }
        ],
        "ga4": [
            {
                "id": data['GA4 ID']
            }
        ],
        "re": "",
        "vk-rtrg": [
            {
                "id": data['VK-RTRG ID']
            }
        ],
        "top.mail.ru": [
            {
                "id": data['VK Pixel Top.Mail.Ru ID']
            }
        ],
        "calltouch": {
            "mod_id": data['CallTouch Client ID'],
            "site_id": data['CallTouch Site ID']
        },
        "konget": "",
        "smartpoint": "",
        "streamwood": {
            "swKey": "",
            "swDomainKey": ""
        },
        "widgets": [
            ""
        ]
    }

    if(len(data['Yandex Metrika ID common'])>0 and data['Yandex Metrika ID common'] != "94754424"):
        scripts_data["metrika"].append(
            {
                "id": data['Yandex Metrika ID common'],
                "clickmap": True,
                "trackLinks": True,
                "accurateTrackBounce": True
            }
        )

    return scripts_data

# Извлечение переменных из GTM
variables = gtm_data['containerVersion']['variable']

# Функция для извлечения данных из списка переменных по ключу сайта
def extract_variable_data(variable, site_key):
    for param in variable.get('parameter', []):
        if param['type'] == 'LIST':
            for item in param['list']:
                for map_item in item['map']:
                    if map_item['value'] == site_key:
                        return {site_key: item}
    return None

# Функция для создания JSON для каждого сайта
def generate_site_json(variables):
    all_sites = []
    all_sites_json = {}
    all_sites_arr = []
    
    # Для каждого сайта из переменных
    for variable in variables:
        # Проверяем переменные с типом "LIST", где есть карта (map) сайтов
        if variable['type'] == 'smm':
            # Пытаемся найти сопоставление сайтов и значений
            for param in variable.get('parameter', []):
                if param['type'] == 'LIST':
                    for item in param['list']:
                        for map_item in item['map']:
                            if map_item['key'] == 'key':  # Это URL сайта
                                site_url = map_item['value']
                                # if(all_sites_json[site_url] is None):
                                if(not all_sites_json.get(site_url, False)):
                                    all_sites_json[site_url] = {}
                                    all_sites_json[site_url]['site'] = site_url
                                    all_sites.append(site_url)
                                    # print(all_sites_json)
                            elif map_item['key'] == 'value':  # Это значение для сайта (ID или что-то ещё)
                                all_sites_json[site_url][variable['name']] = map_item.get('value', '')  # Проверяем наличие 'value'
    
    for site_url in all_sites:
        all_sites_arr.append(getScriptsJSON(all_sites_json[site_url]))

    return all_sites_arr

# Генерация JSON для всех сайтов
site_jsons = generate_site_json(variables)

# Выводим JSON для каждого сайта на экран
for site_json in site_jsons:
    print(json.dumps(site_json, indent=4))

# Если нужно сохранить JSON для каждого сайта в отдельные файлы
for site_json in site_jsons:
    # site_name = site_json["site"].replace(".", "_")  # Заменяем точки в имени сайта
    site_name = site_json["site"]
    file_name = f"./src/{site_name}/data/scripts.json"
    try:
        with open(file_name, "w") as f:
            json.dump(site_json, f, indent=4)
    except FileNotFoundError:
        print(f"{file_name} not exist")
