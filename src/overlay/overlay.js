// Funcionalidad del overlay de chat
document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const chatContainer = document.getElementById('chat-container');
    const settingsButton = document.getElementById('settings-button');
    const minimizeButton = document.getElementById('minimize-button');
    const closeButton = document.getElementById('close-button');
    const resizeHandle = document.querySelector('.resize-handle-se');
    
    // Variables para el control de arrastre y redimensionamiento
    let isDragging = false;
    let isResizing = false;
    let dragStartX, dragStartY;
    let resizeStartWidth, resizeStartHeight;
    let initialX, initialY;
    
    // Configuración por defecto
    let config = {
        opacity: 0.8,
        maxMessages: 100,
        fontSize: 14,
        showBadges: true,
        showTimestamps: false
    };
    
    // Aplicar opacidad inicial
    document.querySelector('.overlay-container').style.backgroundColor = 
        `rgba(18, 18, 18, ${config.opacity})`;
    
    // Eventos de botones
    settingsButton.addEventListener('click', () => {
        window.electronAPI.openConfig();
    });
    
    minimizeButton.addEventListener('click', () => {
        // Minimizar la ventana (se implementará en el proceso principal)
    });
    
    closeButton.addEventListener('click', () => {
        window.close();
    });
    
    // Funcionalidad de arrastre para mover la ventana
    const dragHandle = document.querySelector('.drag-handle');
    
    dragHandle.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        
        // Obtener posición inicial de la ventana (se implementará con IPC)
        initialX = 0;
        initialY = 0;
        
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
    });
    
    function handleDragMove(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;
        
        // Enviar nueva posición al proceso principal
        window.electronAPI.moveOverlay({
            x: initialX + deltaX,
            y: initialY + deltaY
        });
    }
    
    function handleDragEnd() {
        isDragging = false;
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
    }
    
    // Funcionalidad de redimensionamiento
    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        e.preventDefault();
        
        // Obtener tamaño inicial
        resizeStartWidth = window.innerWidth;
        resizeStartHeight = window.innerHeight;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        
        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
    });
    
    function handleResizeMove(e) {
        if (!isResizing) return;
        
        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;
        
        const newWidth = Math.max(300, resizeStartWidth + deltaX);
        const newHeight = Math.max(200, resizeStartHeight + deltaY);
        
        // Enviar nuevo tamaño al proceso principal
        window.electronAPI.resizeOverlay({
            width: newWidth,
            height: newHeight
        });
    }
    
    function handleResizeEnd() {
        isResizing = false;
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
    }
    
    // Recibir actualizaciones de configuración
    window.electronAPI.onConfigUpdate((newConfig) => {
        config = { ...config, ...newConfig };
        applyConfig();
    });
    
    // Recibir actualizaciones de opacidad
    window.electronAPI.onOpacityUpdate((opacity) => {
        config.opacity = opacity;
        document.querySelector('.overlay-container').style.backgroundColor = 
            `rgba(18, 18, 18, ${opacity})`;
    });
    
    // Aplicar configuración
    function applyConfig() {
        // Aplicar opacidad
        document.querySelector('.overlay-container').style.backgroundColor = 
            `rgba(18, 18, 18, ${config.opacity})`;
        
        // Aplicar tamaño de fuente
        document.documentElement.style.setProperty('--font-size', `${config.fontSize}px`);
        
        // Otras configuraciones
        // ...
    }
    
    // Recibir mensajes de chat
    window.electronAPI.onChatMessage((message) => {
        addChatMessage(message);
    });
    
    // Añadir mensaje al chat
    function addChatMessage(message) {
        // Crear elemento de mensaje
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        
        // Crear cabecera del mensaje (usuario + insignias)
        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';
        
        // Nombre de usuario
        const username = document.createElement('span');
        username.className = 'username';
        username.textContent = message.sender.username;
        
        // Aplicar color personalizado si existe
        if (message.sender.identity && message.sender.identity.username_color) {
            username.style.color = message.sender.identity.username_color;
        }
        
        messageHeader.appendChild(username);
        
        // Añadir insignias si están habilitadas
        if (config.showBadges && message.sender.identity && message.sender.identity.badges) {
            message.sender.identity.badges.forEach(badge => {
                const badgeElement = document.createElement('span');
                badgeElement.className = `badge badge-${badge.type}`;
                badgeElement.textContent = badge.text;
                messageHeader.appendChild(badgeElement);
            });
        }
        
        messageElement.appendChild(messageHeader);
        
        // Contenido del mensaje
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Procesar emotes si existen
        if (message.emotes && message.emotes.length > 0) {
            let content = message.content;
            
            // Ordenar emotes por posición (de mayor a menor) para reemplazarlos correctamente
            const sortedEmotes = [...message.emotes].sort((a, b) => {
                return b.positions.s - a.positions.s;
            });
            
            // Reemplazar emotes en el texto
            sortedEmotes.forEach(emote => {
                const start = emote.positions.s;
                const end = emote.positions.e;
                
                // Crear elemento de emote (aquí se usaría una imagen real)
                const emoteHtml = `<span class="emote" title="${content.substring(start, end + 1)}">😀</span>`;
                
                // Reemplazar texto por emote
                content = content.substring(0, start) + emoteHtml + content.substring(end + 1);
            });
            
            messageContent.innerHTML = content;
        } else {
            // Sin emotes, solo texto
            messageContent.textContent = message.content;
        }
        
        messageElement.appendChild(messageContent);
        
        // Añadir mensaje al contenedor
        chatContainer.appendChild(messageElement);
        
        // Limitar número de mensajes
        while (chatContainer.children.length > config.maxMessages) {
            chatContainer.removeChild(chatContainer.firstChild);
        }
        
        // Scroll automático al último mensaje
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    // Mensajes de prueba para desarrollo
    if (process.env.NODE_ENV === 'development') {
        const testMessages = [
            {
                message_id: "msg1",
                sender: {
                    username: "Moderador123",
                    is_verified: true,
                    identity: {
                        username_color: "#FF9900",
                        badges: [
                            { text: "Mod", type: "moderator" }
                        ]
                    }
                },
                content: "¡Bienvenidos al stream de hoy!",
                emotes: []
            },
            {
                message_id: "msg2",
                sender: {
                    username: "Usuario456",
                    is_verified: false,
                    identity: {
                        username_color: "#00AAFF",
                        badges: [
                            { text: "Sub", type: "subscriber", count: 3 }
                        ]
                    }
                },
                content: "Hola a todos! 😀",
                emotes: [
                    { emote_id: "12345", positions: { s: 12, e: 13 } }
                ]
            }
        ];
        
        // Mostrar mensajes de prueba con retraso
        setTimeout(() => {
            testMessages.forEach((msg, index) => {
                setTimeout(() => {
                    addChatMessage(msg);
                }, index * 1000);
            });
        }, 500);
    }
});
