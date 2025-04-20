// Funcionalidad del configurador
document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const saveButton = document.getElementById('save-button');
    const cancelButton = document.getElementById('cancel-button');
    const languageSelect = document.getElementById('language-select');
    
    // Elementos de la pestaña de conexión
    const channelSlugInput = document.getElementById('channel-slug');
    const authTokenInput = document.getElementById('auth-token');
    const connectionMethodRadios = document.querySelectorAll('input[name="connection-method"]');
    const webhookSettings = document.querySelector('.webhook-settings');
    const webhookPortInput = document.getElementById('webhook-port');
    const autoConnectCheckbox = document.getElementById('auto-connect');
    const connectButton = document.getElementById('connect-button');
    const disconnectButton = document.getElementById('disconnect-button');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    
    // Elementos de la pestaña de apariencia
    const opacitySlider = document.getElementById('opacity-slider');
    const opacityValue = document.getElementById('opacity-value');
    const fontFamilySelect = document.getElementById('font-family');
    const fontSizeSlider = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    const backgroundColorInput = document.getElementById('background-color');
    const textColorInput = document.getElementById('text-color');
    const usernameColorInput = document.getElementById('username-color');
    const showBadgesCheckbox = document.getElementById('show-badges');
    const showTimestampsCheckbox = document.getElementById('show-timestamps');
    const chatPreview = document.getElementById('chat-preview');
    
    // Elementos de la pestaña de comportamiento
    const maxMessagesInput = document.getElementById('max-messages');
    const alwaysOnTopCheckbox = document.getElementById('always-on-top');
    const animateMessagesCheckbox = document.getElementById('animate-messages');
    const autoScrollCheckbox = document.getElementById('auto-scroll');
    const minimizeToTrayCheckbox = document.getElementById('minimize-to-tray');
    const startWithSystemCheckbox = document.getElementById('start-with-system');
    
    // Configuración actual
    let currentConfig = {
        channel: {
            channelSlug: '',
            token: '',
            connectionMethod: 'polling',
            webhookPort: 3000,
            autoConnect: false
        },
        appearance: {
            opacity: 0.8,
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontSize: 14,
            backgroundColor: '#121212',
            textColor: '#ffffff',
            usernameColor: '#00ff00',
            showBadges: true,
            showTimestamps: false
        },
        behavior: {
            maxMessages: 100,
            alwaysOnTop: true,
            animateMessages: true,
            autoScroll: true,
            minimizeToTray: false,
            startWithSystem: false
        },
        language: 'es'
    };
    
    // Estado de conexión
    let isConnected = false;
    
    // Cambiar entre pestañas
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Desactivar todas las pestañas
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Activar la pestaña seleccionada
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // Mostrar/ocultar configuración de webhook
    connectionMethodRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'webhook') {
                webhookSettings.style.display = 'block';
            } else {
                webhookSettings.style.display = 'none';
            }
        });
    });
    
    // Actualizar valor de opacidad en tiempo real
    opacitySlider.addEventListener('input', () => {
        const value = opacitySlider.value;
        opacityValue.textContent = `${value}%`;
        updatePreview();
    });
    
    // Actualizar valor de tamaño de fuente en tiempo real
    fontSizeSlider.addEventListener('input', () => {
        const value = fontSizeSlider.value;
        fontSizeValue.textContent = `${value}px`;
        updatePreview();
    });
    
    // Actualizar vista previa cuando cambian los valores
    [fontFamilySelect, backgroundColorInput, textColorInput, usernameColorInput, 
     showBadgesCheckbox, showTimestampsCheckbox].forEach(element => {
        element.addEventListener('change', updatePreview);
        element.addEventListener('input', updatePreview);
    });
    
    // Actualizar vista previa
    function updatePreview() {
        // Actualizar fondo
        const opacity = opacitySlider.value / 100;
        const bgColor = backgroundColorInput.value;
        const rgbValues = hexToRgb(bgColor);
        chatPreview.style.backgroundColor = `rgba(${rgbValues.r}, ${rgbValues.g}, ${rgbValues.b}, ${opacity})`;
        
        // Actualizar texto
        chatPreview.style.color = textColorInput.value;
        chatPreview.style.fontFamily = fontFamilySelect.value;
        chatPreview.style.fontSize = `${fontSizeSlider.value}px`;
        
        // Actualizar nombres de usuario
        const usernameElements = document.querySelectorAll('.preview-username');
        usernameElements.forEach(element => {
            element.style.color = usernameColorInput.value;
        });
        
        // Mostrar/ocultar insignias
        const badgeElements = document.querySelectorAll('.preview-badge');
        badgeElements.forEach(element => {
            element.style.display = showBadgesCheckbox.checked ? 'inline-flex' : 'none';
        });
    }
    
    // Convertir color hex a RGB
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }
    
    // Cargar configuración
    function loadConfig(config) {
        if (!config) return;
        
        // Actualizar configuración actual
        currentConfig = {
            ...currentConfig,
            ...config
        };
        
        // Aplicar idioma
        if (config.language) {
            languageSelect.value = config.language;
        }
        
        // Aplicar configuración de canal
        if (config.channel) {
            channelSlugInput.value = config.channel.channelSlug || '';
            authTokenInput.value = config.channel.token || '';
            
            // Método de conexión
            const methodRadio = document.querySelector(`input[name="connection-method"][value="${config.channel.connectionMethod || 'polling'}"]`);
            if (methodRadio) methodRadio.checked = true;
            
            // Mostrar/ocultar configuración de webhook
            webhookSettings.style.display = config.channel.connectionMethod === 'webhook' ? 'block' : 'none';
            
            // Puerto de webhook
            webhookPortInput.value = config.channel.webhookPort || 3000;
            
            // Conexión automática
            autoConnectCheckbox.checked = config.channel.autoConnect || false;
        }
        
        // Aplicar configuración de apariencia
        if (config.appearance) {
            // Opacidad
            const opacity = Math.round((config.appearance.opacity || 0.8) * 100);
            opacitySlider.value = opacity;
            opacityValue.textContent = `${opacity}%`;
            
            // Tipo de letra
            fontFamilySelect.value = config.appearance.fontFamily || "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
            
            // Tamaño de letra
            fontSizeSlider.value = config.appearance.fontSize || 14;
            fontSizeValue.textContent = `${fontSizeSlider.value}px`;
            
            // Colores
            backgroundColorInput.value = config.appearance.backgroundColor || '#121212';
            textColorInput.value = config.appearance.textColor || '#ffffff';
            usernameColorInput.value = config.appearance.usernameColor || '#00ff00';
            
            // Opciones de visualización
            showBadgesCheckbox.checked = config.appearance.showBadges !== false;
            showTimestampsCheckbox.checked = config.appearance.showTimestamps || false;
        }
        
        // Aplicar configuración de comportamiento
        if (config.behavior) {
            maxMessagesInput.value = config.behavior.maxMessages || 100;
            alwaysOnTopCheckbox.checked = config.behavior.alwaysOnTop !== false;
            animateMessagesCheckbox.checked = config.behavior.animateMessages !== false;
            autoScrollCheckbox.checked = config.behavior.autoScroll !== false;
            minimizeToTrayCheckbox.checked = config.behavior.minimizeToTray || false;
            startWithSystemCheckbox.checked = config.behavior.startWithSystem || false;
        }
        
        // Actualizar vista previa
        updatePreview();
    }
    
    // Guardar configuración
    function saveConfig() {
        // Recopilar configuración actual
        const config = {
            channel: {
                channelSlug: channelSlugInput.value,
                token: authTokenInput.value,
                connectionMethod: document.querySelector('input[name="connection-method"]:checked').value,
                webhookPort: parseInt(webhookPortInput.value),
                autoConnect: autoConnectCheckbox.checked
            },
            appearance: {
                opacity: opacitySlider.value / 100,
                fontFamily: fontFamilySelect.value,
                fontSize: parseInt(fontSizeSlider.value),
                backgroundColor: backgroundColorInput.value,
                textColor: textColorInput.value,
                usernameColor: usernameColorInput.value,
                showBadges: showBadgesCheckbox.checked,
                showTimestamps: showTimestampsCheckbox.checked
            },
            behavior: {
                maxMessages: parseInt(maxMessagesInput.value),
                alwaysOnTop: alwaysOnTopCheckbox.checked,
                animateMessages: animateMessagesCheckbox.checked,
                autoScroll: autoScrollCheckbox.checked,
                minimizeToTray: minimizeToTrayCheckbox.checked,
                startWithSystem: startWithSystemCheckbox.checked
            },
            language: languageSelect.value
        };
        
        // Enviar configuración al proceso principal
        window.electronAPI.updateConfig(config);
        
        // Actualizar configuración actual
        currentConfig = config;
        
        // Mostrar mensaje de éxito
        alert('Configuración guardada correctamente');
    }
    
    // Conectar al chat
    function connectToChat() {
        if (!channelSlugInput.value) {
            alert('Por favor, introduce el nombre del canal');
            return;
        }
        
        // Actualizar interfaz
        connectButton.disabled = true;
        statusText.textContent = 'Conectando...';
        
        // Configurar canal
        window.electronAPI.configureChannel({
            channelSlug: channelSlugInput.value,
            token: authTokenInput.value,
            connectionMethod: document.querySelector('input[name="connection-method"]:checked').value,
            webhookPort: parseInt(webhookPortInput.value)
        });
    }
    
    // Desconectar del chat
    function disconnectFromChat() {
        window.electronAPI.disconnectChat();
    }
    
    // Eventos de botones
    connectButton.addEventListener('click', connectToChat);
    disconnectButton.addEventListener('click', disconnectFromChat);
    saveButton.addEventListener('click', saveConfig);
    cancelButton.addEventListener('click', () => window.close());
    
    // Cambio de idioma
    languageSelect.addEventListener('change', () => {
        // Aquí se implementará el cambio de idioma
        // Por ahora solo actualizamos la configuración
        currentConfig.language = languageSelect.value;
    });
    
    // Recibir estado de conexión
    window.electronAPI.onChatConnectionStatus((status) => {
        isConnected = status.connected;
        
        if (status.connected) {
            statusIndicator.className = 'status-indicator status-connected';
            statusText.textContent = 'Conectado';
            connectButton.disabled = true;
            disconnectButton.disabled = false;
        } else {
            statusIndicator.className = 'status-indicator status-disconnected';
            statusText.textContent = status.error || 'Desconectado';
            connectButton.disabled = false;
            disconnectButton.disabled = true;
        }
    });
    
    // Recibir configuración del proceso principal
    window.electronAPI.onLoadConfig((config) => {
        loadConfig(config);
    });
    
    // Inicializar vista previa
    updatePreview();
});
