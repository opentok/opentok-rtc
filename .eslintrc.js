module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2020: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'no-param-reassign': 0,
    'no-undef': 0,
    'no-unused-expressions': 0,
    'no-underscore-dangle': 0,
    'no-shadow': 0,
    'no-use-before-define': 0,
    'max-classes-per-file': 0,
    'no-plusplus': 0,
    'func-names': 0,
    'no-console': 0,
    'no-restricted-globals': 0,
    'prefer-rest-params': 0,
    'consistent-return': 0,
    'comma-dangle': ['error', 'never'],
  },
};
