import { processCustomTags } from '../js/markdown.js';

// Инициализация парсера Markdown
const md = window.markdownit({ html: true });

// Создаем React-компонент для предпросмотра
var ArticlePreview = createClass({
    render: function() {
        const entry = this.props.entry;
        const title = entry.getIn(['data', 'title']) || '';
        const body = entry.getIn(['data', 'body']) || '';
        
        // Обработка кастомных тегов оригинальной функцией
        let processedBody = processCustomTags(body);
        
        // Рендеринг в HTML
        let htmlContent = md.render(processedBody);
        
        // Рендер через встроенный 'h'
        return h('div', { className: 'prose mx-auto dark:prose-invert p-6' },
            h('h1', { style: { marginTop: '20px', marginBottom: '20px' } }, title),
            h('div', { dangerouslySetInnerHTML: { __html: htmlContent } })
        );
    }
});

// Подключаем стили основного сайта к iframe предпросмотра (сбрасываем кэш)
CMS.registerPreviewStyle('../css/style.css?v=3');

// Регистрируем кастомный шаблон для каждой коллекции
CMS.registerPreviewTemplate('unity', ArticlePreview);
CMS.registerPreviewTemplate('unreal', ArticlePreview);
CMS.registerPreviewTemplate('blender', ArticlePreview);
CMS.registerPreviewTemplate('cheats', ArticlePreview);
