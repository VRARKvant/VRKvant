const js = require('@eslint/js');
const prettier = require('eslint-config-prettier');
const globals = require('globals');

module.exports = [
    js.configs.recommended,
    {
        files: ['js/**/*.js', 'tests/**/*.js', 'e2e/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.jest,
                Fuse: 'readonly',
                vi: 'readonly',
                hljs: 'readonly',
                marked: 'readonly',
                ForceGraph: 'readonly',
                d3: 'readonly',
                global: 'readonly',
                process: 'readonly'
            },
            ecmaVersion: 2021,
            sourceType: 'module'
        },
        rules: {
            'no-unused-vars': 'warn',
            'no-console': 'off'
        }
    },
    {
        files: ['scripts/**/*.js', 'eslint.config.js'],
        languageOptions: {
            globals: {
                ...globals.node
            },
            ecmaVersion: 2021,
            sourceType: 'commonjs'
        },
        rules: {
            'no-unused-vars': 'warn',
            'no-console': 'off'
        }
    },
    prettier
];
