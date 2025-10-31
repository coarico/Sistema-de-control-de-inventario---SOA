# PLAN DE MEJORAS PARA CUMPLIMIENTO COMPLETO

## 🔒 1. IMPLEMENTAR SEGURIDAD BÁSICA (RNF6)
### a) Agregar dependencia de seguridad
```xml
<dependency>
    <groupId>jakarta.annotation</groupId>
    <artifactId>jakarta.annotation-api</artifactId>
    <version>2.0.0</version>
</dependency>
```

### b) Implementar filtro de autenticación
```java
@WebFilter(urlPatterns = "/InventarioService/*")
public class AuthenticationFilter implements Filter {
    // Implementar validación básica de credenciales
}
```

### c) Agregar anotaciones de seguridad
```java
@RolesAllowed("ADMIN")
@WebMethod(operationName = "insertarArticulo")
```

---

## 🧪 2. IMPLEMENTAR PRUEBAS (RNF10)
### a) Estructura de pruebas
```
src/test/java/
├── com/ferreteria/inventario/
│   ├── service/ArticuloServiceTest.java
│   ├── dao/ArticuloDAOTest.java
│   └── ws/InventarioWebServiceTest.java
```

### b) Dependencias de testing
```xml
<dependency>
    <groupId>junit</groupId>
    <artifactId>junit</artifactId>
    <version>4.13.2</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>4.8.0</version>
    <scope>test</scope>
</dependency>
```

---

## 🖥️ 3. CREAR INTERFAZ WEB ADMINISTRATIVA (RF9)
### a) Páginas JSP básicas
```
src/main/webapp/
├── index.jsp (dashboard)
├── articulos/
│   ├── listar.jsp
│   ├── crear.jsp
│   └── editar.jsp
└── resources/
    ├── css/styles.css
    └── js/app.js
```

### b) Servlet de control
```java
@WebServlet("/admin/*")
public class AdminServlet extends HttpServlet {
    // Controlador para interfaz web
}
```

---

## ⚡ 4. PRUEBAS DE RENDIMIENTO (RNF2)
### a) Implementar métricas
```java
@Component
public class PerformanceMetrics {
    public void measureExecutionTime(String operation) {
        // Medir y registrar tiempos de ejecución
    }
}
```

### b) Test de carga con JMeter
- Crear plan de pruebas para operaciones SOAP
- Validar que operaciones < 500ms bajo carga normal
