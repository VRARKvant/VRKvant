/**
 * Логика отслеживания прогресса обучения (LocalStorage)
 */

const STORAGE_KEY = 'vrkvant_progress';

export function getReadLessons() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
        return [];
    }
}

export function isLessonRead(path) {
    const read = getReadLessons();
    return read.includes(path);
}

export function toggleLessonRead(path) {
    let read = getReadLessons();
    const index = read.indexOf(path);
    
    if (index === -1) {
        read.push(path);
    } else {
        read.splice(index, 1);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(read));
    return read.includes(path);
}

export function getTrackProgress(lessons) {
    if (!lessons || lessons.length === 0) return 0;
    const read = getReadLessons();
    const readInTrack = lessons.filter(l => {
        // Здесь нужно учитывать, что в манифесте может быть только имя файла
        // а в прогрессе - полный путь
        const path = l.file.includes('/') ? l.file : l.trackPath + '/' + l.file;
        return read.includes(path);
    });
    return Math.round((readInTrack.length / lessons.length) * 100);
}
