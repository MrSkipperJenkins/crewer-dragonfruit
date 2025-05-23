/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/'
  ]
};