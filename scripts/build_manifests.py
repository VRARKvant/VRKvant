import os
import re
import json

def parse_frontmatter(content):
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
    if match:
        frontmatter_str = match.group(1)
        # Простой парсинг YAML-подобного Frontmatter
        data = {}
        for line in frontmatter_str.split("\n"):
            line = line.strip()
            if line and ":" in line: # Пропускаем пустые строки и проверяем наличие разделителя
                key, value = line.split(":", 1)
                data[key.strip()] = value.strip().replace("\"", "") # Удаляем кавычки
        return data, content[match.end():]
    return {}, content

def generate_manifests(articles_dir="articles/"):
    tracks = []
    cheats = []

    # Сканирование треков
    track_dirs = [d for d in os.listdir(articles_dir) if os.path.isdir(os.path.join(articles_dir, d)) and d not in ["cheats", "portfolio"]]
    for track_id in track_dirs:
        track_path = os.path.join(articles_dir, track_id)
        lessons_data = []
        for md_file in [f for f in os.listdir(track_path) if f.endswith(".md")]:
            with open(os.path.join(track_path, md_file), "r", encoding="utf-8") as f:
                content = f.read()
                frontmatter, _ = parse_frontmatter(content)
                lessons_data.append({
                    "title": frontmatter.get("title", md_file.replace(".md", "")),
                    "file": md_file,
                    "module": frontmatter.get("module", "Разное"), # Добавляем модуль
                    "order": int(frontmatter.get("order", 9999))
                })
        
        # Сортировка уроков: сначала по полю 'order', затем по имени файла
        lessons = sorted(lessons_data, key=lambda x: (x["order"], x["file"])) 

        # Извлечение метаданных трека из intro.md или index.md
        track_metadata_frontmatter = {}
        for potential_intro_file in ["intro.md", "index.md"]:
            intro_file_path = os.path.join(track_path, potential_intro_file)
            if os.path.exists(intro_file_path):
                with open(intro_file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    track_metadata_frontmatter, _ = parse_frontmatter(content)
                break # Найдено, выходим
        
        icon = track_metadata_frontmatter.get("icon", f"img/{track_id}/{track_id}_logo.jpg")  # Дефолтная иконка
        color_class = track_metadata_frontmatter.get("colorClass", "bg-gray-500")  # Дефолтный класс цвета
        track_name = track_metadata_frontmatter.get("name", track_id.capitalize() + " Track") # Дефолтное имя трека


        tracks.append({
            "id": track_id,
            "name": track_name,
            "icon": icon,
            "colorClass": color_class,
            "lessons": lessons
        })

    # Сканирование шпаргалок
    cheats_path = os.path.join(articles_dir, "cheats")
    if os.path.exists(cheats_path):
        for md_file in sorted([f for f in os.listdir(cheats_path) if f.endswith(".md")]):
            with open(os.path.join(cheats_path, md_file), "r", encoding="utf-8") as f:
                content = f.read()
                frontmatter, _ = parse_frontmatter(content)
                cheats.append({"title": frontmatter.get("title", md_file.replace(".md", "")), "file": md_file})

    # Запись tracks.json
    with open(os.path.join(articles_dir, "tracks.json"), "w", encoding="utf-8") as f:
        json.dump({"tracks": tracks}, f, ensure_ascii=False, indent=2)
    
    # Запись cheats.json
    with open(os.path.join(articles_dir, "cheats.json"), "w", encoding="utf-8") as f:
        json.dump({"cheats": cheats}, f, ensure_ascii=False, indent=2)

    print("Манифесты tracks.json и cheats.json успешно сгенерированы.")

if __name__ == "__main__":
    generate_manifests()
