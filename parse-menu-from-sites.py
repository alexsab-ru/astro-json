import os
import json
import requests
from bs4 import BeautifulSoup

base_dir = "/home/diywebdev/dev/astro/astro-json/src/"

def normalize_url(href):
    if href.startswith("http") or href.startswith("javascript"):
        return href
    if href.startswith("#"):
        return "/" + href
    if not href.startswith("/"):
        return "/" + href
    return href

def parse_menu(html):
    soup = BeautifulSoup(html, "html.parser")
    menu = []
    nav = soup.find("div", id="site_nav")
    if not nav:
        return menu
    ul = nav.find("ul")
    if not ul:
        return menu
    for li in ul.find_all("li", recursive=False):
        a = li.find("a", class_="header-link")
        if not a:
            a = li.find("a", class_="scroll-link")
        if not a:
            continue
        name = a.get_text(strip=True)
        href = a.get("href", "")
        url = normalize_url(href)
        item = {"url": url, "name": name}
        # Модели: не парсим дочернее меню
        if url in ["/models/", "models/", "/models"]:
            item["children"] = "models"
        # javascript:void(0): парсим дочерние ссылки
        elif url == "javascript:void(0)":
            children = []
            submenu = li.find("div")
            if submenu:
                for child_a in submenu.find_all("a", class_="header-child-link"):
                    child_name = child_a.get_text(strip=True)
                    child_href = child_a.get("href", "")
                    child_url = normalize_url(child_href)
                    children.append({"url": child_url, "name": child_name})
            if children:
                item["children"] = children
        # Обычные пункты с дочерними ссылками
        else:
            submenu = li.find("div")
            if submenu:
                children = []
                for child_a in submenu.find_all("a", class_="header-child-link"):
                    child_name = child_a.get_text(strip=True)
                    child_href = child_a.get("href", "")
                    child_url = normalize_url(child_href)
                    children.append({"url": child_url, "name": child_name})
                if children:
                    item["children"] = children
        menu.append(item)
    return menu

for folder in os.listdir(base_dir):
    if "alexsab" in folder:
        continue
    folder_path = os.path.join(base_dir, folder)
    if not os.path.isdir(folder_path):
        continue
    data_dir = os.path.join(folder_path, "data")
    json_path = os.path.join(data_dir, "menu.json")
    url = f"http://{folder}/"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        html = response.text
        menu = parse_menu(html)
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(menu, f, ensure_ascii=False, indent=2)
        print(f"Меню сохранено: {json_path}")
    except Exception as e:
        print(f"Ошибка для {url}: {e}")