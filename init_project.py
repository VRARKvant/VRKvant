import os
import json

def create_vr_kvant_structure():
    # Определение базовой структуры папок
    directories = [
        'articles',
        'articles/blender',
        'articles/unity',
        'articles/unreal',
        'img',
        'img/blender',
        'img/unity',
        'img/unreal'
    ]

    # Создание папок
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"Создана папка: {directory}")

    # Начальное содержимое для tracks.json
    tracks_data = {
        "tracks": [
            {
                "id": "blender",
                "name": "Blender Track",
                "icon": "fas fa-shapes",
                "colorClass": "bg-orange-500",
                "lessons": [
                    { "title": "Вступление", "file": "intro.md" }
                ]
            },
            {
                "id": "unity",
                "name": "Unity Track",
                "icon": "fab fa-unity",
                "colorClass": "bg-indigo-600",
                "lessons": [
                    { "title": "Вступление", "file": "intro.md" }
                ]
            },
            {
                "id": "unreal",
                "name": "Unreal Engine",
                "icon": "fas fa-bolt",
                "colorClass": "bg-slate-700",
                "lessons": [
                    { "title": "Вступление", "file": "intro.md" }
                ]
            }
        ]
    }

    # Начальное содержимое для cheats.json
    cheats_data = {
        "cheats": [
            {
                "title": "Как подключить Quest 2/3?",
                "content": "1. Установите ПО Oculus на ПК.\n2. Используйте качественный кабель USB 3.0.\n3. Включите Quest Link в настройках шлема."
            }
        ]
    }

    # Файлы и их содержимое
    files_to_create = {
        'articles/tracks.json': json.dumps(tracks_data, indent=2, ensure_ascii=False),
        'articles/cheats.json': json.dumps(cheats_data, indent=2, ensure_ascii=False),
        'articles/blender/intro.md': "# Добро пожаловать в Blender\n\nЗдесь начнется твой путь в 3D.",
        'articles/unity/intro.md': "# Добро пожаловать в Unity\n\nЗдесь мы оживим твои модели.",
        'articles/unreal/intro.md': "# Добро пожаловать в Unreal Engine\n\nСоздавай фотореалистичные миры."
    }

    # Создание файлов
    for file_path, content in files_to_create.items():
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
            print(f"Создан файл: {file_path}")

    print("\n✅ Структура проекта успешно инициализирована!")

if __name__ == "__main__":
    create_vr_kvant_structure()