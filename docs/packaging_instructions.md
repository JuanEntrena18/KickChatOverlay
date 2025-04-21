# Instrucciones de Empaquetado - Kick Chat Overlay

Este documento describe el proceso para empaquetar la aplicación Kick Chat Overlay para diferentes plataformas.

## Requisitos Previos

Asegúrate de tener instalado:

- Node.js (v14 o superior)
- npm (v6 o superior)
- Git

## Preparación del Entorno

1. Clona el repositorio:
```bash
git clone https://github.com/JuanEntrena18/kick_chat_overlay
cd kick-chat-overlay
```

2. Instala las dependencias:
```bash
npm install
```

## Empaquetado para Windows

```bash
npm run build:win
```

Esto generará:
- Un instalador `.exe` en la carpeta `dist`
- Un archivo portable `.zip` en la carpeta `dist`

## Empaquetado para macOS

```bash
npm run build:mac
```

Esto generará:
- Un archivo `.dmg` en la carpeta `dist`
- Un archivo `.app` en la carpeta `dist/mac`

## Empaquetado para Linux

```bash
npm run build:linux
```

Esto generará:
- Un archivo `.AppImage` en la carpeta `dist`
- Un archivo `.deb` para distribuciones basadas en Debian
- Un archivo `.rpm` para distribuciones basadas en Red Hat

## Empaquetado para Todas las Plataformas

```bash
npm run build
```

## Notas Importantes

- Asegúrate de que la versión en `package.json` sea correcta antes de empaquetar
- Para firmar los paquetes de macOS, necesitarás un certificado de desarrollador de Apple
- Para distribución en Windows, considera obtener un certificado de firma de código

## Estructura de Archivos de Distribución

```
dist/
├── win/
│   ├── KickChatOverlay-Setup-1.0.0.exe
│   └── KickChatOverlay-1.0.0-win.zip
├── mac/
│   ├── KickChatOverlay-1.0.0.dmg
│   └── KickChatOverlay.app/
├── linux/
│   ├── KickChatOverlay-1.0.0.AppImage
│   ├── kick-chat-overlay_1.0.0_amd64.deb
│   └── kick-chat-overlay-1.0.0.x86_64.rpm
└── latest.yml
```

## Verificación Post-Empaquetado

Después de empaquetar, verifica:

1. Que la aplicación se inicia correctamente
2. Que todas las funcionalidades principales funcionan
3. Que la interfaz se muestra correctamente
4. Que las traducciones funcionan en todos los idiomas

## Distribución

Los archivos empaquetados pueden distribuirse a través de:

- Página web oficial
- GitHub Releases
- Tiendas de aplicaciones (Microsoft Store, Mac App Store)
