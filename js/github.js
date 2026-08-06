// Логика взаимодействия с GitHub API для In-Browser CMS

const GITHUB_OWNER = 'NekrasovLE';
const GITHUB_REPO = 'VRKvant';
const GITHUB_BRANCH = 'main';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/`;

// Восстановление токена при загрузке
export function initGithubAuth() {
    const tokenInput = document.getElementById('gh-token');
    if (tokenInput) {
        const savedToken = localStorage.getItem('gh_token');
        if (savedToken) tokenInput.value = savedToken;

        tokenInput.addEventListener('change', (e) => {
            localStorage.setItem('gh_token', e.target.value);
        });
    }
}

// Генерация Frontmatter на основе полей ввода
export function generateFrontmatter() {
    const type = document.getElementById('meta-type').value;
    const title = document.getElementById('meta-title').value.trim() || 'Без названия';
    const order = document.getElementById('meta-order').value || 10;

    let fm = `---\ntitle: "${title.replace(/"/g, '\\"')}"\ntype: ${type}\norder: ${order}\n`;

    if (type === 'lesson') {
        const moduleName = document.getElementById('meta-module').value.trim() || 'Разное';
        fm += `module: "${moduleName.replace(/"/g, '\\"')}"\n`;
    } else if (type === 'cheat') {
        fm += `module: "General"\n`;
    } else if (type === 'project') {
        const desc = document.getElementById('meta-desc').value.trim();
        const authors = document.getElementById('meta-authors').value.trim();
        const tags = document
            .getElementById('meta-tags')
            .value.split(',')
            .map((t) => `"${t.trim()}"`)
            .filter((t) => t !== '""')
            .join(', ');

        fm += `description: "${desc.replace(/"/g, '\\"')}"\n`;
        fm += `authors: "${authors.replace(/"/g, '\\"')}"\n`;
        fm += `tags: [${tags}]\n`;
    } else if (type === 'intro') {
        const trackId = document.getElementById('meta-track-id').value.trim();
        const icon = document.getElementById('meta-icon').value.trim();
        const color = document.getElementById('meta-color').value;

        fm += `name: "${title.replace(/"/g, '\\"')}"\n`; // Для intro.md title идет в name
        if (icon) fm += `icon: ${icon}\n`;
        fm += `colorClass: ${color}\n`;
    }

    fm += `---\n\n`;
    return fm;
}

// Формирование пути к файлу на основе полей
export function generateFilePath() {
    const type = document.getElementById('meta-type').value;
    let filename = document.getElementById('meta-filename').value.trim();

    // Транслитерация и очистка имени файла (если пользователь ввел кириллицу)
    if (!filename) {
        filename = 'new_article_' + Date.now();
    } else if (filename !== 'intro') {
        filename = filename.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    }
    filename += '.md';

    if (type === 'lesson') {
        const track = document.getElementById('meta-track').value;
        return `articles/${track}/${filename}`;
    } else if (type === 'cheat') {
        return `articles/cheats/${filename}`;
    } else if (type === 'project') {
        return `articles/portfolio/${filename}`;
    } else if (type === 'intro') {
        const trackId = document.getElementById('meta-track-id').value.trim() || 'new_track';
        return `articles/${trackId}/intro.md`;
    }

    return `articles/other/${filename}`;
}

