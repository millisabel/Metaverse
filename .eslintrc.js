module.exports = {
    root: true,
    parser: 'espree',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
    },
    env: {
        browser: true,
        es6: true
    },
    rules: {
        'no-unused-vars': 'warn',
        'no-console': 'off'
    },
    overrides: [
        {
            files: ['*.js'],
            rules: {
                '@typescript-eslint/no-var-requires': 'off',
                '@typescript-eslint/explicit-function-return-type': 'off',
                '@typescript-eslint/no-unused-vars': 'off'
            }
        }
    ]
}; 