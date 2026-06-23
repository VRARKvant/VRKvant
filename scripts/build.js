const fs = require('fs');
const path = require('path');

function parseMD(content) {
    const match = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+/);
    let data = {};
    let text = content;
    if (match) {
        const frontmatterStr = match[1];
        frontmatterStr.split(/\r?\n/).forEach(line => {
            const index = line.indexOf(':');
            if (index > -1) {
                const key = line.substring(0, index).trim();
                let value = line.substring(index + 1).trim();
                value = value.replace(/^["']|["']$/g, '');
                if (value.startsWith('[') && value.endsWith(']')) {
                    value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
                }
                data[key] = value;
            }
        });
        text = content.slice(match[0].length);
    }
    // Clean markdown for search: remove headers, links, images, code blocks (basic)
    const cleanText = text
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/#{1,6}\s/g, '')
        .replace(/>\s/g, '')
        .replace(/\n+/g, ' ')
        .trim()
        .substring(0, 1000); // Limit size

    return { data, cleanText };
}

function generateManifests(articlesDir = 'articles/') {
    const tracks = [];
    const cheats = [];
    const projects = [];
    const games = [];
    const searchIndex = [];
    const graph = { nodes: [], links: [] };

    const items = fs.readdirSync(articlesDir);
    const pathToNodeId = {};

    function addNode(title, path, type, metadata = {}) {
        if (!pathToNodeId[path]) {
            const id = Object.keys(pathToNodeId).length + 1;
            pathToNodeId[path] = id;
            graph.nodes.push({ id, title, path, type, ...metadata });
        }
        return pathToNodeId[path];
    }

    // Категорийные узлы
    const cheatsCatId = addNode('База знаний', 'category:cheats', 'category');
    const portfolioCatId = addNode('Портфолио', 'category:portfolio', 'category');

    items.forEach(item => {
        const itemPath = path.join(articlesDir, item);
        if (fs.statSync(itemPath).isDirectory()) {
            if (item === 'cheats') {
                const files = fs.readdirSync(itemPath).filter(f => f.endsWith('.md'));
                files.forEach(file => {
                    const content = fs.readFileSync(path.join(itemPath, file), 'utf-8');
                    const { data, cleanText } = parseMD(content);
                    const title = data.title || file.replace('.md', '');
                    const articlePath = `articles/cheats/${file}`;
                    cheats.push({ title, file });
                    searchIndex.push({
                        title, content: cleanText, type: 'Шпаргалка', category: 'База знаний',
                        path: `article:${articlePath}`, icon: 'fas fa-bolt'
                    });
                    const nodeId = addNode(title, articlePath, 'cheat');
                    graph.links.push({ source: nodeId, target: cheatsCatId });
                });
            } else if (item === 'portfolio') {
                const files = fs.readdirSync(itemPath).filter(f => f.endsWith('.md'));
                files.forEach(file => {
                    const content = fs.readFileSync(path.join(itemPath, file), 'utf-8');
                    const { data, cleanText } = parseMD(content);
                    const title = data.title || file.replace('.md', '');
                    const articlePath = `articles/portfolio/${file}`;
                    projects.push({
                        title, description: data.description || '', authors: data.authors || '',
                        tags: data.tags || [], image: data.image || '', file, order: parseInt(data.order || 9999)
                    });
                    searchIndex.push({
                        title, content: cleanText, type: 'Проект', category: 'Портфолио',
                        path: `article:${articlePath}`, icon: 'fas fa-project-diagram'
                    });
                    const nodeId = addNode(title, articlePath, 'project');
                    graph.links.push({ source: nodeId, target: portfolioCatId });
                });
                projects.sort((a, b) => a.order - b.order);
            } else if (item === 'games') {
                const files = fs.readdirSync(itemPath).filter(f => f.endsWith('.md'));
                files.forEach(file => {
                    const content = fs.readFileSync(path.join(itemPath, file), 'utf-8');
                    const { data, cleanText } = parseMD(content);
                    const title = data.title || file.replace('.md', '');
                    const articlePath = `articles/games/${file}`;
                    games.push({
                        title, description: data.description || '', icon: data.icon || '', file, order: parseInt(data.order || 9999)
                    });
                    searchIndex.push({
                        title, content: cleanText, type: 'Игра', category: 'Игры',
                        path: `article:${articlePath}`, icon: 'fas fa-gamepad'
                    });
                    const nodeId = addNode(title, articlePath, 'project');
                    graph.links.push({ source: nodeId, target: portfolioCatId }); // Привязываем к той же категории для простоты
                });
                games.sort((a, b) => a.order - b.order);
            } else {
                const trackId = item;
                const lessonsData = [];
                const files = fs.readdirSync(itemPath).filter(f => f.endsWith('.md'));
                
                let trackName = trackId.charAt(0).toUpperCase() + trackId.slice(1) + ' Track';
                ['intro.md', 'index.md'].forEach(introFile => {
                    const introPath = path.join(itemPath, introFile);
                    if (fs.existsSync(introPath)) {
                        const { data } = parseMD(fs.readFileSync(introPath, 'utf-8'));
                        if (data.name) trackName = data.name;
                    }
                });

                // Track introduction article path
                let trackIntroPath = `articles/${trackId}/intro.md`;
                if (!fs.existsSync(trackIntroPath)) trackIntroPath = `articles/${trackId}/index.md`;

                const trackNodeId = addNode(trackName, trackIntroPath, 'track');

                const modulesInTrack = {};

                files.forEach(file => {
                    const isIntro = (file === 'intro.md' || file === 'index.md');
                    const content = fs.readFileSync(path.join(itemPath, file), 'utf-8');
                    const { data, cleanText } = parseMD(content);
                    const title = data.title || file.replace('.md', '');
                    const articlePath = `articles/${trackId}/${file}`;
                    const moduleName = data.module || 'Разное';
                    
                    lessonsData.push({ title, file, module: moduleName, order: parseInt(data.order || (isIntro ? -1 : 9999)) });
                    
                    searchIndex.push({
                        title, content: cleanText, type: 'Урок', category: trackName,
                        path: `article:${articlePath}`, icon: 'fas fa-book-open'
                    });
                    
                    // Для графа: если это intro, то узел уже создан как 'track'
                    // Если это обычный урок, создаем узел 'lesson' и привязываем к модулю
                    if (!isIntro) {
                        const nodeId = addNode(title, articlePath, 'lesson');
                        const moduleKey = `module:${trackId}:${moduleName}`;
                        if (!modulesInTrack[moduleKey]) {
                            modulesInTrack[moduleKey] = addNode(moduleName, moduleKey, 'module', { url: articlePath });
                            graph.links.push({ source: modulesInTrack[moduleKey], target: trackNodeId });
                        }
                        graph.links.push({ source: nodeId, target: modulesInTrack[moduleKey] });
                    }
                });

                const lessons = lessonsData.sort((a, b) => (a.order - b.order) || a.file.localeCompare(b.file));
                let trackMetadata = {};
                ['intro.md', 'index.md'].forEach(introFile => {
                    const introPath = path.join(itemPath, introFile);
                    if (fs.existsSync(introPath)) trackMetadata = parseMD(fs.readFileSync(introPath, 'utf-8')).data;
                });
                tracks.push({ id: trackId, name: trackMetadata.name || trackName, icon: trackMetadata.icon || `img/${trackId}/${trackId}_logo.jpg`, colorClass: trackMetadata.colorClass || 'bg-gray-500', lessons });
            }
        }
    });

    // ВТОРОЙ ПРОХОД: Сбор ссылок для графа
    graph.nodes.forEach(node => {
        if (node.type === 'external') return; // Внешние ссылки не парсим

        const fullPath = node.path;
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            
            // Внутренние ссылки (.md)
            const internalMatches = content.matchAll(/\[(.*?)\]\((.*?\.md)\)/g);
            for (const match of internalMatches) {
                const title = match[1] || 'Новая заметка';
                let linkedPath = match[2];

                if (!linkedPath.startsWith('articles/')) {
                    const dir = path.dirname(node.path);
                    linkedPath = path.posix.join(dir, linkedPath);
                }

                // Если узел уже есть - создаем связь
                if (pathToNodeId[linkedPath]) {
                    graph.links.push({ source: node.id, target: pathToNodeId[linkedPath] });
                } else {
                    // Создаем "несуществующую" заметку
                    const id = Object.keys(pathToNodeId).length + 1;
                    pathToNodeId[linkedPath] = id;
                    graph.nodes.push({ id, title, path: linkedPath, type: 'missing' });
                    graph.links.push({ source: node.id, target: id });
                }
            }

            // Внешние ссылки (http/https)
            const externalMatches = content.matchAll(/\[(.*?)\]\((https?:\/\/.*?)\)/g);
            for (const match of externalMatches) {
                const title = match[1] || 'Внешняя ссылка';
                const url = match[2];
                
                if (!pathToNodeId[url]) {
                    const id = Object.keys(pathToNodeId).length + 1;
                    pathToNodeId[url] = id;
                    graph.nodes.push({ id, title, path: url, type: 'external' });
                }
                graph.links.push({ source: node.id, target: pathToNodeId[url] });
            }
        }
    });

    fs.writeFileSync(path.join(articlesDir, 'tracks.json'), JSON.stringify({ tracks }, null, 2));
    fs.writeFileSync(path.join(articlesDir, 'cheats.json'), JSON.stringify({ cheats }, null, 2));
    fs.writeFileSync(path.join(articlesDir, 'portfolio.json'), JSON.stringify({ projects }, null, 2));
    fs.writeFileSync(path.join(articlesDir, 'games.json'), JSON.stringify({ games }, null, 2));
    fs.writeFileSync(path.join(articlesDir, 'search_index.json'), JSON.stringify(searchIndex, null, 2));
    fs.writeFileSync(path.join(articlesDir, 'graph.json'), JSON.stringify(graph, null, 2));

    // Сборка галереи фотографий
    const photos = [];
    const galleryDir = path.join(__dirname, '../img/gallery');
    if (fs.existsSync(galleryDir)) {
        const imgFiles = fs.readdirSync(galleryDir).filter(f => f.match(/\.(jpg|jpeg|png|gif|webp)$/i));
        imgFiles.forEach(file => {
            photos.push(`img/gallery/${file}`);
        });
    }
    fs.writeFileSync(path.join(articlesDir, 'gallery.json'), JSON.stringify({ photos }, null, 2));

    console.log('Манифесты (tracks, cheats, portfolio, games, gallery, search_index, graph) успешно сгенерированы.');
}

generateManifests();
