# Cliente rápido para el servicio SOAP Inventario

Este cliente pequeño en Node.js permite probar las operaciones del servicio SOAP expuesto por el backend Java.

Requisitos:
- Node.js 14+ y npm

Instalación:

```powershell
cd cliente-node
npm install
```

Ejemplos de uso:

Verificar estado del servicio:

```powershell
node index.js --wsdl http://localhost:8080/inventario-sistema-1.0-SNAPSHOT/InventarioService?wsdl --op verificarEstado
```

Consultar artículo por código:

```powershell
node index.js --wsdl http://localhost:8080/inventario-sistema-1.0-SNAPSHOT/InventarioService?wsdl --op consultarArticulo --codigo ART123
```

Insertar artículo (ejemplo):

```powershell
node index.js --wsdl http://localhost:8080/inventario-sistema-1.0-SNAPSHOT/InventarioService?wsdl --op insertarArticulo --codigoArticulo CLI-001 --nombre "Martillo CLI"
```

Notas:
- Asegúrate de que el servidor Java esté levantado y el endpoint `InventarioService` esté accesible. El `sun-jaxws.xml` define el url-pattern `/InventarioService`.
- Si tu servidor está desplegado en un contexto diferente o puerto, ajusta la URL del WSDL.
