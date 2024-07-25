import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    'dist',
  ],
  rules: {
    'no-console': 'off',
  },
})
