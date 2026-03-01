module.exports = {
  verbose: true,
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // Redirige les imports CSS/SCSS vers le mock de style
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    // Redirige les imports d'images et fichiers statiques vers le mock de fichier
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transform: {
    // Utilise babel-jest pour transformer les fichiers JS et JSX
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
};