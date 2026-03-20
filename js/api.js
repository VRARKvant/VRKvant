export const CONFIG = { 
    tracks: 'articles/tracks.json', 
    cheats: 'articles/cheats.json', 
    portfolio: 'articles/portfolio.json' 
};

export async function loadGlobalData() {
    try {
        if(!window.siteData.tracks) {
            const r1 = await fetch(CONFIG.tracks + '?t=' + new Date().getTime());
            window.siteData.tracks = (await r1.json()).tracks;
        }
        if(!window.siteData.cheats) {
            const r2 = await fetch(CONFIG.cheats + '?t=' + new Date().getTime());
            window.siteData.cheats = (await r2.json()).cheats;
        }
        if(!window.siteData.portfolio) {
            const r3 = await fetch(CONFIG.portfolio + '?t=' + new Date().getTime());
            window.siteData.portfolio = (await r3.json()).projects;
        }
    } catch(e) { 
        console.error("Ошибка загрузки манифестов", e); 
    }
}

export async function loadPortfolio() {
    try {
        const res = await fetch(CONFIG.portfolio + '?t=' + new Date().getTime());
        if(!res.ok) throw new Error();
        const data = await res.json();
        return data.projects;
    } catch(e) { 
        console.error("Ошибка загрузки портфолио", e);
        return [];
    }
}

export async function loadTracks() {
    try {
        const res = await fetch(CONFIG.tracks + '?t=' + new Date().getTime()); 
        if(!res.ok) throw new Error();
        const data = await res.json();
        return data.tracks;
    } catch(e) {
        console.error("Ошибка загрузки треков", e);
        return [];
    }
}

export async function loadCheats() {
    try {
        const res = await fetch(CONFIG.cheats + '?t=' + new Date().getTime()); 
        if(!res.ok) throw new Error();
        const data = await res.json();
        return data.cheats;
    } catch(e) {
        console.error("Ошибка загрузки шпаргалок", e);
        return [];
    }
}
