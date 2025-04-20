// Módulo de traducción actualizado para el overlay de chat de Kick.com
const i18next = require('i18next');
const fs = require('fs');
const path = require('path');

// Cargar archivos de traducción
function loadTranslations() {
  const localesDir = path.join(__dirname, '../locales');
  const translations = {};
  
  try {
    // Verificar que el directorio existe
    if (fs.existsSync(localesDir)) {
      // Leer todos los archivos JSON del directorio de locales
      const files = fs.readdirSync(localesDir).filter(file => file.endsWith('.json'));
      
      files.forEach(file => {
        const locale = file.replace('.json', '');
        const filePath = path.join(localesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        translations[locale] = {
          translation: JSON.parse(content)
        };
      });
    }
  } catch (error) {
    console.error('Error al cargar traducciones:', error);
  }
  
  return translations;
}

// Inicializar el sistema de traducción
async function initTranslation(language = 'es') {
  const translations = loadTranslations();
  
  await i18next.init({
    lng: language,
    fallbackLng: 'en',
    resources: translations
  });
  
  return i18next;
}

// Obtener traducción
function t(key, options = {}) {
  return i18next.t(key, options);
}

// Cambiar idioma
function changeLanguage(language) {
  return i18next.changeLanguage(language);
}

// Obtener idioma actual
function getCurrentLanguage() {
  return i18next.language;
}

// Obtener idiomas disponibles
function getAvailableLanguages() {
  const localesDir = path.join(__dirname, '../locales');
  try {
    if (fs.existsSync(localesDir)) {
      return fs.readdirSync(localesDir)
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    }
  } catch (error) {
    console.error('Error al obtener idiomas disponibles:', error);
  }
  return ['en', 'es', 'fr', 'de', 'it']; // Valores por defecto
}

// Exportar funciones
module.exports = {
  initTranslation,
  t,
  changeLanguage,
  getCurrentLanguage,
  getAvailableLanguages
};
