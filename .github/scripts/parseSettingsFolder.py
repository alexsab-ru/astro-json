import os
import re
import json
import base64
import requests
import subprocess

class bcolors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

OUTPUT_JSON_BASE = 'astro-json/src'

def read_local_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"{bcolors.FAIL}[!] Ошибка чтения файла {file_path}: {str(e)}{bcolors.ENDC}")
        return None

def extract_consts(content):
    matches = re.findall(r"export const (\w+)\s*=\s*['\"](.*?)['\"];", content)
    return {k: v for k, v in matches}

def extract_app(content):
    url = ""
    recaptcha = ""
    m1 = re.search(r"connectForms\(['\"](.*?)['\"],", content)
    m2 = re.search(r"grecaptcha\.execute\(['\"](.*?)['\"]", content)
    if m1: url = m1.group(1)
    if m2: recaptcha = m2.group(1)
    return url, recaptcha

def get_main_branch(repo_path):
    try:
        # Проверяем, есть ли несохраненные изменения
        result = subprocess.run(['git', 'status', '--porcelain'], 
                              cwd=repo_path, 
                              capture_output=True, 
                              text=True)
        if result.stdout.strip():
            print(f"{bcolors.WARNING}[!] В репозитории {repo_path} есть несохраненные изменения{bcolors.ENDC}")
            return None

        # Проверяем наличие веток в указанном порядке
        main_branches = ['dealer', 'brand', 'main', 'master']
        for branch in main_branches:
            result = subprocess.run(['git', 'show-ref', '--verify', '--quiet', f'refs/heads/{branch}'],
                                  cwd=repo_path)
            if result.returncode == 0:
                # Получаем текущую ветку
                current = subprocess.run(['git', 'branch', '--show-current'],
                                       cwd=repo_path,
                                       capture_output=True,
                                       text=True)
                current_branch = current.stdout.strip()
                
                # Если текущая ветка не главная, переключаемся
                if current_branch != branch:
                    print(f"{bcolors.OKBLUE}[i] Переключение на ветку {branch} в {repo_path}{bcolors.ENDC}")
                    subprocess.run(['git', 'checkout', branch], cwd=repo_path)
                return branch
        return None
    except Exception as e:
        print(f"{bcolors.FAIL}[!] Ошибка при проверке веток в {repo_path}: {str(e)}{bcolors.ENDC}")
        return None

def read_existing_settings(file_path):
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"{bcolors.WARNING}[!] Ошибка чтения существующего файла настроек {file_path}: {str(e)}{bcolors.ENDC}")
    return {}

def extract_favicon(content):
    match = re.search(r'<link rel="icon" type="image/svg\+xml" href="(.*?)" />', content)
    return match.group(1) if match else ""

def extract_logo_header(content):
    match = re.search(r'<img src="(.*?)" class=".*?" alt={.*?}', content)
    return match.group(1) if match else ""

def extract_logo_map_info(content):
    match = re.search(r'<img src="(.*?)" class="w-full" alt={.*?}', content)
    return match.group(1) if match else ""

def extract_logo_footer(content):
    match = re.search(r'<img src="(.*?)" class=".*?" loading="lazy" alt={.*?}', content)
    return match.group(1) if match else ""

def extract_improve_offer_background(content):
    match = re.search(r'<Callback bgUrl="(.*?)"', content)
    return match.group(1) if match else ""

def check_settings_files():
    settings_dir = os.path.join(OUTPUT_JSON_BASE)
    if not os.path.exists(settings_dir):
        print(f"{bcolors.FAIL}[!] Директория {settings_dir} не существует{bcolors.ENDC}")
        return

    missing_files = []
    missing_keys = {
        'favicon': [],
        'logo_header': [],
        'logo_map_info': [],
        'logo_footer': [],
        'manager_photo': [],
        'map_background': [],
        'default_model_background': [],
        'improve_offer_background': []
    }

    for site_dir in os.listdir(settings_dir):
        site_path = os.path.join(settings_dir, site_dir)
        if not os.path.isdir(site_path):
            continue

        settings_file = os.path.join(site_path, 'data', 'settings.json')
        if not os.path.exists(settings_file):
            missing_files.append(site_dir)
            continue

        try:
            with open(settings_file, 'r', encoding='utf-8') as f:
                settings = json.load(f)
                
            for key in missing_keys.keys():
                if key not in settings:
                    missing_keys[key].append(site_dir)
                elif not settings[key]:
                    missing_keys[key].append(site_dir)
        except Exception as e:
            print(f"{bcolors.FAIL}[!] Ошибка чтения {settings_file}: {str(e)}{bcolors.ENDC}")

    print(f"\n{bcolors.OKBLUE}[i] Проверка settings.json:{bcolors.ENDC}")
    
    if missing_files:
        print(f"\n{bcolors.WARNING}[!] Отсутствуют файлы settings.json в директориях: {len(missing_files)}{bcolors.ENDC}")
        for site in missing_files:
            print(f"{bcolors.WARNING}[!] - {site}{bcolors.ENDC}")
    else:
        print(f"{bcolors.OKGREEN}[✓] Все директории содержат файл settings.json{bcolors.ENDC}")

    for key, sites in missing_keys.items():
        if sites:
            print(f"\n{bcolors.WARNING}[!] Проблемы с ключом {key} в файлах: {len(sites)}{bcolors.ENDC}")
            for site in sites:
                print(f"{bcolors.WARNING}[!] - {site}{bcolors.ENDC}")
        else:
            print(f"{bcolors.OKGREEN}[✓] Все файлы содержат корректное значение {key}{bcolors.ENDC}")

