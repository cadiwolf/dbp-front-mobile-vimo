const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configuraciones personalizadas para mejor rendimiento
config.resolver.alias = {
  '@': './src',
  '@components': './src/components',
  '@screens': './src/screens',
  '@navigation': './src/navigation',
  '@api': './src/api',
  '@utils': './src/utils',
  '@assets': './src/assets',
  '@hooks': './src/hooks',
};

module.exports = config;
