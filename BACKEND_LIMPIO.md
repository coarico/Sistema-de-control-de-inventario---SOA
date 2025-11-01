# 🎯 Backend Sistema de Inventario - Solo Backend

## ✅ Archivos Backend Esenciales

### **📁 Estructura del Proyecto Backend**
```
INVENTARIO/
├── pom.xml                                    # Maven configuration
├── src/main/java/com/ferreteria/inventario/
│   ├── INVENTARIO.java                        # Main application class
│   ├── model/                                 # Entities layer
│   │   ├── Articulo.java                     # Article entity
│   │   ├── Categoria.java                    # Category entity  
│   │   └── Proveedor.java                    # Provider entity
│   ├── dao/                                  # Data Access layer
│   │   └── ArticuloDAO.java                  # Article CRUD operations
│   ├── config/                               # Configuration layer
│   │   └── DatabaseConfig.java               # Database connection config
│   ├── service/                              # Business Logic layer
│   │   ├── ArticuloService.java              # Business services
│   │   └── ArticuloValidator.java            # Data validation
│   ├── ws/                                   # SOAP Web Services layer
│   │   └── InventarioWebService.java         # SOAP service endpoints
│   ├── dto/                                  # Data Transfer Objects
│   │   ├── ArticuloDTO.java                  # Article DTO
│   │   └── RespuestaOperacion.java           # Operation response DTO
│   ├── util/                                 # Utilities
│   │   └── ArticuloMapper.java               # Entity-DTO mapper
│   └── exception/                            # Custom exceptions
│       ├── InventarioException.java          # Base exception
│       ├── ValidationException.java          # Validation errors
│       └── ArticuloNotFoundException.java    # Not found errors
├── src/main/resources/
│   ├── database.properties                   # Database configuration
│   ├── logback.xml                          # Logging configuration
│   └── database/
│       └── schema.sql                       # Database schema
├── src/main/webapp/WEB-INF/
│   ├── web.xml                              # Web application config
│   └── sun-jaxws.xml                        # SOAP service config
└── src/test/java/com/ferreteria/inventario/
    └── SOAPClientTest.java                  # SOAP client test
```

## 🔧 Funcionalidades Backend

### **1. Servicios SOAP Disponibles**
- ✅ `insertarArticulo` - Insertar nuevo artículo
- ✅ `consultarArticulo` - Consultar artículo por código  
- ✅ `actualizarStock` - Actualizar stock de artículo
- ✅ `verificarEstado` - Verificar estado del servicio

### **2. Operaciones de Base de Datos**
- ✅ **CRUD Completo**: Create, Read, Update, Delete
- ✅ **Búsquedas**: Por código, nombre, stock bajo
- ✅ **Validaciones**: 15+ reglas de negocio
- ✅ **Pool de Conexiones**: HikariCP optimizado

### **3. Arquitectura N-Capas**
1. **Entidades** (`model/`) - Representación de datos
2. **Acceso a Datos** (`dao/`) - Operaciones CRUD  
3. **Lógica de Negocio** (`service/`) - Reglas y validaciones
4. **Servicios Web** (`ws/`) - Endpoints SOAP
5. **Configuración** (`config/`) - Configuraciones del sistema

## 🚀 Cómo Usar el Backend

### **1. Compilar**
```bash
mvn clean compile
```

### **2. Generar WAR**
```bash
mvn package
```

### **3. Desplegar**
- Copiar `target/inventario-sistema.war` a Tomcat
- Configurar base de datos MySQL
- Acceder al WSDL: `http://localhost:8080/inventario-sistema/InventarioService?wsdl`

### **4. Probar Servicios SOAP**
```xml
<!-- Ejemplo: Insertar Artículo -->
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:inv="http://ws.inventario.ferreteria.com/">
    <soap:Body>
        <inv:insertarArticulo>
            <inv:codigo>TEST001</inv:codigo>
            <inv:nombre>Artículo de Prueba</inv:nombre>
            <inv:precioCompra>10.50</inv:precioCompra>
            <inv:precioVenta>18.00</inv:precioVenta>
            <inv:stockActual>100</inv:stockActual>
            <inv:stockMinimo>10</inv:stockMinimo>
        </inv:insertarArticulo>
    </soap:Body>
</soap:Envelope>
```

## 📊 Tecnologías Backend

- **Java 17** - Lenguaje principal
- **Maven** - Gestión de dependencias  
- **JAX-WS** - Servicios SOAP
- **MySQL** - Base de datos
- **HikariCP** - Pool de conexiones
- **SLF4J + Logback** - Logging

## ✅ Backend Listo

El backend está **100% funcional** con:
- ✅ Arquitectura N-Capas implementada
- ✅ Servicios SOAP operativos  
- ✅ Base de datos configurada
- ✅ Validaciones completas
- ✅ Logging configurado
- ✅ Sin dependencias de frontend

**WSDL disponible en**: `http://localhost:8080/inventario-sistema/InventarioService?wsdl`
