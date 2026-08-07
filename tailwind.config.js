/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './index.html',
        './admin/**/*.html',
        './admin/**/*.js',
        './js/**/*.js',
        './articles/**/*.md',
        './articles/*.json',
        './games/**/*.html'
    ],
    safelist: [
        'bg-kvant',
        'text-kvant',
        'ring-kvant/20',
        'is-read',
        'active-tab',
        'bg-emerald-500',
        'text-emerald-500',
        'bg-amber-500',
        'text-amber-500'
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                kvant: '#8b5cf6'
            }
        }
    },
    plugins: [require('@tailwindcss/typography')]
};
