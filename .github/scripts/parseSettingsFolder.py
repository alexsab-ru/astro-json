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

def main():
    # Получаем директорию запуска скрипта
    current_dir = os.getcwd()
    print(f"{bcolors.OKBLUE}[i] Текущая директория: {current_dir}{bcolors.ENDC}")
    
    # Получаем список всех поддиректорий
    repos = [d for d in os.listdir(current_dir) if os.path.isdir(os.path.join(current_dir, d))]
    print(f"{bcolors.OKGREEN}[i] Найдено директорий: {len(repos)}{bcolors.ENDC}")

    for repo in repos:
        repo_path = os.path.join(current_dir, repo)
        
        # Проверяем, является ли директория git репозиторием
        if not os.path.exists(os.path.join(repo_path, '.git')):
            print(f"{bcolors.WARNING}[!] Пропущено (не git репозиторий): {repo}{bcolors.ENDC}")
            continue

        # Проверяем и переключаемся на главную ветку
        main_branch = get_main_branch(repo_path)
        if not main_branch:
            print(f"{bcolors.WARNING}[!] Пропущено (не удалось определить главную ветку): {repo}{bcolors.ENDC}")
            continue
        
        # Проверяем наличие обязательных файлов
        required_files = [
            os.path.join(repo_path, 'src/const.js'),
            os.path.join(repo_path, 'src/js/app.js'),
            os.path.join(repo_path, 'astro.config.mjs')
        ]
        
        if not all(os.path.exists(f) for f in required_files):
            print(f"{bcolors.WARNING}[!] Пропущено (отсутствуют обязательные файлы): {repo}{bcolors.ENDC}")
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
            print(f"{bcolors.WARNING}[!] Не удалось определить имя для {repo}{bcolors.ENDC}")
            continue

        local_path = os.path.join(OUTPUT_JSON_BASE, name)
        if not os.path.isdir(local_path):
            print(f"{bcolors.OKCYAN}[i] Пропущено (нет локальной папки): {OUTPUT_JSON_BASE}/{name}{bcolors.ENDC}")
            continue

        # Читаем файлы локально
        const_content = read_local_file(os.path.join(repo_path, 'src/const.js'))
        app_content = read_local_file(os.path.join(repo_path, 'src/js/app.js'))

        if not const_content and not app_content:
            print(f"{bcolors.FAIL}[!] Нет данных в {name}{bcolors.ENDC}")
            continue

        consts = extract_consts(const_content)
        connect_url, recaptcha_key = extract_app(app_content)

        settings = {}
        settings["brand"] = consts.get("BRAND", "")
        settings["site_name"] = consts.get("SITE_NAME", "")
        settings["site_description"] = consts.get("SITE_DESCR", "")
        settings["legal_entity"] = consts.get("LEGAL_ENTITY", "")
        settings["legal_inn"] = consts.get("LEGAL_INN", "")
        settings["legal_city"] = consts.get("LEGAL_CITY", "")
        settings["legal_city_where"] = consts.get("LEGAL_CITY_WHERE", "")
        settings["phone_common"] = consts.get("PHONE", "")
        settings["yandex_widget_orgnization"] = consts.get("LINK_WIDGET_ORGNIZATION", "")
        settings["header_top_line"] = consts.get("HEADER_TOP_LINE", "")
        settings["connectforms_link"] = connect_url
        settings["grecaptcha_open"] = recaptcha_key

        data_dir = os.path.join(local_path, 'data')
        os.makedirs(data_dir, exist_ok=True)
        output_file = os.path.join(data_dir, 'settings.json')

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(settings, f, ensure_ascii=False, indent=4)

        print(f"{bcolors.OKGREEN}[✓] Сохранено: {output_file}{bcolors.ENDC}")

if __name__ == "__main__":
    main()