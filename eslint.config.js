import eslintPluginNode from 'eslint-plugin-node'
import eslintPluginPromise from 'eslint-plugin-promise'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
   {
      files: ['**/*.{js}'],
      languageOptions: {
         ecmaVersion: 2021,
         sourceType: 'module',
      },
      plugins: { eslintPluginNode, eslintPluginPromise },
      rules: {
         'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
         'no-console': ['warn', { allow: ['warn', 'error'] }],
         'prefer-const': 'error',
         eqeqeq: 'error',
         curly: ['error', 'all'],
         'node/no-unsupported-features/es-syntax': [
            'error',
            { ignores: ['modules'] },
         ],
         'node/no-missing-require': 'error',
         'node/no-extraneous-require': 'error',
         'promise/always-return': 'error',
         'promise/no-return-wrap': 'error',
         'promise/catch-or-return': 'error',
      },
   },
   {
      // Prettier integration for code formatting
      files: ['**/*.{js,json,md}'],
      plugins: { eslintPluginPrettier },
      rules: eslintConfigPrettier.rules,
   },
]
