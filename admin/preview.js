// Инициализация парсера Markdown
const md = window.markdownit({ html: true });

// Создаем React-компонент для предпросмотра
var ArticlePreview = createClass({
    render: function() {
        const entry = this.props.entry;
        const title = entry.getIn(['data', 'title']) || '';
        const body = entry.getIn(['data', 'body']) || '';
        
        let htmlContent = md.render(body);
        
        // Кастомные теги -> красивые заглушки для админки
        htmlContent = htmlContent.replace(/\[gallery:\s*(.+?)\]/g, (match, path) => {
            return `<div style="border: 2px dashed #9333ea; padding: 20px; margin: 10px 0; border-radius: 12px; text-align: center; background: rgba(147, 51, 234, 0.1);">
                🖼️ <b>Галерея изображений</b><br><small style="color: #666;">${path}</small><br><small>(На финальном сайте здесь будет сетка с лайтбоксом)</small>
            </div>`;
        });
        
        htmlContent = htmlContent.replace(/\[compare:\s*([^,]+),\s*([^\]]+)\]/g, (match, img1, img2) => {
            return `<div style="border: 2px dashed #3b82f6; padding: 20px; margin: 10px 0; border-radius: 12px; text-align: center; background: rgba(59, 130, 246, 0.1);">
                ⚖️ <b>Сравнение (До/После)</b><br>
                <small style="color: #666;">${img1} vs ${img2}</small>
            </div>`;
        });

        htmlContent = htmlContent.replace(/\[video:\s*(.+?)\]/g, (match, url) => {
            return `<div style="border: 2px dashed #ef4444; padding: 20px; margin: 10px 0; border-radius: 12px; text-align: center; background: rgba(239, 68, 68, 0.1);">
                🎥 <b>Видео</b><br><small style="color: #666;">${url}</small>
            </div>`;
        });

        htmlContent = htmlContent.replace(/\[blueprint:\s*(.+?)\]/g, (match, url) => {
            return `<div style="border: 2px dashed #10b981; padding: 20px; margin: 10px 0; border-radius: 12px; text-align: center; background: rgba(16, 185, 129, 0.1);">
                🧩 <b>Блюпринт (Unreal Engine)</b><br><small style="color: #666;">${url}</small>
            </div>`;
        });

        // Рендер через встроенный 'h'
        return h('div', { className: 'prose mx-auto' },
            h('h1', { style: { marginTop: '20px', marginBottom: '20px' } }, title),
            h('div', { dangerouslySetInnerHTML: { __html: htmlContent } })
        );
    }
});

// Подключаем стили основного сайта к iframe предпросмотра
CMS.registerPreviewStyle('../css/style.css');

// Регистрируем кастомный шаблон для каждой коллекции
CMS.registerPreviewTemplate('unity', ArticlePreview);
CMS.registerPreviewTemplate('unreal', ArticlePreview);
CMS.registerPreviewTemplate('blender', ArticlePreview);
CMS.registerPreviewTemplate('cheats', ArticlePreview);
