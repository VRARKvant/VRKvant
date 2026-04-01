import { store } from './store.js';

export const CONFIG = { 
    tracks: 'articles/tracks.json', 
    cheats: 'articles/cheats.json', 
    portfolio: 'articles/portfolio.json' 
};

/**
 * Универсальная обертка для fetch с обработкой JSON и добавлением метки времени.
 * @param {string} url 
 * @returns {Promise<any>}
 */
async function fetchJSON(url) {
    const timestamp = new Date().getTime();
    const separator = url.includes('?') ? '&' : '?';
    const finalUrl = `${url}${separator}t=${timestamp}`;

    const response = await fetch(finalUrl);
    if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status} ${response.statusText} (${url})`);
    }
    return await response.json();
}

export async function loadGlobalData() {
    try {
        if(!store.tracks) {
            const data = await fetchJSON(CONFIG.tracks);
            store.tracks = data.tracks;
        }
        if(!store.cheats) {
            const data = await fetchJSON(CONFIG.cheats);
            store.cheats = data.cheats;
        }
        if(!store.portfolio) {
            const data = await fetchJSON(CONFIG.portfolio);
            store.portfolio = data.projects;
        }
    } catch(e) { 
        console.error("Ошибка загрузки манифестов:", e); 
    }
}

export async function loadPortfolio() {
    try {
        const data = await fetchJSON(CONFIG.portfolio);
        return data.projects || [];
    } catch(e) { 
        console.error("Ошибка загрузки портфолио:", e);
        return [];
    }
}

export async function loadTracks() {
    try {
        const data = await fetchJSON(CONFIG.tracks);
        return data.tracks || [];
    } catch(e) {
        console.error("Ошибка загрузки треков:", e);
        return [];
    }
}

export async function loadCheats() {
    try {
        const data = await fetchJSON(CONFIG.cheats);
        return data.cheats || [];
    } catch(e) {
        console.error("Ошибка загрузки шпаргалок:", e);
        return [];
    }
}
