#!/usr/bin/env node
const soap = require('soap');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Configuración de logs
const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'cliente.log');

// Asegurar que el directorio de logs exista
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Función para escribir en el log
function escribirLog(mensaje, tipo = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${tipo}] ${mensaje}\n`;
  
  // Escribir en consola
  if (tipo === 'ERROR') {
    console.error('\x1b[31m' + logEntry + '\x1b[0m');
  } else if (tipo === 'WARN') {
    console.warn('\x1b[33m' + logEntry + '\x1b[0m');
  } else if (tipo === 'DEBUG' && process.env.DEBUG) {
    console.log('\x1b[36m' + logEntry + '\x1b[0m');
  } else if (tipo === 'INFO') {
    console.log(logEntry);
  }
  
  // Escribir en archivo
  fs.appendFileSync(LOG_FILE, logEntry, 'utf8');
}

// Función para limpiar el log si es muy grande
function limpiarLogSiEsNecesario() {
  try {
    const stats = fs.statSync(LOG_FILE);
    // Si el archivo es mayor a 5MB, lo limpiamos
    if (stats.size > 5 * 1024 * 1024) {
      fs.writeFileSync(LOG_FILE, `Log limpiado el: ${new Date().toISOString()}\n\n`, 'utf8');
    }
  } catch (error) {
    // Si hay un error al verificar/limpiar el log, lo ignoramos
  }
}

// Inicializar el log
limpiarLogSiEsNecesario();
escribirLog('Iniciando cliente SOAP', 'INFO');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const WSDL_URL = 'http://192.168.0.109:8080/InventarioService?wsdl';

// Función para formatear la fecha y hora
function getTimestamp() {
  return new Date().toISOString();
}

// Función para registrar mensajes con timestamp
function log(message, type = 'info') {
  const timestamp = getTimestamp();
  const typeColor = type === 'error' ? '\x1b[31m' : '\x1b[36m';
  console.log(`[${timestamp}] ${typeColor}${type.toUpperCase()}\x1b[0m: ${message}`);
  
  // Si es un error, también mostrarlo en stderr
  if (type === 'error') {
    console.error(`[${timestamp}] ERROR: ${message}`);
  }
}

// Función para registrar peticiones SOAP
function logSoapRequest(client, methodName, args) {
  log(`Enviando petición SOAP: ${methodName}`, 'debug');
  log(`Argumentos: ${JSON.stringify(args, null, 2)}`, 'debug');
  
  // Registrar la última petición para depuración
  client.lastRequest = {
    timestamp: getTimestamp(),
    method: methodName,
    args: args
  };
}

// Función segura para stringify que maneja referencias circulares
const safeStringify = (obj, space = 2) => {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) return '[Circular]';
      cache.add(value);
      
      // Filtrar propiedades problemáticas comunes
      if (value.constructor) {
        if (value.constructor.name === 'IncomingMessage') {
          return `[${value.constructor.name}: ${value.statusCode || 'No status'}]`;
        }
        if (value.constructor.name === 'ClientRequest') {
          return `[${value.constructor.name}: ${value.method} ${value.path}]`;
        }
      }
    }
    return value;
  }, space);
};

// Función para registrar respuestas SOAP
function logSoapResponse(methodName, response, isError = false) {
  const logMethod = isError ? 'error' : 'debug';
  log(`Respuesta de ${methodName}:`, logMethod);
  
  try {
    if (isError) {
      // Manejar errores SOAP
      if (response.root?.Envelope?.Body?.Fault) {
        const fault = response.root.Envelope.Body.Fault;
        log(`Error SOAP [${fault.faultcode || 'Sin código'}]: ${fault.faultstring || 'Sin mensaje'}`, 'error');
        
        if (fault.detail) {
          log('Detalles del error SOAP:', 'error');
          log(safeStringify(fault.detail, 2), 'error');
        }
      } 
      // Manejar errores HTTP
      else if (response.response) {
        const { statusCode, statusMessage, headers } = response.response;
        log(`Error HTTP ${statusCode}: ${statusMessage}`, 'error');
        log(`Headers: ${safeStringify(headers)}`, 'debug');
      }
      // Manejar otros errores
      else {
        log(`Error: ${response.message || 'Sin mensaje de error'}`, 'error');
        log(`Tipo: ${response.name || 'Error desconocido'}`, 'debug');
        
        // Mostrar información de depuración adicional si está disponible
        if (response.code) log(`Código: ${response.code}`, 'debug');
        if (response.errno) log(`Número de error: ${response.errno}`, 'debug');
        if (response.syscall) log(`Llamada al sistema: ${response.syscall}`, 'debug');
        if (response.address) log(`Dirección: ${response.address}`, 'debug');
        if (response.port) log(`Puerto: ${response.port}`, 'debug');
        
        // Mostrar stack trace si está disponible
        if (response.stack) {
          log('Stack trace (primeras 5 líneas):', 'debug');
          log(response.stack.split('\n').slice(0, 5).join('\n') + '\n...', 'debug');
        }
      }
    } else {
      // Mostrar respuesta exitosa
      log(`Respuesta recibida (${methodName}):`, 'debug');
      
      // Mostrar la respuesta de manera segura, manejando posibles referencias circulares
      const responseToLog = response?.return || response?.respuesta || response;
      log(safeStringify(responseToLog, 2), 'debug');
    }
  } catch (logError) {
    log(`Error al registrar la respuesta: ${logError.message}`, 'error');
    log(`Tipo de respuesta: ${typeof response}`, 'debug');
    
    // Intentar mostrar la respuesta de manera segura
    try {
      log('Contenido de la respuesta (raw):', 'debug');
      log(String(response).substring(0, 500) + (String(response).length > 500 ? '...' : ''), 'debug');
    } catch (e) {
      log('No se pudo mostrar el contenido de la respuesta', 'error');
    }
  }
}

async function main() {
  log('Iniciando cliente SOAP...');
  log(`Conectando a: ${WSDL_URL}`);
  
  try {
    soap.createClient(WSDL_URL, {
      wsdl_headers: { 
        'User-Agent': 'Node-SOAP-Client',
        'Connection': 'keep-alive',
        'Authorization': 'Basic ' + Buffer.from('admin:admin').toString('base64')
      },
      escapeXML: false,
      wsdl_options: {
        rejectUnauthorized: false,
        strictSSL: false,
        forever: true
      }
    }, function(err, client) {
      if (err) {
        log(`Error conectando al servicio: ${err.message}`, 'error');
        log(`- Verifica que el servidor esté corriendo en: ${WSDL_URL}`, 'error');
        log(`- Detalles del error: ${JSON.stringify(err, null, 2)}`, 'error');
        process.exit(1);
      }

      // Agregar logging a todas las llamadas SOAP
      const originalMethod = client.describe;
      client.describe = function() {
        log('Obteniendo descripción del servicio SOAP...');
        return originalMethod.apply(this, arguments);
      };

      log('Conexión exitosa al servicio SOAP', 'success');
      log('Operaciones disponibles:', 'info');
      
      // Mostrar operaciones disponibles
      const services = client.describe();
      Object.keys(services).forEach(svc => {
        Object.keys(services[svc]).forEach(port => {
          Object.keys(services[svc][port]).forEach(op => {
            log(`- ${op}`, 'info');
          });
        });
      });

      showMenu(client);
    });
  } catch (error) {
    log(`Error inesperado: ${error.message}`, 'error');
    log(`Stack trace: ${error.stack}`, 'error');
    process.exit(1);
  }
}

function showMenu(client) {
  console.log('\n\x1b[36m=== MENÚ PRINCIPAL ===\x1b[0m');
  const services = client.describe();
  const operations = [];
  
  Object.keys(services).forEach(svc => {
    Object.keys(services[svc]).forEach(port => {
      Object.keys(services[svc][port]).forEach(op => {
        operations.push(op);
        console.log(`\x1b[33m${operations.length}\x1b[0m. ${op}`);
      });
    });
  });

  console.log('\n\x1b[33m0\x1b[0m. Salir');
  
  rl.question('\nSeleccione una operación (número): ', (choice) => {
    const opIndex = parseInt(choice) - 1;
    if (choice === '0') {
      console.log('\x1b[32mSaliendo...\x1b[0m');
      return rl.close();
    }
    if (isNaN(opIndex) || opIndex < 0 || opIndex >= operations.length) {
      console.log('\x1b[31mOpción inválida\x1b[0m');
      return showMenu(client);
    }
    executeOperation(client, operations[opIndex]);
  });
}

async function getCategorias(client) {
  return new Promise((resolve) => {
    client.listarCategorias({}, (err, result) => {
      if (err || !result?.return?.datos) {
        console.log('\x1b[33mNo se pudieron obtener categorías\x1b[0m');
        if (err) console.error('Error:', err.message);
        resolve([]);
      } else {
        // Asegurarse de que sea un array
        const categorias = Array.isArray(result.return.datos) ? result.return.datos : [result.return.datos];
        resolve(categorias);
      }
    });
  });
}

async function getProveedores(client) {
  escribirLog('=== INICIANDO CONSULTA DE PROVEEDORES ===', 'INFO');
  console.log('\n\x1b[36m=== OBTENIENDO PROVEEDORES ===\x1b[0m');
  
  return new Promise((resolve) => {
    const loadingInterval = setInterval(() => process.stdout.write('.'), 500);
    
    // Configuración mejorada para la solicitud SOAP
    const options = {
      method: 'listarProveedores',
      params: {},
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'Accept': 'text/xml',
        'SOAPAction': ''
      },
      timeout: 10000,
      disableCache: true,
      forceSoap12Headers: true
    };
    
    // Registrar la petición
    escribirLog(`Enviando petición SOAP a ${client.wsdl.uri}`, 'DEBUG');
    escribirLog(`Opciones: ${JSON.stringify(options, null, 2)}`, 'DEBUG');
    
    // Función para limpiar y mostrar el resultado
    const handleResponse = (proveedores, mensaje = '') => {
      clearInterval(loadingInterval);
      
      if (proveedores.length > 0) {
        const mensajeExito = `Se encontraron ${proveedores.length} proveedores`;
        console.log(`\n\x1b[32m✓ ${mensajeExito}\x1b[0m`);
        escribirLog(mensajeExito, 'INFO');
        
        if (mensaje) {
          console.log(`\x1b[36mℹ ${mensaje}\x1b[0m`);
          escribirLog(`Mensaje adicional: ${mensaje}`, 'INFO');
        }
        
        // Mostrar y registrar los proveedores encontrados
        proveedores.forEach((prov, index) => {
          const detalleProveedor = `Proveedor #${index + 1}: ID=${prov.id}, Nombre=${prov.nombre || 'N/A'}`;
          console.log(`\n\x1b[33m${detalleProveedor}\x1b[0m`);
          escribirLog(detalleProveedor, 'DEBUG');
          
          // Detalles adicionales en el log
          escribirLog(`Detalles: ${JSON.stringify({
            contacto: prov.contacto,
            telefono: prov.telefono,
            email: prov.email,
            direccion: prov.direccion
          }, null, 2)}`, 'DEBUG');
          
          // Mostrar en consola
          console.log(`  ID: ${prov.id}`);
          console.log(`  Nombre: ${prov.nombre || 'No disponible'}`);
          console.log(`  Contacto: ${prov.contacto || 'No disponible'}`);
          console.log(`  Teléfono: ${prov.telefono || 'No disponible'}`);
          console.log(`  Email: ${prov.email || 'No disponible'}`);
        });
        
      } else {
        const mensajeVacio = 'No se encontraron proveedores';
        console.log(`\n\x1b[33mℹ ${mensajeVacio}.\x1b[0m`);
        escribirLog(mensajeVacio, 'INFO');
      }
      
      resolve(proveedores);
    };
    
    // Función para extraer proveedores de la respuesta
    const extraerProveedores = (data) => {
      if (!data) return [];
      
      // Si es un array, verificar si contiene proveedores
      if (Array.isArray(data)) {
        return data.length > 0 && data[0].id !== undefined ? data : [];
      }
      
      // Si es un objeto, buscar arrays que puedan contener proveedores
      if (typeof data === 'object') {
        // Buscar en las propiedades del objeto
        for (const key in data) {
          if (Array.isArray(data[key]) && data[key].length > 0) {
            // Verificar si el primer elemento parece un proveedor
            if (data[key][0].id !== undefined) {
              return data[key];
            }
            
            // Si no, buscar recursivamente
            const found = extraerProveedores(data[key]);
            if (found.length > 0) return found;
          } else if (typeof data[key] === 'object' && data[key] !== null) {
            // Buscar recursivamente en objetos anidados
            const found = extraerProveedores(data[key]);
            if (found.length > 0) return found;
          }
        }
      }
      
      return [];
    };
    
    // Realizar la petición SOAP
    try {
      client.listarProveedores({}, (err, result) => {
        // Si hay un error en la conexión
        if (err) {
          clearInterval(loadingInterval);
          
          // Manejar errores SOAP
          let errorMessage = 'Error desconocido';
          
          if (err.root?.Envelope?.Body?.Fault) {
            const fault = err.root.Envelope.Body.Fault;
            errorMessage = `Error del servidor: ${fault.faultstring || 'Error desconocido'}`;
            console.log(`\n\x1b[31m✖ ${errorMessage}\x1b[0m`);
            
            if (fault.detail) {
              console.log(`\x1b[31mDetalles: ${fault.detail}\x1b[0m`);
              errorMessage += ` | Detalles: ${fault.detail}`;
            }
          } else {
            errorMessage = `Error en la conexión: ${err.message || 'Error desconocido'}`;
            console.log(`\n\x1b[31m✖ ${errorMessage}\x1b[0m`);
          }
          
          escribirLog(errorMessage, 'ERROR');
          resolve([]);
          return;
        }
        
        try {
          // Extraer los proveedores de la respuesta
          const proveedores = extraerProveedores(result);
          
          // Procesar y mostrar los proveedores
          handleResponse(proveedores, 'Consulta completada exitosamente');
          
        } catch (parseError) {
          clearInterval(loadingInterval);
          console.error('\x1b[31m✗ Error al procesar la respuesta del servidor:\x1b[0m', parseError.message);
          escribirLog(`Error al procesar la respuesta: ${parseError.message}`, 'ERROR');
          escribirLog(`Stack trace: ${parseError.stack}`, 'DEBUG');
          console.log('\x1b[36mRespuesta recibida:\x1b[0m', JSON.stringify(result, null, 2));
          resolve([]);
        }
      });
    } catch (error) {
      clearInterval(loadingInterval);
      console.error('\x1b[31m✗ Error inesperado al realizar la petición:\x1b[0m', error.message);
      escribirLog(`Error inesperado: ${error.message}`, 'ERROR');
      escribirLog(`Stack trace: ${error.stack}`, 'DEBUG');
      resolve([]);
    }
  });
}

