const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Configuración
const appName = 'KickChatOverlay';
const version = '1.0.0';
const platforms = ['win', 'mac', 'linux'];

// Crear directorio de distribución
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Función para empaquetar para una plataforma específica
async function buildForPlatform(platform) {
  console.log(`Empaquetando para ${platform}...`);
  
  try {
    // Crear directorio para la plataforma
    const platformDir = path.join(distDir, platform);
    if (!fs.existsSync(platformDir)) {
      fs.mkdirSync(platformDir);
    }
    
    // Ejecutar comando de empaquetado según la plataforma
    switch (platform) {
      case 'win':
        execSync('npx electron-builder --win --dir', { stdio: 'inherit' });
        console.log('Creando archivo ZIP portable...');
        await createPortableZip(platform);
        break;
      case 'mac':
        execSync('npx electron-builder --mac --dir', { stdio: 'inherit' });
        break;
      case 'linux':
        execSync('npx electron-builder --linux --dir', { stdio: 'inherit' });
        break;
      default:
        console.error(`Plataforma desconocida: ${platform}`);
        return;
    }
    
    console.log(`Empaquetado para ${platform} completado.`);
  } catch (error) {
    console.error(`Error al empaquetar para ${platform}:`, error);
  }
}

// Función para crear un archivo ZIP portable (principalmente para Windows)
async function createPortableZip(platform) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(path.join(distDir, platform, `${appName}-${version}-${platform}.zip`));
    const archive = archiver('zip', {
      zlib: { level: 9 } // Nivel máximo de compresión
    });
    
    output.on('close', () => {
      console.log(`Archivo ZIP creado: ${archive.pointer()} bytes`);
      resolve();
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    archive.pipe(output);
    
    // Añadir archivos al ZIP
    const unpacked = path.join(distDir, platform, 'win-unpacked');
    archive.directory(unpacked, false);
    
    archive.finalize();
  });
}

// Función principal
async function main() {
  console.log(`Iniciando empaquetado de ${appName} v${version}`);
  
  // Copiar documentación a la carpeta de distribución
  const docsDir = path.join(distDir, 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir);
  }
  
  fs.copyFileSync(
    path.join(__dirname, 'docs', 'user_guide.md'),
    path.join(docsDir, 'user_guide.md')
  );
  
  // Empaquetar para todas las plataformas
  for (const platform of platforms) {
    await buildForPlatform(platform);
  }
  
  console.log('Empaquetado completado para todas las plataformas.');
}

// Ejecutar función principal
main().catch(console.error);
