const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura a la ventana de renderizado
contextBridge.exposeInMainWorld('electronAPI', {
  // Funciones para el overlay
  showConfig: () => ipcRenderer.send('show-config'),
  minimizeOverlay: () => ipcRenderer.send('minimize-overlay'),
  closeOverlay: () => ipcRenderer.send('close-overlay'),
  onChatMessage: (callback) => ipcRenderer.on('chat-message', (event, message) => callback(message)),
  onLoadConfig: (callback) => ipcRenderer.on('load-config', (event, config) => callback(config)),
  
  // Funciones para el configurador
  updateConfig: (config) => ipcRenderer.send('update-config', config),
  configureChannel: (channelConfig) => ipcRenderer.send('configure-channel', channelConfig),
  disconnectChat: () => ipcRenderer.send('disconnect-chat'),
  onChatConnectionStatus: (callback) => ipcRenderer.on('chat-connection-status', (event, status) => callback(status)),
  
  // Funciones generales
  openExternalLink: (url) => ipcRenderer.send('open-external-link', url)
});