async function selectFromList(items, prompt) {
  console.log('\n\x1b[36m=== ' + prompt.toUpperCase() + ' ===\x1b[0m');
  items.forEach((item, index) => {
    console.log(`\x1b[33m${index + 1}\x1b[0m. ${item.nombre || item.razonSocial} (ID: ${item.id})`);
  });
  console.log('\n\x1b[33m0\x1b[0m. Ninguno');
  
  return new Promise((resolve) => {
    rl.question(`Seleccione ${prompt} (número): `, (choice) => {
      const index = parseInt(choice) - 1;
      if (choice === '0') resolve(null);
      else if (index >= 0 && index < items.length) resolve(items[index].id);
      else {
        console.log('\x1b[31mOpción inválida\x1b[0m');
        resolve(selectFromList(items, prompt));
      }
    });
  });
}

async function executeOperation(client, operation) {
  log(`\nIniciando operación: ${operation}`, 'info');
  
  const handleOperationError = (err, operationName) => {
    log(`Error en ${operationName}: ${err.message || 'Error desconocido'}`, 'error');
    
    // Función segura para stringify que maneja referencias circulares
    const safeStringify = (obj, space = 2) => {
      const cache = new Set();
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (cache.has(value)) return '[Circular]';
          cache.add(value);
          
          // Filtrar propiedades problemáticas comunes
          if (value.constructor && value.constructor.name === 'IncomingMessage') {
            return `[${value.constructor.name}: ${value.statusCode || 'No status'}]`;
          }
          if (value.constructor && value.constructor.name === 'ClientRequest') {
            return `[${value.constructor.name}: ${value.method} ${value.path}]`;
          }
        }
        return value;
      }, space);
    };

    // Registrar detalles del error de manera segura
    if (err) {
      log('Detalles del error:', 'error');
      
      // Registrar propiedades estándar de error
      const errorInfo = {
        name: err.name,
        message: err.message,
        code: err.code,
        stack: err.stack ? err.stack.split('\n').slice(0, 5).join('\n') + '...' : undefined,
        ...(err.response && {
          response: {
            statusCode: err.response.statusCode,
            statusMessage: err.response.statusMessage,
            headers: err.response.headers,
            data: err.response.data
          }
        })
      };
      
      log(safeStringify(errorInfo), 'error');
    }
    
    showMenu(client);
  };

  const executeWithLogging = (operationName, args, callback) => {
    logSoapRequest(client, operationName, args);
    client[operationName](args, (err, result) => {
      if (err) {
        logSoapResponse(operationName, err, true);
        handleOperationError(err, operationName);
      } else {
        logSoapResponse(operationName, result);
        callback(result);
      }
    });
  };
  
  switch(operation) {
    case 'verificarEstado':
      executeWithLogging('verificarEstado', {}, () => {
        log('Verificación de estado completada', 'success');
        showMenu(client);
      });
      break;
      
    case 'consultarArticulo':
      rl.question('Ingrese código del artículo: ', (codigo) => {
        log(`Consultando artículo con código: ${codigo}`, 'info');
        executeWithLogging('consultarArticulo', { codigo }, (result) => {
          handleResponse(null, result);
          showMenu(client);
        });
      });
      break;
      
    case 'actualizarStock':
      rl.question('Ingrese código del artículo: ', (codigo) => {
        rl.question('Ingrese nuevo stock: ', (nuevoStock) => {
          const stockNum = parseInt(nuevoStock, 10);
          log(`Actualizando stock del artículo ${codigo} a ${stockNum}`, 'info');
          
          // Configurar opciones adicionales para la petición SOAP
          const options = {
            disableCache: true,
            forceSoap12Headers: true,
            envelopeKey: 'soap',
            escapeXML: false
          };
          
          // Realizar la petición con manejo de errores mejorado
          client.actualizarStock({ codigo, nuevoStock: stockNum }, options, (error, result, rawResponse, soapHeader, rawRequest) => {
            if (error) {
              console.log('\n\x1b[31m✖ Error al actualizar el stock:\x1b[0m');
              
              // Registrar el error en el log
              log(`Error en actualizarStock: ${error.message || 'Error desconocido'}`, 'ERROR');
              
              // Mostrar detalles del error si están disponibles
              if (error.response) {
                console.log(`  Estado: ${error.response.statusCode || 'Desconocido'}`);
                console.log(`  Mensaje: ${error.response.statusMessage || 'Sin mensaje de error'}`);
                
                // Mostrar encabezados de respuesta
                if (error.response.headers) {
                  console.log('\n  Encabezados de respuesta:');
                  Object.entries(error.response.headers).forEach(([key, value]) => {
                    console.log(`  ${key}: ${value}`);
                  });
                }
                
                // Mostrar datos de respuesta si están disponibles
                if (error.response.data) {
                  console.log('\n  Datos de respuesta:');
                  console.log(`  ${error.response.data}`);
                }
              } else if (error.request) {
                console.log('  No se recibió respuesta del servidor');
                console.log('  Verifica que el servicio esté en ejecución y accesible');
              } else {
                console.log(`  Error: ${error.message || 'Error desconocido'}`);
              }
              
              // Registrar el error completo en el log de depuración
              log('Detalles completos del error:', 'ERROR');
              log(JSON.stringify({
                message: error.message,
                code: error.code,
                response: error.response ? {
                  status: error.response.statusCode,
                  headers: error.response.headers,
                  data: error.response.data
                } : null,
                request: error.request ? 'Request object available' : null
              }, null, 2), 'DEBUG');
              
            } else if (!result) {
              console.log('\n\x1b[33mℹ No se recibió respuesta del servidor o la respuesta está vacía\x1b[0m');
              log('No se recibió respuesta del servidor o la respuesta está vacía', 'WARN');
            } else {
              // Procesar respuesta exitosa
              handleResponse(null, result, 'actualizarStock');
            }
            
            showMenu(client);
          });
        });
      });
      break;
      
    case 'insertarArticulo':
      const getArticuloData = async () => {
        try {
          const categorias = await getCategorias(client);
          const categoriaId = await selectFromList(categorias, 'categoría');
          const proveedores = await getProveedores(client);
          const proveedorId = await selectFromList(proveedores, 'proveedor');
          
          return new Promise((resolve) => {
            rl.question('Precio de compra: ', (precioCompra) => {
              rl.question('Precio de venta: ', (precioVenta) => {
                rl.question('Stock actual: ', (stockActual) => {
                  rl.question('Stock mínimo: ', (stockMinimo) => {
                    resolve({
                      codigo,
                      nombre,
                      descripcion: descripcion || "",
                      categoriaId: categoriaId || null,
                      proveedorId: proveedorId || null,
                      precioCompra: parseFloat(precioCompra) || 0,
                      precioVenta: parseFloat(precioVenta) || 0,
                      stockActual: parseInt(stockActual, 10) || 0,
                      stockMinimo: parseInt(stockMinimo, 10) || 0
                    });
                  });
                });
              });
            });
          });
        } catch (error) {
          log(`Error al obtener datos del artículo: ${error.message}`, 'error');
          return null;
        }
      };

      rl.question('Código del artículo: ', async (codigo) => {
        rl.question('Nombre: ', async (nombre) => {
          rl.question('Descripción: ', async (descripcion) => {
            const articuloData = await getArticuloData();
            if (!articuloData) {
              log('No se pudo obtener la información del artículo', 'error');
              return showMenu(client);
            }
            
            log('Insertando nuevo artículo:', 'info');
            log(JSON.stringify(articuloData, null, 2), 'debug');
            
            executeWithLogging('insertarArticulo', articuloData, (result) => {
              handleResponse(null, result);
              showMenu(client);
            });
          });
        });
      });
      break;
      
    case 'listarCategorias':
      log('Obteniendo lista de categorías...', 'info');
      executeWithLogging('listarCategorias', {}, (result) => {
        handleResponse(null, result);
        showMenu(client);
      });
      break;
      
    case 'listarProveedores':
      log('Obteniendo lista de proveedores...', 'info');
      executeWithLogging('listarProveedores', {}, (result) => {
        handleResponse(null, result);
        showMenu(client);
      });
      break;
      
    default:
      log(`Operación no implementada: ${operation}`, 'warn');
      showMenu(client);
  }
}

