const fs = require('fs');
const path = require('path');

// Crear un icono básico para la aplicación
function createBasicIcon() {
  const iconDir = path.join(__dirname, 'assets');
  const iconPath = path.join(iconDir, 'icon.png');
  
  // Asegurarse de que el directorio existe
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
  }
  
  // Crear un archivo de icono básico si no existe
  if (!fs.existsSync(iconPath)) {
    // Este es un icono PNG muy básico (1x1 pixel negro)
    const basicIconData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(iconPath, basicIconData);
    console.log('Icono básico creado en:', iconPath);
  }
}

// Crear un archivo README.md
function createReadme() {
  const readmePath = path.join(__dirname, 'README.md');
  const readmeContent = `# Kick Chat Overlay

Un overlay para mostrar el chat de Kick.com por encima de cualquier aplicación.

## Características

- Ventana transparente que se puede mostrar sobre cualquier aplicación
- Capacidad para mover y redimensionar la ventana con el ratón
- Configurador personalizable para canal, transparencia, colores y tipos de letra
- Soporte para cinco idiomas: español, inglés, francés, alemán e italiano

## Instalación

Consulta la [Guía de Usuario](./docs/user_guide.md) para instrucciones detalladas de instalación y uso.

## Empaquetado

Para empaquetar la aplicación, consulta las [Instrucciones de Empaquetado](./docs/packaging_instructions.md).

## Licencia

MIT
`;
  
  fs.writeFileSync(readmePath, readmeContent);
  console.log('README.md creado en:', readmePath);
}

// Crear un archivo .gitignore
function createGitignore() {
  const gitignorePath = path.join(__dirname, '.gitignore');
  const gitignoreContent = `# Dependencias
node_modules/

# Archivos de distribución
dist/
out/

# Archivos de configuración local
.DS_Store
Thumbs.db

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Archivos de entorno
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Archivos de caché
.npm
.eslintcache
`;
  
  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log('.gitignore creado en:', gitignorePath);
}

// Función principal
function main() {
  console.log('Preparando archivos adicionales para el empaquetado...');
  
  createBasicIcon();
  createReadme();
  createGitignore();
  
  console.log('Preparación completada.');
}

// Ejecutar la función principal
main();
