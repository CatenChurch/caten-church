import js from '@eslint/js'
import globals from 'globals'
import prettier from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  prettier,
  {
    files: ['app/javascript/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser }
    }
  }
]
