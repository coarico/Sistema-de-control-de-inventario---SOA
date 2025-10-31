# Sistema de Gestión de Inventario - Cliente SOAP v2.0.0

Cliente Node.js restructurado para interactuar con el servicio SOAP de gestión de inventario.

## 🏗️ Arquitectura Modular

```
cliente-node/
├── main.js                 # Aplicación principal restructurada (v2.0.0)
├── index.js               # Aplicación legacy (v1.0.0 - retrocompatibilidad)
├── package.json           # Configuración del proyecto
├── README.md             # Documentación
├── config/               # Configuración centralizada
│   ├── app.js           # Configuración principal
│   └── credentials.js   # Gestión de credenciales
├── services/            # Servicios de la aplicación
│   ├── auth.js         # Servicio de autenticación
│   └── soap.js         # Cliente SOAP con reintentos
├── controllers/         # Lógica de negocio
│   ├── menu.js         # Controlador del menú
│   └── product.js      # Controlador de productos
├── utils/              # Utilidades compartidas
│   ├── logger.js       # Sistema de logging
│   ├── ui.js          # Interfaz de usuario mejorada
│   └── validation.js  # Validaciones robustas
└── logs/               # Archivos de log
    └── cliente.log     # Log detallado
```

## 🚀 Instalación y Uso

**Requisitos:**
- Node.js 14+ y npm
- Servidor SOAP ejecutándose

**Instalación:**

```powershell
cd cliente-node
npm install
```

## 💻 Uso

### Ejecutar la aplicación mejorada (v2.0.0):
```powershell
npm start
# o
node main.js
```

### Ejecutar la versión legacy (v1.0.0):
```powershell
npm run legacy
# o
node index.js
```

## 🔐 Autenticación

El sistema incluye usuarios predefinidos:

| Usuario    | Contraseña        | Rol       | Permisos                          |
|------------|-------------------|-----------|-----------------------------------|
| admin      | FerretAdmin2024$  | ADMIN     | Acceso completo                   |
| operador   | StockManager#789  | OPERADOR  | Gestión de inventario y consultas |
| consulta   | ReadOnly@456      | CONSULTA  | Solo lectura                      |

## 📋 Funcionalidades

### ✅ Implementadas
- 🔐 Autenticación con múltiples usuarios y roles
- 📊 Consulta de productos por código
- 📦 Actualización de inventario
- 📝 Listado de categorías y proveedores
- 🎨 Interfaz limpia y profesional (sin información técnica)

### Notas importantes:
- Asegúrate de que el servidor SOAP esté ejecutándose
- La aplicación v2.0.0 oculta información técnica para mayor claridad
- Los logs detallados se guardan en `logs/cliente.log`
