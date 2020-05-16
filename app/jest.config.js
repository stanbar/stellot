// this config includes typescript specific settings
// and if you're not using typescript, you should remove `transform` property
module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '.*\\.test\\.(j|t)sx?$',
  testPathIgnorePatterns: ['lib/', 'node_modules/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'node',
  rootDir: 'src',
  globals: {
    'ts-jest': {
      isolatedModules: true // Disable type-checking
    }
  }
}