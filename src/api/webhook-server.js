// Utilidad para manejar la conexión con webhooks de Kick.com
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

class WebhookServer {
    constructor(options = {}) {
        this.port = options.port || 3000;
        this.path = options.path || '/webhook';
        this.publicKey = options.publicKey || '';
        this.app = express();
        this.server = null;
        this.callbacks = {
            'chat.message.sent': []
        };
        
        // Configurar middleware
        this.app.use(bodyParser.json());
        
        // Configurar ruta de webhook
        this.app.post(this.path, this.handleWebhook.bind(this));
    }
    
    // Iniciar servidor
    start() {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.port, () => {
                    console.log(`Servidor webhook escuchando en el puerto ${this.port}`);
                    resolve(this.port);
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Detener servidor
    stop() {
        return new Promise((resolve, reject) => {
            if (this.server) {
                this.server.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.server = null;
                        console.log('Servidor webhook detenido');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
    
    // Manejar solicitudes de webhook
    handleWebhook(req, res) {
        // Verificar firma si hay clave pública
        if (this.publicKey) {
            const signature = req.headers['kick-event-signature'];
            if (!signature || !this.verifySignature(req.body, signature)) {
                console.error('Firma de webhook inválida');
                return res.status(401).send('Firma inválida');
            }
        }
        
        // Obtener tipo de evento
        const eventType = req.headers['kick-event-type'];
        if (!eventType) {
            return res.status(400).send('Tipo de evento no especificado');
        }
        
        // Procesar evento
        console.log(`Evento recibido: ${eventType}`);
        
        // Llamar a los callbacks registrados para este tipo de evento
        if (this.callbacks[eventType]) {
            this.callbacks[eventType].forEach(callback => {
                try {
                    callback(req.body);
                } catch (error) {
                    console.error(`Error en callback para ${eventType}:`, error);
                }
            });
        }
        
        // Responder con éxito
        res.status(200).send('OK');
    }
    
    // Verificar firma del webhook
    verifySignature(payload, signature) {
        try {
            const verifier = crypto.createVerify('RSA-SHA256');
            verifier.update(JSON.stringify(payload));
            return verifier.verify(this.publicKey, signature, 'base64');
        } catch (error) {
            console.error('Error al verificar firma:', error);
            return false;
        }
    }
    
    // Registrar callback para un tipo de evento
    on(eventType, callback) {
        if (!this.callbacks[eventType]) {
            this.callbacks[eventType] = [];
        }
        
        this.callbacks[eventType].push(callback);
    }
    
    // Obtener URL pública (para desarrollo, requeriría un servicio de túnel como ngrok)
    getPublicUrl() {
        return `http://localhost:${this.port}${this.path}`;
    }
}

module.exports = WebhookServer;
