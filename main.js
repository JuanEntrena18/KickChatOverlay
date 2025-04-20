const { app, BrowserWindow, ipcMain, Menu, Tray, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// Configuración
const store = new Store();
let mainWindow = null;
let configWindow = null;
let tray = null;
let isQuitting = false;

// Variables globales
global.chatConnected = false;
global.connectionError = null;

// Crear ventana principal (overlay)
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    x: store.get('windowPosition.x', 10),
    y: store.get('windowPosition.y', 10),
    frame: false,
    transparent: true,
    alwaysOnTop: store.get('behavior.alwaysOnTop', true),
    webPreferences: {
      preload: path.join(__dirname, 'src/main/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src/overlay/index.html'));

  // Guardar posición de la ventana al moverla
  mainWindow.on('moved', () => {
    const position = mainWindow.getPosition();
    store.set('windowPosition', { x: position[0], y: position[1] });
  });

  // Guardar tamaño de la ventana al redimensionarla
  mainWindow.on('resized', () => {
    const size = mainWindow.getSize();
    store.set('windowSize', { width: size[0], height: size[1] });
  });

  // Manejar cierre de la ventana
  mainWindow.on('close', (event) => {
    if (!isQuitting && store.get('behavior.minimizeToTray', false)) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
    return true;
  });

  // Enviar configuración al overlay
  mainWindow.webContents.on('did-finish-load', () => {
    const config = {
      appearance: store.get('appearance', {}),
      behavior: store.get('behavior', {})
    };
    mainWindow.webContents.send('load-config', config);
  });
}

// Crear ventana de configuración
function createConfigWindow() {
  if (configWindow) {
    configWindow.focus();
    return;
  }

  configWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Kick Chat Overlay - Configuración',
    webPreferences: {
      preload: path.join(__dirname, 'src/main/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  configWindow.loadFile(path.join(__dirname, 'src/config/index.html'));

  // Enviar configuración actual
  configWindow.webContents.on('did-finish-load', () => {
    const config = {
      channel: store.get('channel', {}),
      appearance: store.get('appearance', {}),
      behavior: store.get('behavior', {}),
      language: store.get('language', 'es')
    };
    configWindow.webContents.send('load-config', config);
    
    // Enviar estado de conexión
    const connectionStatus = {
      connected: global.chatConnected || false,
      error: global.connectionError || null
    };
    configWindow.webContents.send('chat-connection-status', connectionStatus);
  });

  configWindow.on('closed', () => {
    configWindow = null;
  });
}

// Crear icono en la bandeja del sistema
function createTray() {
  const iconPath = path.join(__dirname, 'assets/icon.png');
  // Verificar si el archivo existe, si no, usar un icono por defecto
  if (!fs.existsSync(iconPath)) {
    console.warn('Icono no encontrado, usando icono por defecto');
  }
  
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Mostrar Overlay', click: () => mainWindow.show() },
    { label: 'Configuración', click: () => createConfigWindow() },
    { type: 'separator' },
    { label: 'Salir', click: () => {
      isQuitting = true;
      app.quit();
    }}
  ]);
  tray.setToolTip('Kick Chat Overlay');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

// Inicializar la aplicación
app.whenReady().then(() => {
  createMainWindow();
  
  try {
    createTray();
  } catch (error) {
    console.error('Error al crear el icono en la bandeja:', error);
  }
  
  // Auto-conectar si está configurado
  if (store.get('channel.autoConnect', false)) {
    const channelConfig = store.get('channel', {});
    if (channelConfig.channelSlug) {
      // Simulamos la conexión para la demo
      console.log('Auto-conectando al canal:', channelConfig.channelSlug);
      global.chatConnected = true;
    }
  }
  
  // Mostrar configuración en el primer inicio
  if (store.get('firstRun', true)) {
    createConfigWindow();
    store.set('firstRun', false);
  }
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Salir cuando todas las ventanas estén cerradas (excepto en macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Limpiar recursos al salir
app.on('before-quit', () => {
  isQuitting = true;
  // Desconectar chat si es necesario
});

// Manejar eventos IPC
ipcMain.on('show-config', () => {
  createConfigWindow();
});

ipcMain.on('minimize-overlay', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('close-overlay', () => {
  if (mainWindow) {
    if (store.get('behavior.minimizeToTray', false)) {
      mainWindow.hide();
    } else {
      mainWindow.close();
    }
  }
});

ipcMain.on('update-config', (event, config) => {
  // Guardar configuración
  if (config.channel) store.set('channel', config.channel);
  if (config.appearance) store.set('appearance', config.appearance);
  if (config.behavior) store.set('behavior', config.behavior);
  if (config.language) store.set('language', config.language);
  
  // Actualizar configuración en el overlay
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('load-config', {
      appearance: config.appearance,
      behavior: config.behavior
    });
    
    // Actualizar alwaysOnTop
    if (config.behavior && config.behavior.alwaysOnTop !== undefined) {
      mainWindow.setAlwaysOnTop(config.behavior.alwaysOnTop);
    }
  }
});

ipcMain.on('configure-channel', (event, channelConfig) => {
  // Guardar configuración del canal
  store.set('channel', channelConfig);
  
  // Simulamos la conexión para la demo
  console.log('Conectando al canal:', channelConfig.channelSlug);
  global.chatConnected = true;
  
  // Actualizar estado en la ventana de configuración
  if (configWindow && !configWindow.isDestroyed()) {
    configWindow.webContents.send('chat-connection-status', {
      connected: true,
      error: null
    });
  }
});

ipcMain.on('disconnect-chat', () => {
  // Simulamos la desconexión para la demo
  console.log('Desconectando del chat');
  global.chatConnected = false;
  
  // Actualizar estado en la ventana de configuración
  if (configWindow && !configWindow.isDestroyed()) {
    configWindow.webContents.send('chat-connection-status', {
      connected: false,
      error: null
    });
  }
});

// Abrir enlaces externos en el navegador predeterminado
ipcMain.on('open-external-link', (event, url) => {
  shell.openExternal(url);
});
