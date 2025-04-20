const { app, BrowserWindow, ipcMain, Menu, Tray, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const { initChatConnection, disconnectChat, sendChatMessage } = require('./chat-integration');

// Configuración
const store = new Store();
let mainWindow = null;
let configWindow = null;
let tray = null;
let isQuitting = false;

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
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../overlay/index.html'));

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
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  configWindow.loadFile(path.join(__dirname, '../config/index.html'));

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
  tray = new Tray(path.join(__dirname, '../assets/icon.png'));
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
  createTray();
  
  // Auto-conectar si está configurado
  if (store.get('channel.autoConnect', false)) {
    const channelConfig = store.get('channel', {});
    if (channelConfig.channelSlug) {
      initChatConnection(channelConfig, (message) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('chat-message', message);
        }
      });
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
  disconnectChat();
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
  
  // Iniciar conexión
  initChatConnection(channelConfig, (message) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('chat-message', message);
    }
  });
  
  // Actualizar estado en la ventana de configuración
  if (configWindow && !configWindow.isDestroyed()) {
    configWindow.webContents.send('chat-connection-status', {
      connected: false,
      error: null
    });
  }
});

ipcMain.on('disconnect-chat', () => {
  disconnectChat();
});

// Actualizar estado de conexión
global.updateConnectionStatus = (status) => {
  global.chatConnected = status.connected;
  global.connectionError = status.error;
  
  if (configWindow && !configWindow.isDestroyed()) {
    configWindow.webContents.send('chat-connection-status', status);
  }
};

// Enviar mensaje al chat
ipcMain.on('send-chat-message', (event, message) => {
  sendChatMessage(message);
});

// Abrir enlaces externos en el navegador predeterminado
ipcMain.on('open-external-link', (event, url) => {
  shell.openExternal(url);
});
