# Sistema de Inventario para Ferretería

## Descripción
Sistema de control de inventario desarrollado con arquitectura N-Capas que incluye servicios web SOAP para la gestión de artículos de una ferretería.

## Arquitectura N-Capas

### 1. Capa de Presentación
- **Interfaz Web**: `src/main/webapp/index.html`
- **JavaScript**: `src/main/webapp/js/inventario.js`
- **Servlets REST**: `com.ferreteria.inventario.servlet.ArticuloServlet`

### 2. Capa de Servicios Web (SOAP)
- **Servicio SOAP**: `com.ferreteria.inventario.ws.InventarioWebService`
- **DTOs**: `com.ferreteria.inventario.dto.*`
- **Mappers**: `com.ferreteria.inventario.util.ArticuloMapper`

### 3. Capa de Lógica de Negocio
- **Servicios**: `com.ferreteria.inventario.service.ArticuloService`
- **Validadores**: `com.ferreteria.inventario.service.ArticuloValidator`
- **Excepciones**: `com.ferreteria.inventario.exception.*`

### 4. Capa de Acceso a Datos
- **DAOs**: `com.ferreteria.inventario.dao.ArticuloDAO`
- **Configuración BD**: `com.ferreteria.inventario.config.DatabaseConfig`

### 5. Capa de Entidades
- **Modelos**: `com.ferreteria.inventario.model.*`

## Requerimientos Funcionales Implementados

| ID | Requerimiento | Estado |
|----|---------------|--------|
| RF1 | Gestión de artículos | ✅ Completado |
| RF2 | Registro de nuevo artículo | ✅ Completado |
| RF3 | Validación de datos | ✅ Completado |
| RF4 | Consulta de artículos | ✅ Completado |
| RF5 | Servicio SOAP: insertar artículo | ✅ Completado |
| RF6 | Servicio SOAP: consultar artículo | ✅ Completado |
| RF7 | Manejo de stock | ✅ Completado |
| RF8 | Persistencia de datos | ✅ Completado |
| RF9 | Interfaz de usuario | ✅ Completado |
| RF10 | Manejo de errores | ✅ Completado |

## Requerimientos No Funcionales

| ID | Requerimiento | Estado |
|----|---------------|--------|
| RNF1 | Arquitectura N-Capas | ✅ Implementado |
| RNF2 | Rendimiento ≤ 500ms | ✅ Optimizado |
| RNF3 | Escalabilidad | ✅ Diseño modular |
| RNF4 | Mantenibilidad | ✅ Código limpio |
| RNF5 | Interoperabilidad SOAP | ✅ WSDL 1.1 |
| RNF6 | Seguridad básica | ✅ Filtros implementados |
| RNF7 | Confiabilidad | ✅ Logs y manejo errores |
| RNF8 | Usabilidad | ✅ Interfaz intuitiva |
| RNF9 | Portabilidad | ✅ Java + MySQL |

## Tecnologías Utilizadas

- **Java 17**
- **Maven 3.x**
- **MySQL 8.0**
- **JAX-WS (SOAP)**
- **Jakarta Servlets**
- **HikariCP (Pool de conexiones)**
- **SLF4J + Logback (Logging)**
- **Bootstrap 5 (Frontend)**

## Instalación y Configuración

### Prerrequisitos
1. Java 17 o superior
2. Maven 3.6+
3. MySQL 8.0+
4. Servidor de aplicaciones (Tomcat 10+ o similar)

### Pasos de Instalación

1. **Clonar/Descargar el proyecto**
   ```bash
   cd INVENTARIO
   ```

2. **Configurar la base de datos**
   ```sql
   -- Ejecutar el script en MySQL
   mysql -u root -p < src/main/resources/database/schema.sql
   ```

3. **Configurar conexión a BD**
   ```properties
   # Editar src/main/resources/database.properties
   db.url=jdbc:mysql://localhost:3306/ferreteria_inventario
   db.username=tu_usuario
   db.password=tu_password
   ```

4. **Compilar el proyecto**
   ```bash
   mvn clean compile
   ```

5. **Generar WAR**
   ```bash
   mvn package
   ```

6. **Desplegar en servidor**
   - Copiar `target/inventario-sistema.war` al directorio `webapps` de Tomcat
   - Iniciar el servidor

## Uso del Sistema