function handleResponse(err, result, operation = '') {
  log('\n=== INICIO RESPUESTA ===', 'debug');
  
  if (err) {
    log(`Error en la operación ${operation || 'desconocida'}`, 'error');
    
    // Manejar errores SOAP
    if (err.root?.Envelope?.Body?.Fault) {
      const fault = err.root.Envelope.Body.Fault;
      const errorCode = fault.faultcode || 'Desconocido';
      const errorMsg = fault.faultstring || 'Sin mensaje de error';
      
      // Mostrar mensaje de error en consola
      console.log('\n\x1b[31m✖ Error en la operación:\x1b[0m');
      console.log(`  Código: ${errorCode}`);
      console.log(`  Mensaje: ${errorMsg}`);
      
      log(`Código de error SOAP: ${errorCode}`, 'error');
      log(`Mensaje: ${errorMsg}`, 'error');
      
      if (fault.detail) {
        console.log('\n\x1b[33mDetalles del error:\x1b[0m');
        mostrarObjeto(fault.detail, 1, true);
        log('Detalles del error:', 'error');
        mostrarObjeto(fault.detail, 1);
      }
    } else {
      // Manejar otros tipos de errores
      const errorType = err.name || 'Error';
      const errorMessage = err.message || 'Sin mensaje de error';
      
      console.log('\n\x1b[31m✖ Error en la operación:\x1b[0m');
      console.log(`  Tipo: ${errorType}`);
      console.log(`  Mensaje: ${errorMessage}`);
      
      log(`Tipo de error: ${errorType}`, 'error');
      log(`Mensaje: ${errorMessage}`, 'error');
      
      if (err.stack) {
        log('Stack trace:', 'debug');
        log(err.stack, 'debug');
      }
    }
    
    log('=== FIN RESPUESTA CON ERROR ===\n', 'debug');
    return;
  }
  
  // Verificar si la respuesta tiene la estructura esperada
  const respuesta = result?.return || result?.respuesta || result;
  
  if (!respuesta) {
    const msg = 'No se recibió respuesta del servidor';
    console.log('\n\x1b[33mℹ ' + msg + '\x1b[0m');
    log(msg, 'warn');
    return;
  }

  // Mostrar la respuesta en consola de manera estructurada
  console.log('\n\x1b[32m✓ Respuesta del servidor:\x1b[0m');
  
  // Manejar respuesta de consulta de artículo
  if (operation === 'consultarArticulo') {
    if (respuesta.exitoso && respuesta.datos) {
      const articulo = respuesta.datos;
      console.log('\n\x1b[36m=== ARTÍCULO ENCONTRADO ===\x1b[0m');
      console.log(`  Código: ${articulo.codigo || 'No disponible'}`);
      console.log(`  Nombre: ${articulo.nombre || 'No disponible'}`);
      console.log(`  Descripción: ${articulo.descripcion || 'Sin descripción'}`);
      console.log(`  Precio: $${articulo.precio?.toFixed(2) || '0.00'}`);
      console.log(`  Stock: ${articulo.stock || 0} unidades`);
      console.log(`  Categoría: ${articulo.categoria?.nombre || 'No especificada'}`);
      console.log(`  Proveedor: ${articulo.proveedor?.nombre || 'No especificado'}`);
      
      // Registrar en el log
      log(`Artículo consultado: ${articulo.codigo} - ${articulo.nombre}`, 'info');
      log(`Detalles: ${JSON.stringify(articulo, null, 2)}`, 'debug');
    } else {
      console.log(`\n\x1b[33mℹ ${respuesta.mensaje || 'No se encontró el artículo'}\x1b[0m`);
      log(respuesta.mensaje || 'No se encontró el artículo', 'info');
    }
  } 
  // Manejar respuesta de listar proveedores
  else if (operation === 'listarProveedores') {
    if (respuesta.exitoso && respuesta.datos) {
      const proveedores = Array.isArray(respuesta.datos) ? respuesta.datos : [respuesta.datos];
      console.log(`\n\x1b[36m=== PROVEEDORES ENCONTRADOS (${proveedores.length}) ===\x1b[0m`);
      
      proveedores.forEach((prov, index) => {
        console.log(`\n\x1b[33mProveedor #${index + 1}\x1b[0m`);
        console.log(`  ID: ${prov.id}`);
        console.log(`  Nombre: ${prov.nombre || 'No disponible'}`);
        console.log(`  Contacto: ${prov.contacto || 'No disponible'}`);
        console.log(`  Teléfono: ${prov.telefono || 'No disponible'}`);
        console.log(`  Email: ${prov.email || 'No disponible'}`);
        console.log(`  Dirección: ${prov.direccion || 'No disponible'}`);
      });
      
      // Registrar en el log
      log(`Se encontraron ${proveedores.length} proveedores`, 'info');
    } else {
      console.log(`\n\x1b[33mℹ ${respuesta.mensaje || 'No se encontraron proveedores'}\x1b[0m`);
      log(respuesta.mensaje || 'No se encontraron proveedores', 'info');
    }
  }
  // Para otras operaciones, mostrar la respuesta completa
  else {
    mostrarObjeto(respuesta, 1, true);
  }
  
  // Manejar respuestas de error del servicio
  if (respuesta.exitoso === false) {
    log(`Operación fallida: ${respuesta.mensaje || 'Sin mensaje de error'}`, 'error');
    
    if (respuesta.codigoError) {
      log(`Código de error: ${respuesta.codigoError}`, 'error');
    }
    
    if (respuesta.tipoError) {
      log(`Tipo de error: ${respuesta.tipoError}`, 'error');
    }
    
    log('=== FIN RESPUESTA CON FALLO ===\n', 'debug');
    return;
  }

  // Mostrar mensaje de éxito
  if (respuesta.mensaje) {
    log(`✅ ${respuesta.mensaje}`, 'success');
  } else {
    log('✅ Operación completada exitosamente', 'success');
  }

  // Mostrar datos si existen
  if (respuesta.datos) {
    if (Array.isArray(respuesta.datos) && respuesta.datos.length > 0) {
      log(`\n📋 Se encontraron ${respuesta.datos.length} resultados:`, 'info');
      
      // Mostrar resumen de los primeros 5 elementos si hay muchos
      const maxItemsToShow = 5;
      if (respuesta.datos.length > maxItemsToShow) {
        log(`Mostrando los primeros ${maxItemsToShow} de ${respuesta.datos.length} resultados.`, 'info');
      }
      
      respuesta.datos.slice(0, maxItemsToShow).forEach((item, index) => {
        log(`\n🔹 Resultado ${index + 1}:`, 'info');
        mostrarObjeto(item);
      });
      
      if (respuesta.datos.length > maxItemsToShow) {
        log(`\n... y ${respuesta.datos.length - maxItemsToShow} resultados más.`, 'info');
      }
    } else if (typeof respuesta.datos === 'object') {
      log('\n📋 Detalles del resultado:', 'info');
      mostrarObjeto(respuesta.datos);
    }
  }

  // Mostrar advertencias si existen
  if (respuesta.advertencias && respuesta.advertencias.length > 0) {
    log('\n⚠️  Advertencias:', 'warn');
    respuesta.advertencias.forEach((adv, i) => {
      log(`  ${i + 1}. ${adv}`, 'warn');
    });
  }

  // Mostrar metadatos adicionales si existen
  const metadata = { ...respuesta };
  delete metadata.datos;
  delete metadata.mensaje;
  delete metadata.exitoso;
  delete metadata.advertencias;

  if (Object.keys(metadata).length > 0) {
    log('\n📊 Metadatos adicionales:', 'debug');
    mostrarObjeto(metadata);
  }

  log('=== FIN RESPUESTA EXITOSA ===\n', 'debug');
}

