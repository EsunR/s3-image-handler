module.exports = {
    extends: [
        'plugin:prettier/recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['prettier', '@typescript-eslint'],
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    env: {
        node: true,
    },
    rules: {
        '@typescript-eslint/no-explicit-any': 'off',
    },
    root: true,
};
