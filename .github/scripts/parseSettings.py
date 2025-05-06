import os
import re
import json
import base64
import requests

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

GITHUB_ORG = 'alexsab-ru'
GITHUB_API = 'https://api.github.com'
GITHUB_TOKEN = ''  # 'your_token_here' вроде необязательно, без него тоже работает
HEADERS = {'Authorization': f'token {GITHUB_TOKEN}'} if GITHUB_TOKEN else {}

OUTPUT_JSON_BASE = 'astro-json/src'

def get_repos():
    repos = []
    page = 1
    while True:
        url = f"{GITHUB_API}/orgs/{GITHUB_ORG}/repos"
        resp = requests.get(url, headers=HEADERS, params={"per_page": 100, "page": page})
        if resp.status_code != 200:
            print(f"{bcolors.WARNING}[!] GitHub API error: {resp.status_code}{bcolors.ENDC}")
            break
        data = resp.json()
        if not data:
            break
        repos.extend(data)
        page += 1
    return repos

def get_file_content(owner, repo, path, branch):
    url = f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}"
    resp = requests.get(url, headers=HEADERS, params={"ref": branch})
    if resp.status_code == 200:
        content_data = resp.json()
        if content_data.get('encoding') == 'base64':
            return base64.b64decode(content_data['content']).decode('utf-8')
    return ""

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

def main():
    repos = get_repos()
    print(f"{bcolors.OKGREEN}[i] Получено репозиториев: {len(repos)}{bcolors.ENDC}")

    for repo in repos:
        name = repo['name']
        default_branch = repo.get('default_branch', 'main')

        local_path = os.path.join(OUTPUT_JSON_BASE, name)
        if not os.path.isdir(local_path):
            print(f"{bcolors.OKCYAN}[i] Пропущено (нет локальной папки): {OUTPUT_JSON_BASE}/{name}{bcolors.ENDC}")
            continue

        const_content = get_file_content(GITHUB_ORG, name, 'src/const.js', default_branch)
        app_content = get_file_content(GITHUB_ORG, name, 'src/js/app.js', default_branch)

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
        # settings["yandex_widget_orgnization"] = f"{consts.get('LINK_WIDGET', '')}{consts.get('LINK_WIDGET_ORGNIZATION', '')}"
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