import { describe, it, expect } from 'vitest';
import { groupLessonsByModule } from '../js/ui.js';

describe('groupLessonsByModule', () => {
    it('should group lessons by their module', () => {
        const lessons = [
            { title: 'Lesson 1', module: 'Module A' },
            { title: 'Lesson 2', module: 'Module B' },
            { title: 'Lesson 3', module: 'Module A' }
        ];
        
        const result = groupLessonsByModule(lessons);
        
        expect(result).toEqual({
            'Module A': [
                { title: 'Lesson 1', module: 'Module A' },
                { title: 'Lesson 3', module: 'Module A' }
            ],
            'Module B': [
                { title: 'Lesson 2', module: 'Module B' }
            ]
        });
    });

    it('should put lessons without a module into "Разное"', () => {
        const lessons = [
            { title: 'Lesson 1', module: 'Module A' },
            { title: 'Lesson 2' }
        ];
        
        const result = groupLessonsByModule(lessons);
        
        expect(result).toEqual({
            'Module A': [{ title: 'Lesson 1', module: 'Module A' }],
            'Разное': [{ title: 'Lesson 2' }]
        });
    });

    it('should return empty object for empty input', () => {
        expect(groupLessonsByModule([])).toEqual({});
        expect(groupLessonsByModule(null)).toEqual({});
    });
});
