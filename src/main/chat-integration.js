// Integración del API de Kick.com con el proceso principal de Electron
const { ipcMain } = require('electron');
const KickChatAPI = require('../api/kick-chat-api');

class ChatIntegration {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.api = new KickChatAPI();
        this.isConnected = false;
        this.channelConfig = null;
        
        // Configurar manejadores de eventos IPC
        this.setupIPCHandlers();
        
        // Configurar manejadores de eventos de la API
        this.setupAPIEventHandlers();
    }
    
    // Configurar manejadores de eventos IPC para comunicación con el renderer
    setupIPCHandlers() {
        // Configurar canal
        ipcMain.on('configure-channel', async (event, config) => {
            this.channelConfig = config;
            
            try {
                const success = await this.api.configure({
                    token: config.token,
                    channelSlug: config.channelSlug
                });
                
                if (success) {
                    event.reply('channel-configured', { success: true });
                } else {
                    event.reply('channel-configured', { 
                        success: false, 
                        error: 'No se pudo configurar el canal' 
                    });
                }
            } catch (error) {
                event.reply('channel-configured', { 
                    success: false, 
                    error: error.message 
                });
            }
        });
        
        // Conectar al chat
        ipcMain.on('connect-chat', async (event, options) => {
            if (!this.channelConfig) {
                event.reply('chat-connection-status', { 
                    connected: false, 
                    error: 'Canal no configurado' 
                });
                return;
            }
            
            try {
                const method = options?.method || 'polling';
                const success = await this.api.connect(method);
                
                if (success) {
                    this.isConnected = true;
                    event.reply('chat-connection-status', { connected: true });
                } else {
                    event.reply('chat-connection-status', { 
                        connected: false, 
                        error: 'No se pudo conectar al chat' 
                    });
                }
            } catch (error) {
                event.reply('chat-connection-status', { 
                    connected: false, 
                    error: error.message 
                });
            }
        });
        
        // Desconectar del chat
        ipcMain.on('disconnect-chat', (event) => {
            if (this.isConnected) {
                this.api.disconnect();
                this.isConnected = false;
                event.reply('chat-connection-status', { connected: false });
            }
        });
        
        // Enviar mensaje (si el usuario tiene permisos)
        ipcMain.on('send-chat-message', async (event, message) => {
            if (!this.isConnected) {
                event.reply('message-sent', { 
                    success: false, 
                    error: 'No conectado al chat' 
                });
                return;
            }
            
            try {
                const result = await this.api.sendMessage(message);
                event.reply('message-sent', { success: true, result });
            } catch (error) {
                event.reply('message-sent', { 
                    success: false, 
                    error: error.message 
                });
            }
        });
    }
    
    // Configurar manejadores de eventos de la API
    setupAPIEventHandlers() {
        // Recibir mensajes nuevos
        this.api.on('message', (message) => {
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('chat-message', message);
            }
        });
        
        // Evento de conexión
        this.api.on('connected', (data) => {
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('chat-connection-status', { 
                    connected: true,
                    channelId: data.channelId
                });
            }
        });
        
        // Evento de desconexión
        this.api.on('disconnected', () => {
            this.isConnected = false;
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('chat-connection-status', { 
                    connected: false 
                });
            }
        });
        
        // Evento de error
        this.api.on('error', (error) => {
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('chat-error', { 
                    message: error.message 
                });
            }
        });
    }
    
    // Verificar si está conectado
    isConnectedToChat() {
        return this.isConnected;
    }
    
    // Obtener configuración actual
    getCurrentConfig() {
        return this.channelConfig;
    }
}

module.exports = ChatIntegration;
