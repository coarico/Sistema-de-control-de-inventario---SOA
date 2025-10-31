# 🔐 CREDENCIALES DEL SISTEMA - INVENTARIO FERRETERÍA

## ⚠️ IMPORTANTE - SEGURIDAD
**ESTE ARCHIVO CONTIENE CONTRASEÑAS PREDETERMINADAS**  
**EN PRODUCCIÓN, CAMBIE TODAS LAS CONTRASEÑAS POR UNAS ÚNICAS Y SEGURAS**

---

## 👥 USUARIOS Y CREDENCIALES PREDETERMINADAS

### 🔴 ADMINISTRADORES (Acceso Completo)
```
Usuario: admin
Contraseña: FerretAdmin2024$
Rol: ADMIN
Permisos: Insertar, Consultar, Actualizar, Listar, Gestión completa

Usuario: gerente  
Contraseña: Manager$2024
Rol: ADMIN
Permisos: Insertar, Consultar, Actualizar, Listar, Gestión completa
```

### 🟡 OPERADORES (Gestión de Stock)
```
Usuario: operador
Contraseña: StockManager#789
Rol: OPERADOR  
Permisos: Consultar, Actualizar stock, Listar (NO puede insertar)

Usuario: supervisor
Contraseña: SuperVisor!321
Rol: OPERADOR
Permisos: Consultar, Actualizar stock, Listar (NO puede insertar)
```

### 🟢 CONSULTA (Solo Lectura)
```
Usuario: consulta
Contraseña: ReadOnly@456
Rol: CONSULTA
Permisos: Solo consultar y listar (NO puede modificar)
```

---

## 🛡️ CARACTERÍSTICAS DE SEGURIDAD

### Fortaleza de Contraseñas
- ✅ **Mínimo 8 caracteres**
- ✅ **Mayúsculas y minúsculas**  
- ✅ **Números incluidos**
- ✅ **Caracteres especiales** ($, #, @, !)
- ✅ **Únicas por usuario** - No hay patrones

### Hash y Almacenamiento
- 🔒 **SHA-256** para hash de contraseñas
- 🔒 **Sal implícita** en el proceso de hash
- 🔒 **No se almacenan en texto plano**

---

## 🚀 CÓMO USAR ESTAS CREDENCIALES

### En el Cliente Node.js
1. Ejecutar: `node index.js`
2. Seleccionar usuario del menú:
   - **Usuarios predefinidos (1-5)**: admin, operador, consulta, supervisor, gerente
   - **Credenciales personalizadas (6)**: Ingresar manualmente usuario/contraseña
   - **Modo consulta rápida (7)**: Acceso directo como usuario de solo lectura
   - **Mostrar contraseñas (8)**: Solo disponible para administradores
3. Las contraseñas se configuran automáticamente según la selección

### En Clientes SOAP Externos
```bash
# Ejemplo con curl - Usuario admin
curl -X POST http://localhost:8080/InventarioService \
  -H "Content-Type: text/xml" \
  -H "Authorization: Basic $(echo -n 'admin:FerretAdmin2024$' | base64)" \
  -d '<soap:Envelope>...</soap:Envelope>'
```

### En Herramientas como SoapUI
```
Endpoint: http://localhost:8080/InventarioService
WSDL: http://localhost:8080/InventarioService?wsdl

Authentication Type: Basic
Username: admin
Password: FerretAdmin2024$
```

---

## 🔄 CAMBIO DE CONTRASEÑAS EN PRODUCCIÓN

### Pasos Recomendados:
1. **Cambiar TODAS las contraseñas predeterminadas**
2. **Usar contraseñas únicas de al menos 12 caracteres**  
3. **Implementar rotación periódica de contraseñas**
4. **Auditar accesos regularmente**

### Método de Cambio:
```java
// En código Java
AuthenticationService authService = new AuthenticationService();
boolean cambiado = authService.cambiarContrasena(
    "admin", 
    "FerretAdmin2024$", 
    "nueva_contraseña_super_segura_2024!"
);
```

---

## 📝 NOTAS ADICIONALES

- 🔍 **Todos los accesos se registran** en los logs del sistema
- 🔍 **Intentos fallidos se auditan** automáticamente  
- 🔍 **Cambios de contraseña se loggean** para trazabilidad
- ⏰ **Timestamps precisos** en toda la actividad de seguridad

---

## ⚠️ RECORDATORIO DE SEGURIDAD

**🚨 NUNCA COMPARTIR ESTE ARCHIVO EN REPOSITORIOS PÚBLICOS**  
**🚨 EN PRODUCCIÓN, CREAR USUARIOS ÚNICOS CON CONTRASEÑAS FUERTES**  
**🚨 IMPLEMENTAR POLÍTICAS DE CAMBIO PERIÓDICO DE CONTRASEÑAS**

---
*Generado automáticamente para el Sistema de Inventario - Ferretería*  
*Fecha: Octubre 2025*
