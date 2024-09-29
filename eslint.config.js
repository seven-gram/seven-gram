import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    'dist',
  ],
  rules: {
    'no-console': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': 'warn',
    'antfu/no-top-level-await': 'off',
  },
})
