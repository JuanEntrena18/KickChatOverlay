// Módulo para la integración con la API de Kick.com
const axios = require('axios');
const EventEmitter = require('events');

class KickChatAPI extends EventEmitter {
    constructor() {
        super();
        this.baseUrl = 'https://api.kick.com/public/v1';
        this.token = null;
        this.channelId = null;
        this.channelSlug = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000; // 5 segundos
        this.pollingInterval = null;
        this.webhookEndpoint = null;
    }

    // Configurar la API con las credenciales y el canal
    async configure(config) {
        this.token = config.token;
        this.channelSlug = config.channelSlug;
        
        // Configurar axios con el token de autenticación
        this.api = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                'Accept': '*/*'
            }
        });
        
        // Obtener información del canal si solo tenemos el slug
        if (this.channelSlug && !this.channelId) {
            try {
                const response = await this.api.get(`/channels/${this.channelSlug}`);
                this.channelId = response.data.id;
                return true;
            } catch (error) {
                console.error('Error al obtener información del canal:', error);
                return false;
            }
        }
        
        return !!this.channelId;
    }

    // Conectar al chat del canal
    async connect(method = 'polling') {
        if (!this.channelId && !this.channelSlug) {
            throw new Error('Se requiere un ID o slug de canal para conectar al chat');
        }
        
        if (method === 'polling') {
            // Método de polling (consulta periódica)
            this.startPolling();
            this.isConnected = true;
            this.emit('connected', { channelId: this.channelId });
            return true;
        } else if (method === 'webhook') {
            // Método de webhook (requiere configuración adicional)
            if (!this.webhookEndpoint) {
                throw new Error('Se requiere un endpoint de webhook para este método');
            }
            
            try {
                // Suscribirse a eventos de chat
                await this.subscribeToEvents();
                this.isConnected = true;
                this.emit('connected', { channelId: this.channelId });
                return true;
            } catch (error) {
                console.error('Error al suscribirse a eventos:', error);
                return false;
            }
        }
        
        return false;
    }

    // Desconectar del chat
    disconnect() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        
        this.isConnected = false;
        this.emit('disconnected');
    }

    // Iniciar polling para recibir mensajes
    startPolling() {
        // Limpiar intervalo existente si hay uno
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        // Último ID de mensaje procesado
        let lastMessageId = null;
        
        // Crear intervalo para consultar nuevos mensajes
        this.pollingInterval = setInterval(async () => {
            try {
                // Consultar mensajes recientes
                const response = await this.api.get(`/channels/${this.channelSlug}/messages`, {
                    params: {
                        limit: 20,
                        after: lastMessageId
                    }
                });
                
                // Procesar mensajes nuevos (del más antiguo al más reciente)
                const messages = response.data.messages || [];
                if (messages.length > 0) {
                    // Actualizar último ID procesado
                    lastMessageId = messages[messages.length - 1].id;
                    
                    // Emitir eventos para cada mensaje
                    messages.forEach(message => {
                        this.emit('message', this.formatMessage(message));
                    });
                }
            } catch (error) {
                console.error('Error al obtener mensajes:', error);
                this.handleConnectionError();
            }
        }, 3000); // Consultar cada 3 segundos
    }

    // Suscribirse a eventos de chat mediante webhook
    async subscribeToEvents() {
        try {
            // Crear suscripción a eventos de chat
            const response = await this.api.post('/events/subscriptions', {
                event: 'chat.message.sent',
                channel_id: this.channelId,
                callback_url: this.webhookEndpoint
            });
            
            return response.data;
        } catch (error) {
            console.error('Error al suscribirse a eventos:', error);
            throw error;
        }
    }

    // Manejar errores de conexión
    handleConnectionError() {
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts <= this.maxReconnectAttempts) {
            console.log(`Intentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            // Intentar reconectar después de un retraso
            setTimeout(() => {
                this.connect()
                    .then(success => {
                        if (success) {
                            this.reconnectAttempts = 0;
                            console.log('Reconexión exitosa');
                        }
                    })
                    .catch(error => {
                        console.error('Error al reconectar:', error);
                    });
            }, this.reconnectDelay);
        } else {
            this.disconnect();
            this.emit('error', new Error('Número máximo de intentos de reconexión alcanzado'));
        }
    }

    // Formatear mensaje para el formato interno
    formatMessage(message) {
        return {
            message_id: message.id,
            sender: {
                user_id: message.sender.id,
                username: message.sender.username,
                is_verified: message.sender.is_verified,
                profile_picture: message.sender.profile_picture,
                channel_slug: message.sender.channel_slug,
                identity: message.sender.identity
            },
            content: message.content,
            emotes: message.emotes || [],
            created_at: message.created_at
        };
    }

    // Enviar mensaje al chat (si el usuario tiene permisos)
    async sendMessage(content) {
        if (!this.isConnected || !this.token) {
            throw new Error('No conectado o sin autenticación');
        }
        
        try {
            const response = await this.api.post('/chat', {
                broadcaster_user_id: this.channelId,
                content: content,
                type: 'user'
            });
            
            return response.data;
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            throw error;
        }
    }

    // Configurar endpoint de webhook
    setWebhookEndpoint(url) {
        this.webhookEndpoint = url;
    }
}

module.exports = KickChatAPI;