// Кодирование текста в Base64 (с поддержкой UTF-8/кириллицы)
function utoa(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

// Основная функция публикации
export async function publishToGitHub() {
    const token = document.getElementById('gh-token').value.trim();
    if (!token) {
        alert('Пожалуйста, введите GitHub Token.');
        return;
    }

    const btn = document.getElementById('publish-btn');
    const originalBtnHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Отправка...';
    btn.disabled = true;

    try {
        const rawContent = document.getElementById('markdown-input').value;
        const frontmatter = generateFrontmatter();
        const fullContent = frontmatter + rawContent;
        const filePath = generateFilePath();
        const commitMessage = `content: Создана/обновлена статья ${filePath} через редактор`;

        // Шаг 1: Проверяем, существует ли файл (нужен SHA для обновления)
        let sha = null;
        try {
            const getRes = await fetch(GITHUB_API_URL + filePath + `?ref=${GITHUB_BRANCH}`, {
                headers: { Authorization: `token ${token}` }
            });
            if (getRes.ok) {
                const data = await getRes.json();
                sha = data.sha;
            }
        } catch (e) {
            console.log('Файл новый, создаем...');
        }

        // Шаг 2: Отправляем PUT-запрос
        const body = {
            message: commitMessage,
            content: utoa(fullContent),
            branch: GITHUB_BRANCH
        };
        if (sha) body.sha = sha;

        const putRes = await fetch(GITHUB_API_URL + filePath, {
            method: 'PUT',
            headers: {
                Authorization: `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!putRes.ok) {
            const err = await putRes.json();
            throw new Error(err.message || 'Ошибка API GitHub');
        }

        btn.innerHTML = '<i class="fas fa-check mr-2"></i>Успешно!';
        btn.classList.replace('bg-slate-900', 'bg-green-600');
        btn.classList.replace('dark:bg-white', 'dark:bg-green-500');

        setTimeout(() => {
            btn.innerHTML = originalBtnHtml;
            btn.disabled = false;
            btn.classList.replace('bg-green-600', 'bg-slate-900');
            btn.classList.replace('dark:bg-green-500', 'dark:bg-white');
            window.togglePublishPanel(); // Скрываем панель
        }, 3000);
    } catch (error) {
        console.error('Ошибка публикации:', error);
        alert(`Ошибка публикации: ${error.message}`);
        btn.innerHTML = originalBtnHtml;
        btn.disabled = false;
    }
}

// Загрузка изображения на GitHub API
export async function uploadImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const token = document.getElementById('gh-token').value.trim();
    if (!token) {
        alert('Для загрузки картинок нужно ввести GitHub Token в меню "Опубликовать".');
        event.target.value = ''; // Сбрасываем input
        return;
    }

    const btn = document.getElementById('upload-img-btn');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Загрузка...';
    btn.disabled = true;

    try {
        // Читаем файл как DataURL (Base64)
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            // Убираем префикс "data:image/png;base64,"
            const base64Content = reader.result.split(',')[1];

            // Генерируем уникальное имя файла
            const safeFileName = file.name.toLowerCase().replace(/[^a-z0-9_.]/g, '_');
            const filePath = `img/uploads/${Date.now()}_${safeFileName}`;
            const commitMessage = `media: Загружено изображение ${safeFileName}`;

            // Отправляем PUT запрос на создание файла
            const putRes = await fetch(GITHUB_API_URL + filePath, {
                method: 'PUT',
                headers: {
                    Authorization: `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: commitMessage,
                    content: base64Content,
                    branch: GITHUB_BRANCH
                })
            });

            if (!putRes.ok) {
                const err = await putRes.json();
                throw new Error(err.message || 'Ошибка загрузки картинки');
            }

            // Вставляем ссылку в редактор
            const mdInput = document.getElementById('markdown-input');
            const start = mdInput.selectionStart;
            const end = mdInput.selectionEnd;
            const text = mdInput.value;
            const insertion = `![Описание](${filePath})`;

            mdInput.value = text.substring(0, start) + insertion + text.substring(end);

            // Запускаем обновление превью
            const event = new Event('input', { bubbles: true });
            mdInput.dispatchEvent(event);

            btn.innerHTML = '<i class="fas fa-check text-green-500 mr-2"></i>Готово';
            setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            }, 2000);
            document.getElementById('image-upload-input').value = '';
        };

        reader.onerror = () => {
            throw new Error('Не удалось прочитать файл локально.');
        };
    } catch (error) {
        console.error('Ошибка загрузки медиа:', error);
        alert(`Ошибка загрузки: ${error.message}`);
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        document.getElementById('image-upload-input').value = '';
    }
}