### Interfaz Web
- **URL**: `http://localhost:8080/inventario-sistema/`
- **Funciones**: Crear, consultar, actualizar y eliminar artículos

### Servicios SOAP

#### WSDL
```
http://localhost:8080/inventario-sistema/InventarioService?wsdl
```

#### Operaciones Disponibles

1. **insertarArticulo**
   ```xml
   <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:inv="http://ws.inventario.ferreteria.com/">
       <soap:Body>
           <inv:insertarArticulo>
               <inv:codigo>MART002</inv:codigo>
               <inv:nombre>Martillo de Goma</inv:nombre>
               <inv:descripcion>Martillo con cabeza de goma</inv:descripcion>
               <inv:categoriaId>1</inv:categoriaId>
               <inv:proveedorId>1</inv:proveedorId>
               <inv:precioCompra>12.50</inv:precioCompra>
               <inv:precioVenta>20.00</inv:precioVenta>
               <inv:stockActual>25</inv:stockActual>
               <inv:stockMinimo>5</inv:stockMinimo>
           </inv:insertarArticulo>
       </soap:Body>
   </soap:Envelope>
   ```

2. **consultarArticulo**
   ```xml
   <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:inv="http://ws.inventario.ferreteria.com/">
       <soap:Body>
           <inv:consultarArticulo>
               <inv:codigo>MART001</inv:codigo>
           </inv:consultarArticulo>
       </soap:Body>
   </soap:Envelope>
   ```

### API REST

#### Endpoints Disponibles

- `GET /api/articulos` - Obtener todos los artículos
- `GET /api/articulos/codigo/{codigo}` - Buscar por código
- `GET /api/articulos/buscar?nombre={nombre}` - Buscar por nombre
- `GET /api/articulos/stock-bajo` - Artículos con stock bajo
- `POST /api/articulos` - Crear nuevo artículo
- `PUT /api/articulos/{id}` - Actualizar artículo
- `DELETE /api/articulos/{id}` - Eliminar artículo

## Estructura de Base de Datos

### Tabla: articulos
```sql
CREATE TABLE articulos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria_id INT,
    proveedor_id INT,
    precio_compra DECIMAL(10,2) NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Validaciones Implementadas

### Artículo
- **Código**: 4-20 caracteres alfanuméricos en mayúsculas, único
- **Nombre**: 3-200 caracteres, obligatorio
- **Precios**: Valores positivos, precio venta > precio compra
- **Stock**: Valores no negativos
- **Coherencia**: Validación de relaciones entre campos

## Logging

Los logs se generan en:
- `logs/inventario.log` - Log general
- `logs/inventario-error.log` - Solo errores
- `logs/inventario-soap.log` - Operaciones SOAP

## Manejo de Errores

### Códigos de Error Personalizados
- `VALIDATION_ERROR` - Errores de validación
- `ARTICULO_NOT_FOUND` - Artículo no encontrado
- `ERROR_BD` - Errores de base de datos
- `INTERNAL_ERROR` - Errores internos del sistema

### SOAP Faults
El sistema retorna SOAP Faults estándar con información detallada del error.

## Seguridad

- Filtros CORS configurados
- Validación de entrada en todas las capas
- Manejo seguro de conexiones de BD
- Logs de auditoría de operaciones

## Pruebas

### Datos de Prueba
El sistema incluye datos de prueba que se insertan automáticamente:
- 5 categorías predefinidas
- 3 proveedores de ejemplo
- 5 artículos de muestra

### Herramientas de Prueba SOAP
- SoapUI
- Postman
- Cliente SOAP personalizado

## Troubleshooting

### Problemas Comunes

1. **Error de conexión a BD**
   - Verificar configuración en `database.properties`
   - Comprobar que MySQL esté ejecutándose
   - Validar credenciales de acceso

2. **WSDL no accesible**
   - Verificar que el WAR esté desplegado correctamente
   - Comprobar configuración en `sun-jaxws.xml`

3. **Errores de compilación**
   - Verificar versión de Java (17+)
   - Ejecutar `mvn clean install`

## Contacto y Soporte

Para soporte técnico o consultas sobre el sistema, contactar al equipo de desarrollo.

---

**Versión**: 1.0-SNAPSHOT  
**Fecha**: Octubre 2024  
**Autor**: MR_ALF