def main():
    # Получаем директорию запуска скрипта
    current_dir = os.getcwd()
    print(f"{bcolors.OKBLUE}[i] Текущая директория: {current_dir}{bcolors.ENDC}")
    
    # Получаем список всех поддиректорий
    repos = [d for d in os.listdir(current_dir) if os.path.isdir(os.path.join(current_dir, d))]
    print(f"{bcolors.OKGREEN}[i] Найдено директорий: {len(repos)}{bcolors.ENDC}")

    skipped_no_git = []
    skipped_no_main_branch = []
    skipped_no_required_files = []
    skipped_no_name = []
    skipped_no_local_path = []
    skipped_no_const_content = []

    for repo in repos:
        repo_path = os.path.join(current_dir, repo)
        
        # Проверяем, является ли директория git репозиторием
        if not os.path.exists(os.path.join(repo_path, '.git')):
            skipped_no_git.append(f"{bcolors.WARNING}[!] Пропущено (не git репозиторий): {repo}{bcolors.ENDC}")
            print(skipped_no_git[-1])
            continue

        # Проверяем и переключаемся на главную ветку
        main_branch = get_main_branch(repo_path)
        if not main_branch:
            skipped_no_main_branch.append(f"{bcolors.WARNING}[!] Пропущено (не удалось определить главную ветку): {repo}{bcolors.ENDC}")
            print(skipped_no_main_branch[-1])
            continue
        
        # Проверяем наличие обязательных файлов
        required_files = [
            os.path.join(repo_path, 'src/const.js'),
            os.path.join(repo_path, 'src/js/app.js'),
            os.path.join(repo_path, 'astro.config.mjs')
        ]
        
        if not all(os.path.exists(f) for f in required_files):
            skipped_no_required_files.append(f"{bcolors.WARNING}[!] Пропущено (отсутствуют обязательные файлы): {repo}{bcolors.ENDC}")
            print(skipped_no_required_files[-1])
            continue

        # Определяем name из .env или astro.config.mjs
        name = None
        env_path = os.path.join(repo_path, '.env')
        if os.path.exists(env_path):
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.startswith('DOMAIN='):
                        name = line.strip().split('=')[1].strip('"\'')
                        break
        
        if not name:
            config_path = os.path.join(repo_path, 'astro.config.mjs')
            with open(config_path, 'r', encoding='utf-8') as f:
                content = f.read()
                import re
                match = re.search(r"site:\s*['\"]([^'\"]+)['\"]", content)
                if match:
                    name = match.group(1).replace('https://', '').replace('http://', '').rstrip('/')

        if not name:
            skipped_no_name.append(f"{bcolors.WARNING}[!] Не удалось определить имя для {repo}{bcolors.ENDC}")
            print(skipped_no_name[-1])
            continue

        local_path = os.path.join(OUTPUT_JSON_BASE, name)
        if not os.path.isdir(local_path):
            skipped_no_local_path.append(f"{bcolors.OKCYAN}[i] Пропущено (нет локальной папки): {OUTPUT_JSON_BASE}/{name}{bcolors.ENDC}")
            print(skipped_no_local_path[-1])
            continue

        # Читаем все необходимые файлы
        const_content = read_local_file(os.path.join(repo_path, 'src/const.js'))
        app_content = read_local_file(os.path.join(repo_path, 'src/js/app.js'))
        head_content = read_local_file(os.path.join(repo_path, 'src/components/Head.astro'))
        logo_content = read_local_file(os.path.join(repo_path, 'src/components/Logo/Logo.astro'))
        map_info_content = read_local_file(os.path.join(repo_path, 'src/components/Map/MapInfo.astro'))
        footer_content = read_local_file(os.path.join(repo_path, 'src/components/ExtendedFooter.astro'))
        index_content = read_local_file(os.path.join(repo_path, 'src/pages/index.astro'))

        if not const_content and not app_content:
            skipped_no_const_content.append(f"{bcolors.FAIL}[!] Нет данных в {name}{bcolors.ENDC}")
            print(skipped_no_const_content[-1])
            continue

        consts = extract_consts(const_content)
        connect_url, recaptcha_key = extract_app(app_content)

        # Читаем существующие настройки
        data_dir = os.path.join(local_path, 'data')
        output_file = os.path.join(data_dir, 'settings.json')
        existing_settings = read_existing_settings(output_file)

        # Создаем новые настройки, сохраняя существующие значения если новые пустые
        settings = {}
        settings["brand"] = consts.get("BRAND", existing_settings.get("brand", ""))
        settings["site_name"] = consts.get("SITE_NAME", existing_settings.get("site_name", ""))
        settings["site_description"] = consts.get("SITE_DESCR", existing_settings.get("site_description", ""))
        settings["legal_entity"] = consts.get("LEGAL_ENTITY", existing_settings.get("legal_entity", ""))
        settings["legal_inn"] = consts.get("LEGAL_INN", existing_settings.get("legal_inn", ""))
        settings["legal_city"] = consts.get("LEGAL_CITY", existing_settings.get("legal_city", ""))
        settings["legal_city_where"] = consts.get("LEGAL_CITY_WHERE", existing_settings.get("legal_city_where", ""))
        settings["phone_common"] = consts.get("PHONE", existing_settings.get("phone_common", ""))
        settings["yandex_widget_orgnization"] = consts.get("LINK_WIDGET_ORGNIZATION", existing_settings.get("yandex_widget_orgnization", ""))
        settings["header_top_line"] = consts.get("HEADER_TOP_LINE", existing_settings.get("header_top_line", ""))
        settings["connectforms_link"] = connect_url or existing_settings.get("connectforms_link", "")
        settings["grecaptcha_open"] = recaptcha_key or existing_settings.get("grecaptcha_open", "")

        # Добавляем новые настройки
        settings["favicon"] = extract_favicon(head_content) if head_content else existing_settings.get("favicon", "")
        settings["logo_header"] = extract_logo_header(logo_content) if logo_content else existing_settings.get("logo_header", "")
        settings["logo_map_info"] = extract_logo_map_info(map_info_content) if map_info_content else existing_settings.get("logo_map_info", "")
        settings["logo_footer"] = extract_logo_footer(footer_content) if footer_content else existing_settings.get("logo_footer", "")
        settings["logo_dealer_header"] = existing_settings.get("logo_dealer_header", "")
        settings["logo_dealer_map_info"] = existing_settings.get("logo_dealer_map_info", "")
        settings["logo_dealer_footer"] = existing_settings.get("logo_dealer_footer", "")
        settings["manager_photo"] = "https://cdn.alexsab.ru/people/user.webp"
        settings["map_background"] = "https://cdn.alexsab.ru/maps/map-bg.webp"
        settings["default_model_background"] = "https://cdn.alexsab.ru/models/default-model-bg.webp"
        settings["improve_offer_background"] = extract_improve_offer_background(index_content) if index_content else existing_settings.get("improve_offer_background", "")

        os.makedirs(data_dir, exist_ok=True)

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(settings, f, ensure_ascii=False, indent=4)

        print(f"{bcolors.OKGREEN}[✓] Сохранено: {output_file}{bcolors.ENDC}")

    print(f"\n{bcolors.OKBLUE}[i] Пропущено (не git репозиторий): {len(skipped_no_git)}{bcolors.ENDC}")
    for item in skipped_no_git:
        print(item)

    print(f"\n{bcolors.OKBLUE}[i] Пропущено (не удалось определить главную ветку): {len(skipped_no_main_branch)}{bcolors.ENDC}")
    for item in skipped_no_main_branch:
        print(item)

    print(f"\n{bcolors.OKBLUE}[i] Пропущено (отсутствуют обязательные файлы): {len(skipped_no_required_files)}{bcolors.ENDC}")
    for item in skipped_no_required_files:
        print(item)

    print(f"\n{bcolors.OKBLUE}[i] Пропущено (не удалось определить имя): {len(skipped_no_name)}{bcolors.ENDC}")
    for item in skipped_no_name:
        print(item)

    print(f"\n{bcolors.OKBLUE}[i] Пропущено (нет локальной папки): {len(skipped_no_local_path)}{bcolors.ENDC}")
    for item in skipped_no_local_path:
        print(item)

    print(f"\n{bcolors.OKBLUE}[i] Пропущено (нет данных в {name}): {len(skipped_no_const_content)}{bcolors.ENDC}")
    for item in skipped_no_const_content:
        print(item)

    # Запускаем проверку settings.json
    check_settings_files()

if __name__ == "__main__":
    main()