function mostrarObjeto(obj, nivel = 0, esConsola = false) {
  const indent = '  '.repeat(nivel);
  
  if (obj === null || obj === undefined) {
    if (esConsola) console.log(`${indent}null`);
    else log('null', 'debug');
    return;
  }
  
  if (typeof obj !== 'object') {
    if (esConsola) console.log(`${indent}${obj}`);
    else log(`${indent}${obj}`, 'debug');
    return;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      if (esConsola) console.log(`${indent}[]`);
      else log(`${indent}[]`, 'debug');
      return;
    }
    
    // Limitar la cantidad de elementos mostrados en consola para arrays grandes
    const maxItems = esConsola ? 10 : obj.length;
    const itemsToShow = obj.slice(0, maxItems);
    
    itemsToShow.forEach((item, index) => {
      if (typeof item === 'object' && item !== null) {
        if (esConsola) console.log(`${indent}[${index}]:`);
        else log(`${indent}[${index}]:`, 'debug');
        mostrarObjeto(item, nivel + 1, esConsola);
      } else {
        if (esConsola) console.log(`${indent}[${index}]: ${item}`);
        else log(`${indent}[${index}]: ${item}`, 'debug');
      }
    });
    
    // Mostrar mensaje si se truncó la salida
    if (esConsola && obj.length > maxItems) {
      console.log(`${indent}... (${obj.length - maxItems} más)`);
    }
    return;
  }
  
  // Es un objeto
  const claves = Object.keys(obj);
  if (claves.length === 0) {
    if (esConsola) console.log(`${indent}{}`);
    else log(`${indent}{}`, 'debug');
    return;
  }
  
  claves.forEach(clave => {
    const valor = obj[clave];
    if (typeof valor === 'object' && valor !== null) {
      if (esConsola) console.log(`${indent}${clave}:`);
      else log(`${indent}${clave}:`, 'debug');
      mostrarObjeto(valor, nivel + 1, esConsola);
    } else {
      if (esConsola) console.log(`${indent}${clave}: ${valor}`);
      else log(`${indent}${clave}: ${valor}`, 'debug');
    }
  });
}

main();
