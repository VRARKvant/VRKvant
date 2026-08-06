/**
 * Глобальное состояние приложения (Архитектура 3.0)
 */

const state = {
    tracks: null,
    cheats: null,
    portfolio: null,
    lastPage: 'home',
    currentDir: '',
    searchIndex: null,
    isDark: document.documentElement.classList.contains('dark')
};

// Реактивные подписчики (упрощенно)
const listeners = [];

export const store = new Proxy(state, {
    set(target, property, value) {
        target[property] = value;
        listeners.forEach((fn) => fn(property, value));
        return true;
    }
});

// Глобальный доступ для отладки и надежности
window.store = store;

export function subscribe(fn) {
    listeners.push(fn);
}

export function updateState(newState) {
    Object.assign(store, newState);
}
