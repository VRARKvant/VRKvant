import { initRouter, updateEditorPreview, insertTemplate, copyEditorCode, downloadMarkdown, goBackSafe } from './router.js';
import { initSearch, openSearch, closeSearch } from './search.js';
import { initGithubAuth, publishToGitHub } from './github.js';

function togglePublishPanel() {
    const panel = document.getElementById('publish-panel');
    if (panel) {
        panel.classList.toggle('hidden');
        panel.classList.toggle('flex');
    }
}

function updateMetaFields() {
    const type = document.getElementById('meta-type').value;
    const trackField = document.getElementById('field-track');
    const moduleField = document.getElementById('field-module');
    
    if (type === 'lesson') {
        trackField.style.display = 'block';
        moduleField.style.display = 'block';
    } else {
        trackField.style.display = 'none';
        moduleField.style.display = 'none';
    }
}

// ЭКСПОРТИРУЕМ ФУНКЦИИ СРАЗУ (до инициализации), чтобы они были доступны в HTML
window.goBackSafe = goBackSafe;
window.openSearch = openSearch;
window.closeSearch = closeSearch;
window.updateEditorPreview = updateEditorPreview;
window.insertTemplate = insertTemplate;
window.copyEditorCode = copyEditorCode;
window.downloadMarkdown = downloadMarkdown;
window.togglePublishPanel = togglePublishPanel;
window.updateMetaFields = updateMetaFields;
window.publishToGitHub = publishToGitHub;

// Инициализация роутера и других глобальных слушателей
initRouter();
initSearch();
initGithubAuth();

// Слушатель секретного сочетания клавиш (Ctrl + Shift + E)
window.addEventListener("keydown", function(e) {
    if (e.ctrlKey && e.shiftKey && e.code === "KeyE") {
        e.preventDefault();
        window.location.hash = "editor";
    }
});

const mdInput = document.getElementById("markdown-input");
const mdPreview = document.getElementById("editor-preview");
const mdPlaceholder = document.getElementById("editor-placeholder");

if(mdInput && mdPreview) {
    mdInput.addEventListener("input", () => updateEditorPreview(mdInput, mdPreview, mdPlaceholder));
    
    // Синхронизация скролла
    mdInput.addEventListener("scroll", () => {
        const percentage = mdInput.scrollTop / (mdInput.scrollHeight - mdInput.clientHeight);
        mdPreview.scrollTop = percentage * (mdPreview.scrollHeight - mdPreview.clientHeight);
    });

    // Передаем эти элементы в функции для редактора
    window.insertTemplate = (type) => insertTemplate(mdInput, type);
    window.copyEditorCode = (event) => copyEditorCode(mdInput, event);
    window.downloadMarkdown = () => downloadMarkdown(mdInput);

    // Если мы на странице редактора, сразу обновляем превью
    if (window.location.hash === '#editor') {
        updateEditorPreview(mdInput, mdPreview, mdPlaceholder);
    }
}
