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

// Configuración de reintentos
const DEFAULT_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo

// Función para verificar si una respuesta está truncada
function isTruncatedResponse(data) {
  if (!data) return true;
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return str.includes('<S:Envelope') && !str.includes('</S:Envelope>');
}

// Función para esperar un tiempo determinado
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Función para ejecutar operaciones SOAP con manejo de errores y reintentos
async function executeWithLogging(methodName, args = {}, retries = DEFAULT_RETRIES) {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    const spinner = ['|', '/', '-', '\\'];
    let spinnerIndex = 0;
    const spinnerInterval = setInterval(() => {
      process.stdout.write(`\r${spinner[spinnerIndex++ % spinner.length]} Procesando (Intento ${attempt}/${retries})...`);
    }, 100);
    
    try {
      log(`\n=== Intento ${attempt} de ${retries} - ${methodName} ===`, 'debug');
      
      // Configuración de la petición SOAP
      const options = {
        disableCache: true,
        forceSoap12Headers: true,
        envelopeKey: 'soap',
        escapeXML: false,
        timeout: 10000 + (attempt * 2000), // Aumentar timeout en cada reintento
        returnFault: true
      };
      
      // Registrar la petición
      logSoapRequest(client, methodName, args);
      
      // Ejecutar la operación con promesas
      const result = await new Promise((resolve, reject) => {
        client[methodName](args, options, (error, result, rawResponse) => {
          if (error) {
            // Verificar si es un error de timeout
            if (error.code === 'ESOCKETTIMEDOUT' || error.code === 'ETIMEDOUT') {
              error.message = `Timeout al conectar con el servidor (${options.timeout}ms)`;
            }
            
            // Verificar si la respuesta está truncada
            if (error.response?.data && isTruncatedResponse(error.response.data)) {
              error.isTruncated = true;
              error.message = 'La respuesta del servidor está incompleta (truncada)';
            }
            
            reject(error);
          } else if (isTruncatedResponse(rawResponse)) {
            const error = new Error('La respuesta del servidor está incompleta (truncada)');
            error.isTruncated = true;
            reject(error);
          } else {
            resolve({ result, rawResponse });
          }
        });
      });
      
      // Si llegamos aquí, la operación fue exitosa
      clearInterval(spinnerInterval);
      process.stdout.write('\r' + ' '.repeat(50) + '\r');
      
      // Registrar la respuesta exitosa
      logSoapResponse(methodName, result.result, false);
      log(`\n✅ Operación ${methodName} completada exitosamente\n`, 'success');
      
      return result.result;
      
    } catch (error) {
      clearInterval(spinnerInterval);
      process.stdout.write('\r' + ' '.repeat(50) + '\r');
      
      // Guardar el último error
      lastError = error;
      
      // Registrar el error
      log(`\n❌ Error en ${methodName} (Intento ${attempt}/${retries}):`, 'error');
      log(`Mensaje: ${error.message}`, 'error');
      
      if (error.isTruncated) {
        log('La respuesta del servidor está incompleta (truncada)', 'warn');
      }
      
      // Mostrar detalles adicionales del error
      if (error.response) {
        log(`Estado: ${error.response.statusCode || 'Desconocido'}`, 'error');
        log(`Mensaje: ${error.response.statusText || 'Sin mensaje de error'}`, 'error');
        
        // Mostrar encabezados de respuesta
        if (error.response.headers) {
          log('Encabezados de respuesta:', 'debug');
          log(JSON.stringify(error.response.headers, null, 2), 'debug');
        }
        
        // Mostrar datos de respuesta si están disponibles
        if (error.response.data) {
          log('Datos de respuesta (primeros 500 caracteres):', 'debug');
          const responseData = typeof error.response.data === 'string' 
            ? error.response.data 
            : JSON.stringify(error.response.data);
          log(responseData.substring(0, 500) + (responseData.length > 500 ? '...' : ''), 'debug');
        }
      }
      
      // Si no es el último intento, esperar antes de reintentar
      if (attempt < retries) {
        const delay = RETRY_DELAY * attempt; // Backoff exponencial
        log(`\n🔄 Reintentando en ${delay/1000} segundos... (${attempt + 1}/${retries})\n`, 'warn');
        await wait(delay);
      }
    }
  }
  
  // Si llegamos aquí, todos los intentos fallaron
  log(`\n❌ Se agotaron los ${retries} intentos para ${methodName}\n`, 'error');
  throw lastError;
}

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
function log(message, type = 'info', error = null) {
  const timestamp = getTimestamp();
  const typeUpper = type.toUpperCase();
  const typeColor = type === 'error' ? '\x1b[31m' : '\x1b[36m';
  
  // Mensaje base
  const logMessage = `[${timestamp}] ${typeColor}${typeUpper}\x1b[0m: ${message}`;
  
  // Si hay un error, agregar detalles adicionales
  if (error) {
    const errorDetails = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
      response: error.response ? {
        status: error.response.statusCode,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      } : undefined,
      request: error.request ? {
        method: error.request.method,
        path: error.request.path,
        headers: error.request.getHeaders()
      } : undefined
    };
    
    console.error(logMessage);
    console.error('Detalles del error:', JSON.stringify(errorDetails, null, 2));
    
    // Registrar en el archivo de log
    fs.appendFileSync(LOG_FILE, `${logMessage}\nDetalles del error: ${JSON.stringify(errorDetails, null, 2)}\n\n`, 'utf8');
    return;
  }
  
  // Para mensajes que no son de error
  if (type === 'error') {
    console.error(logMessage);
  } else {
    console.log(logMessage);
  }
  
  // Registrar en el archivo de log
  fs.appendFileSync(LOG_FILE, `${logMessage}\n`, 'utf8');
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
  escribirLog('=== INICIANDO CONSULTA DE CATEGORÍAS ===', 'INFO');
  console.log('\n\x1b[36m=== OBTENIENDO CATEGORÍAS ===\x1b[0m');
  
  return new Promise((resolve) => {
    const options = {
      method: 'listarCategorias',
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
    escribirLog(`Enviando petición SOAP para listar categorías`, 'DEBUG');
    
    client.listarCategorias({}, (err, result) => {
      if (err) {
        console.error('\n\x1b[31m✗ Error al obtener categorías\x1b[0m');
        console.error(`  ${err.message || 'Error desconocido'}`);
        escribirLog(`Error al obtener categorías: ${err.message}`, 'ERROR');
        return resolve([]);
      }
      
      try {
        escribirLog(`Respuesta cruda de listarCategorias: ${JSON.stringify(result, null, 2)}`, 'DEBUG');
        
        // Manejar diferentes formatos de respuesta
        let categorias = [];
        
        // Caso 1: Nueva estructura CategoriaListResponse (similar a ProveedorListResponse)
        if (result?.return?.categorias) {
          categorias = Array.isArray(result.return.categorias) 
            ? result.return.categorias 
            : [result.return.categorias];
        } 
        // Caso 2: Respuesta directa en result.return.datos (formato anterior)
        else if (result?.return?.datos) {
          categorias = Array.isArray(result.return.datos) 
            ? result.return.datos 
            : [result.return.datos];
        } 
        // Caso 3: Respuesta en result.return
        else if (result?.return) {
          categorias = Array.isArray(result.return) 
            ? result.return 
            : [result.return];
        }
        // Caso 4: Respuesta directa
        else if (Array.isArray(result)) {
          categorias = result;
        }
        
        escribirLog(`Categorías obtenidas: ${categorias.length}`, 'INFO');
        
        if (categorias.length === 0) {
          console.log('\x1b[33mℹ No se encontraron categorías.\x1b[0m');
        } else {
          console.log(`\x1b[32m✓ Se encontraron ${categorias.length} categorías\x1b[0m`);
        }
        
        resolve(categorias);
        
      } catch (error) {
        console.error('\n\x1b[31m✗ Error al procesar las categorías\x1b[0m');
        console.error(`  ${error.message || 'Error desconocido'}`);
        escribirLog(`Error al procesar categorías: ${error.message}\n${error.stack}`, 'ERROR');
        resolve([]);
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
    
    return new Promise((resolve) => {
    // Registrar la petición
    escribirLog(`Enviando petición SOAP para listar proveedores`, 'DEBUG');
    
    // Mostrar indicador de carga
    const loadingChars = ['|', '/', '-', '\\'];
    let i = 0;
    const loadingInterval = setInterval(() => {
      process.stdout.write(`\rCargando ${loadingChars[i++ % loadingChars.length]}`);
    }, 100);
    
    try {
      // Realizar la llamada SOAP
      client.listarProveedores({}, (err, result) => {
        clearInterval(loadingInterval);
        process.stdout.write('\r' + ' '.repeat(50) + '\r'); // Limpiar la línea de carga
        
        if (err) {
          console.error('\n\x1b[31m✗ Error al obtener proveedores\x1b[0m');
          console.error(`  ${err.message || 'Error desconocido'}`);
          escribirLog(`Error al obtener proveedores: ${err.message}`, 'ERROR');
          return resolve([]);
        }
        
        try {
          escribirLog(`Respuesta cruda de listarProveedores: ${JSON.stringify(result, null, 2)}`, 'DEBUG');
          
          // Manejar diferentes formatos de respuesta
          let proveedores = [];
          
          // Caso 1: Respuesta directa en result.return.datos
          if (result?.return?.datos) {
            proveedores = Array.isArray(result.return.datos) 
              ? result.return.datos 
              : [result.return.datos];
          } 
          // Caso 2: Respuesta en result.return
          else if (result?.return) {
            proveedores = Array.isArray(result.return) 
              ? result.return 
              : [result.return];
          }
          // Caso 3: Respuesta directa
          else if (Array.isArray(result)) {
            proveedores = result;
          }
          
          escribirLog(`Proveedores obtenidos: ${proveedores.length}`, 'INFO');
          
          if (proveedores.length === 0) {
            console.log('\x1b[33mℹ No se encontraron proveedores.\x1b[0m');
            escribirLog('No se encontraron proveedores', 'INFO');
          } else {
            console.log(`\x1b[32m✓ Se encontraron ${proveedores.length} proveedores\x1b[0m`);
            
            // Mostrar mensaje adicional si está disponible
            if (result?.return?.mensaje) {
              console.log(`\x1b[36mℹ ${result.return.mensaje}\x1b[0m`);
              escribirLog(`Mensaje adicional: ${result.return.mensaje}`, 'INFO');
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
              console.log(`  Dirección: ${prov.direccion || 'No disponible'}`);
            });
          }
          
          resolve(proveedores);
        } catch (parseError) {
          console.error('\n\x1b[31m✗ Error al procesar la respuesta del servidor\x1b[0m');
          escribirLog(`Error al procesar la respuesta: ${parseError.message}`, 'ERROR');
          resolve([]); // Resolver con array vacío en caso de error
        }
      });
    } catch (error) {
      clearInterval(loadingInterval);
      console.error('\n\x1b[31m✗ Error inesperado al obtener proveedores\x1b[0m');
      escribirLog(`Error inesperado: ${error.message}`, 'ERROR');
      resolve([]); // Resolver con array vacío en caso de error
    }
  });
  });
}

function selectFromList(items, prompt) {
  return new Promise((resolve) => {
    try {
      // Validar parámetros de entrada
      if (!Array.isArray(items)) {
        console.error('\x1b[31mError: items debe ser un array\x1b[0m');
        return resolve(null);
      }
      
      if (typeof prompt !== 'string') {
        console.error('\x1b[31mError: prompt debe ser un string\x1b[0m');
        return resolve(null);
      }
      
      // Mostrar opciones
      console.log('\n\x1b[36m=== ' + prompt.toUpperCase() + ' ===\x1b[0m');
      
      // Mostrar cada ítem
      items.forEach((item, index) => {
        const name = item.nombre || item.razonSocial || 'Sin nombre';
        console.log(`\x1b[33m${index + 1}\x1b[0m. ${name} (ID: ${item.id || 'N/A'})`);
      });
      
      console.log('\n\x1b[33m0\x1b[0m. Ninguno');
      
      // Manejar la selección del usuario
      rl.question(`Seleccione ${prompt} (número): `, (choice) => {
        try {
          const index = parseInt(choice, 10);
          
          if (isNaN(index)) {
            console.log('\x1b[31mPor favor ingrese un número válido\x1b[0m');
            return resolve(selectFromList(items, prompt));
          }
          
          if (index === 0) {
            return resolve(null);
          }
          
          const selectedIndex = index - 1;
          if (selectedIndex >= 0 && selectedIndex < items.length) {
            return resolve(items[selectedIndex].id);
          }
          
          console.log('\x1b[31mOpción inválida. Intente de nuevo.\x1b[0m');
          resolve(selectFromList(items, prompt));
          
        } catch (error) {
          console.error('\x1b[31mError al procesar la selección\x1b[0m');
          resolve(selectFromList(items, prompt));
        }
      });
      
    } catch (error) {
      console.error('\x1b[31mError inesperado en selectFromList\x1b[0m');
      resolve(null);
    }
  });
}

async function executeOperation(client, operation) {
  log(`\nIniciando operación: ${operation}`, 'info');
  
  const handleOperationError = (err, operationName) => {
    log(`Error en ${operationName}: ${err?.message || 'Error desconocido'}`, 'error');
    
    // Registrar detalles del error de manera segura
    if (err) {
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
      
      const errorDetails = safeStringify(errorInfo, null, 2);
      log(`Detalles del error: ${errorDetails}`, 'debug');
    }
    
    // Mostrar menú nuevamente
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
      });
      break;
      
    case 'consultarArticulo':
      log('Consultando artículo...', 'info');
      
      // Función para mostrar el menú de ayuda
      const mostrarAyuda = () => {
        console.log('\n\x1b[36m=== AYUDA: CONSULTA DE ARTÍCULO ===\x1b[0m');
        console.log('  Ingrese el código del artículo que desea consultar.');
        console.log('  Ejemplos de códigos válidos:');
        console.log('  - MART001');
        console.log('  - HERR025');
        console.log('  - PINT100');
        console.log('\n  Escriba \'salir\' para volver al menú principal.\n');
      };
      
      const procesarConsultaArticulo = (codigo) => {
        // Validar el código
        if (!codigo || codigo.trim() === '') {
          console.log('\n\x1b[33m⚠ Por favor ingrese un código de artículo.\x1b[0m\n');
          return false;
        }
        
        codigo = codigo.trim();
        log(`Consultando artículo con código: ${codigo}`, 'info');
        
        // Mostrar indicador de carga
        const spinner = ['|', '/', '-', '\\'];
        let spinnerIndex = 0;
        const loadingInterval = setInterval(() => {
          process.stdout.write(`\r${spinner[spinnerIndex++ % spinner.length]} Buscando artículo...`);
        }, 100);
        
        // Realizar la consulta
        client.consultarArticulo({ codigo }, (err, result) => {
          // Limpiar el indicador de carga
          clearInterval(loadingInterval);
          process.stdout.write('\r' + ' '.repeat(30) + '\r');
          
          if (err) {
            console.log('\n\x1b[31m✖ Error al consultar el artículo:\x1b[0m');
            console.log(`  ${err.message || 'Error desconocido'}`);
            
            // Mostrar sugerencias para el usuario
            console.log('\n\x1b[33mSugerencias:\x1b[0m');
            console.log('  1. Verifique que el código del artículo sea correcto');
            console.log('  2. Verifique su conexión a internet');
            console.log('  3. Asegúrese de que el servidor esté en ejecución\n');
            
            showMenu(client);
            return;
          }
          
          // Procesar la respuesta exitosa
          try {
            console.log('\n\x1b[32m✓ Artículo encontrado\x1b[0m\n');
            
            // Mostrar los detalles del artículo
            if (result.return) {
              const articulo = result.return;
              console.log('\x1b[36m=== DETALLES DEL ARTÍCULO ===\x1b[0m');
              console.log(`  • Código: ${articulo.codigo || 'No disponible'}`);
              console.log(`  • Nombre: ${articulo.nombre || 'No disponible'}`);
              
              if (articulo.descripcion) {
                console.log(`  • Descripción: ${articulo.descripcion}`);
              }
              
              if (articulo.precioVenta) {
                console.log(`  • Precio: $${articulo.precioVenta.toFixed(2)}`);
              }
              
              if (articulo.stockActual !== undefined) {
                console.log(`  • Stock actual: ${articulo.stockActual}`);
              }
              
              if (articulo.stockMinimo !== undefined) {
                console.log(`  • Stock mínimo: ${articulo.stockMinimo}`);
              }
              
              // Mostrar categoría si está disponible
              if (articulo.categoria) {
                console.log(`  • Categoría: ${articulo.categoria.nombre || 'No disponible'}`);
              }
              
              // Mostrar proveedor si está disponible
              if (articulo.proveedor) {
                console.log(`  • Proveedor: ${articulo.proveedor.nombre || articulo.proveedor.razonSocial || 'No disponible'}`);
              }
              
              console.log('\n\x1b[32mOperación completada con éxito.\x1b[0m\n');
            } else {
              console.log('\x1b[33mEl artículo no fue encontrado o no hay información disponible.\x1b[0m\n');
            }
            
            // Preguntar si desea consultar otro artículo
            rl.question('¿Desea consultar otro artículo? (s/n): ', (respuesta) => {
              if (respuesta.toLowerCase() === 's') {
                solicitarCodigo();
              } else {
                console.log('\nVolviendo al menú principal...\n');
                showMenu(client);
              }
            });
            
          } catch (error) {
            console.log('\n\x1b[31m✖ Error al procesar la respuesta del servidor:\x1b[0m');
            console.log(`  ${error.message || 'Error desconocido'}`);
            console.log('\n\x1b[33mPor favor, intente nuevamente.\x1b[0m\n');
            
            // Registrar el error en el log
            escribirLog(`Error al procesar respuesta: ${error.message}\n${error.stack}`, 'ERROR');
            
            // Volver al menú principal
            showMenu(client);
          }
        });
        
        return true;
      };
      
      // Mostrar ayuda inicial
      mostrarAyuda();
      
      // Iniciar la interacción con el usuario
      const solicitarCodigo = () => {
        rl.question('\nIngrese código del artículo (o \'ayuda\' para ver ejemplos): ', (codigo) => {
          // Mostrar ayuda si el usuario lo solicita
          if (codigo.toLowerCase() === 'ayuda') {
            mostrarAyuda();
            return solicitarCodigo();
          }
          
          // Permitir salir
          if (codigo.toLowerCase() === 'salir') {
            console.log('\nVolviendo al menú principal...\n');
            showMenu(client);
            return;
          }
          
          // Procesar la consulta
          if (!procesarConsultaArticulo(codigo)) {
            // Si hubo un error de validación, volver a solicitar el código
            return solicitarCodigo();
          }
        });
      };
      
      // Iniciar el proceso
      solicitarCodigo();
      break;
      
    case 'insertarArticulo':
      // Función auxiliar para obtener datos del artículo
      const obtenerDatosArticulo = () => {
        return new Promise(async (resolve, reject) => {
          try {
            const categorias = await getCategorias(client);
            const categoriaId = await selectFromList(categorias, 'categoría');
            const proveedores = await getProveedores(client);
            const proveedorId = await selectFromList(proveedores, 'proveedor');
            
            rl.question('Precio de compra: ', (precioCompra) => {
              rl.question('Precio de venta: ', (precioVenta) => {
                rl.question('Stock inicial: ', (stockInicial) => {
                  rl.question('Stock mínimo: ', (stockMinimo) => {
                    resolve({
                      categoria: { id: categoriaId },
                      proveedor: { id: proveedorId },
                      precioCompra: parseFloat(precioCompra),
                      precioVenta: parseFloat(precioVenta),
                      stockActual: parseInt(stockInicial, 10) || 0,
                      stockMinimo: parseInt(stockMinimo, 10) || 0
                    });
                  });
                });
              });
            });
          } catch (error) {
            log(`Error al obtener datos del artículo: ${error.message}`, 'error');
            reject(error);
          }
        });
      };

      // Función para insertar el artículo
      const insertarArticulo = async () => {
        try {
          const codigo = await new Promise(resolve => rl.question('Código del artículo: ', resolve));
          const nombre = await new Promise(resolve => rl.question('Nombre: ', resolve));
          const descripcion = await new Promise(resolve => rl.question('Descripción: ', resolve));
          
          const articuloData = await obtenerDatosArticulo();
          
          // Construir el objeto de artículo
          const articulo = {
            codigo,
            nombre,
            descripcion,
            ...articuloData
          };
          
          log(JSON.stringify(articulo, null, 2), 'debug');
          
          executeWithLogging('insertarArticulo', articulo, (result) => {
            handleResponse(null, result);
            showMenu(client);
          });
        } catch (error) {
          log(`Error al insertar artículo: ${error.message}`, 'error');
          showMenu(client);
        }
      };

      // Iniciar el proceso de inserción
      insertarArticulo();
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
  const timestamp = new Date().toISOString();
  log(`\n=== INICIO RESPUESTA [${timestamp}] ===`, 'debug');
  
  // Registrar la operación actual
  log(`Operación: ${operation || 'No especificada'}`, 'debug');
  
  if (err) {
    // Crear un objeto de error detallado
    const errorDetails = {
      timestamp,
      operation,
      error: {
        name: err.name || 'Error',
        message: err.message || 'Error desconocido',
        code: err.code,
        stack: err.stack,
        response: err.response ? {
          status: err.response.statusCode,
          statusText: err.response.statusText,
          headers: err.response.headers,
          data: err.response.data
        } : undefined,
        request: err.request ? {
          method: err.request.method,
          path: err.request.path,
          headers: err.request.getHeaders()
        } : undefined
      },
      rawError: err
    };
    
    // Manejar errores SOAP
    if (err.root?.Envelope?.Body?.Fault) {
      const fault = err.root.Envelope.Body.Fault;
      const errorCode = fault.faultcode || 'SOAP_FAULT';
      const errorMsg = fault.faultstring || 'Error en el servicio SOAP';
      
      // Agregar detalles del error SOAP
      errorDetails.soapFault = {
        faultCode: errorCode,
        faultString: errorMsg,
        detail: fault.detail
      };
      
      // Mostrar mensaje de error en consola
      console.log('\n\x1b[31m✖ ERROR EN EL SERVICIO SOAP:\x1b[0m');
      console.log(`  Operación: ${operation || 'No especificada'}`);
      console.log(`  Código: ${errorCode}`);
      console.log(`  Mensaje: ${errorMsg}`);
      
      if (fault.detail) {
        console.log('\n\x1b[33mDetalles del error:\x1b[0m');
        mostrarObjeto(fault.detail, 1, true);
      }
      
      // Registrar en el log
      log(`Error SOAP en ${operation}: ${errorCode} - ${errorMsg}`, 'error', err);
      log(`Detalles del error SOAP: ${JSON.stringify(errorDetails, null, 2)}`, 'debug');
      
    } else {
      // Manejar otros tipos de errores
      console.log('\n\x1b[31m✖ ERROR EN LA OPERACIÓN:\x1b[0m');
      console.log(`  Operación: ${operation || 'No especificada'}`);
      console.log(`  Tipo: ${errorDetails.error.name}`);
      console.log(`  Mensaje: ${errorDetails.error.message}`);
      
      if (err.response) {
        console.log(`\n  \x1b[33mRespuesta del servidor (${err.response.statusCode}):\x1b[0m`);
        console.log(`  URL: ${err.config?.url || 'No disponible'}`);
        console.log(`  Método: ${err.config?.method?.toUpperCase() || 'No disponible'}`);
        
        if (err.response.data) {
          console.log('\n  Datos de respuesta:');
          console.log(`  ${JSON.stringify(err.response.data, null, 2).replace(/\n/g, '\n  ')}`);
        }
      }
      
      // Registrar en el log
      log(`Error en ${operation}: ${errorDetails.error.name} - ${errorDetails.error.message}`, 'error', err);
      log(`Detalles completos del error: ${JSON.stringify(errorDetails, null, 2)}`, 'debug');
    }
    
    // Mostrar stack trace si está disponible
    if (process.env.DEBUG && err.stack) {
      log('Stack trace:', 'debug');
      log(err.stack, 'debug');
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

// Iniciar la aplicación
main();
