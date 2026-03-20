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
        filename = "new_article_" + Date.now();
    } else {
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
                headers: { 'Authorization': `token ${token}` }
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
                'Authorization': `token ${token}`,
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
            togglePublishPanel(); // Скрываем панель
        }, 3000);

    } catch (error) {
        console.error('Ошибка публикации:', error);
        alert(`Ошибка публикации: ${error.message}`);
        btn.innerHTML = originalBtnHtml;
        btn.disabled = false;
    }
}
