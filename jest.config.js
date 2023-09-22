/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  verbose: true,
  moduleNameMapper: {
    '^.+\\.(css|less|scss)$': 'babel-jest',
  },
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
  },
}
