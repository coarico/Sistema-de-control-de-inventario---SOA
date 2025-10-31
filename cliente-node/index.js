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

// Función para configurar las credenciales de autenticación
function configurarAutenticacion() {
  return new Promise((resolve) => {
  console.log('\n\x1b[36m=== CONFIGURACIÓN DE AUTENTICACIÓN SEGURA ===\x1b[0m');
  console.log('\x1b[33mIMPORTANTE: Este sistema usa contraseñas seguras únicas por rol\x1b[0m\n');
    
    console.log('Usuarios disponibles:');
    let opcion = 1;
    Object.keys(CREDENCIALES_SISTEMA).forEach(username => {
      const user = CREDENCIALES_SISTEMA[username];
      const roleColor = user.role === 'ADMIN' ? '\x1b[31m' : user.role === 'OPERADOR' ? '\x1b[33m' : '\x1b[32m';
      console.log(`  ${opcion}. \x1b[36m${username}\x1b[0m - ${roleColor}${user.role}\x1b[0m`);
      console.log(`     ${user.description}`);
      opcion++;
    });
    
    console.log(`\n  ${opcion}. \x1b[35mCredenciales personalizadas\x1b[0m - Ingresar manualmente`);
    console.log(`  ${opcion + 1}. \x1b[32mModo consulta rápida\x1b[0m - Usuario de solo lectura`);
    
    rl.question('\nSeleccione una opción: ', (choice) => {
      const usernames = Object.keys(CREDENCIALES_SISTEMA);
      const choiceNum = parseInt(choice);
      
      if (choiceNum >= 1 && choiceNum <= usernames.length) {
        // Usuario predefinido seleccionado
        const selectedUsername = usernames[choiceNum - 1];
        const selectedUser = CREDENCIALES_SISTEMA[selectedUsername];
        
        AUTH_CONFIG = {
          username: selectedUsername,
          password: selectedUser.password,
          role: selectedUser.role
        };
        
        console.log(`\x1b[32mConfigurado como ${selectedUsername.toUpperCase()} (${selectedUser.role})\x1b[0m`);
        console.log(`\x1b[90m  Contraseña: ${selectedUser.password}\x1b[0m`);
        
      } else if (choiceNum === usernames.length + 1) {
        // Credenciales personalizadas
        console.log('\n\x1b[35m=== CREDENCIALES PERSONALIZADAS ===\x1b[0m');
        rl.question('Nombre de usuario: ', (username) => {
          rl.question('Contraseña: ', (password) => {
            // Intentar determinar el rol basado en el usuario conocido
            if (CREDENCIALES_SISTEMA[username]) {
              AUTH_CONFIG = {
                username: username,
                password: password,
                role: CREDENCIALES_SISTEMA[username].role
              };
            } else {
              AUTH_CONFIG = {
                username: username,
                password: password,
                role: 'CONSULTA' // Rol por defecto más restrictivo
              };
            }
            
            console.log(`\x1b[32mConfigurado con credenciales personalizadas\x1b[0m`);
            console.log(`\x1b[90m  Usuario: ${AUTH_CONFIG.username}, Rol asumido: ${AUTH_CONFIG.role}\x1b[0m`);
            log(`Autenticación configurada - Usuario: ${AUTH_CONFIG.username}, Rol: ${AUTH_CONFIG.role}`, 'info');
            resolve();
          });
        });
        return; // No resolver aquí, se resuelve en el callback anidado
        
      } else if (choiceNum === usernames.length + 2) {
        // Modo consulta rápida - Usuario de solo lectura
        AUTH_CONFIG = {
          username: 'consulta',
          password: 'ReadOnly@456',
          role: 'CONSULTA'
        };
        
        console.log('\x1b[32mConfigurado en modo consulta rápida (solo lectura)\x1b[0m');
        console.log('\x1b[90m  Usuario: consulta, Contraseña: ReadOnly@456\x1b[0m');
        
      } else if (choiceNum === usernames.length + 3) {
        // Opción inválida en menú de autenticación
        console.log('\x1b[31mOpción inválida\x1b[0m');
        
      } else {
        console.log('\x1b[31mOpción inválida, manteniendo configuración actual\x1b[0m');
      }
      
      log(`Autenticación configurada - Usuario: ${AUTH_CONFIG.username}, Rol: ${AUTH_CONFIG.role}`, 'info');
      resolve();
    });
  });
}

// Función para mostrar las credenciales del sistema
function mostrarCredencialesDelSistema() {
  console.log('\n\x1b[36m=== CREDENCIALES DEL SISTEMA ===\x1b[0m');
  console.log('\x1b[33mIMPORTANTE: Estas son las contraseñas predeterminadas del sistema\x1b[0m');
  console.log('\x1b[33m    En producción, deben cambiarse por contraseñas únicas\x1b[0m\n');
  
  Object.keys(CREDENCIALES_SISTEMA).forEach(username => {
    const user = CREDENCIALES_SISTEMA[username];
    const roleColor = user.role === 'ADMIN' ? '\x1b[31m' : user.role === 'OPERADOR' ? '\x1b[33m' : '\x1b[32m';
    
    console.log(`\x1b[36m${username}\x1b[0m:`);
    console.log(`  Contraseña: \x1b[37m${user.password}\x1b[0m`);
    console.log(`  Rol: ${roleColor}${user.role}\x1b[0m`);
    console.log(`  Descripción: ${user.description}\n`);
  });
  
  console.log('\x1b[90mPresione Enter para continuar...\x1b[0m');
  rl.question('', () => {});
}

// Función para mostrar información del usuario actual
function mostrarInfoUsuario() {
  console.log('\n\x1b[36m=== INFORMACIÓN DE SESIÓN ===\x1b[0m');
  console.log(`Usuario: \x1b[33m${AUTH_CONFIG.username}\x1b[0m`);
  console.log(`Rol: \x1b[33m${AUTH_CONFIG.role}\x1b[0m`);
  
  switch (AUTH_CONFIG.role) {
    case 'ADMIN':
      console.log('Permisos: \x1b[32mTodos (insertar, consultar, actualizar, listar)\x1b[0m');
      break;
    case 'OPERADOR':
      console.log('Permisos: \x1b[33mConsulta, actualización de stock y listados\x1b[0m');
      break;
    case 'CONSULTA':
      console.log('Permisos: \x1b[31mSolo consulta y listados\x1b[0m');
      break;
  }
  console.log('');
}

// Función para validar permisos antes de ejecutar operaciones
function validarPermisos(operacion) {
  const permisosPorRol = {
    'ADMIN': ['insertar', 'consultar', 'actualizar', 'listar'],
    'OPERADOR': ['consultar', 'actualizar', 'listar'],
    'CONSULTA': ['consultar', 'listar']
  };
  
  const permisosUsuario = permisosPorRol[AUTH_CONFIG.role] || [];
  return permisosUsuario.includes(operacion);
}

// Función mejorada para parsear respuestas XML manualmente
function parseXMLResponse(xmlData, methodName) {
  if (!xmlData || typeof xmlData !== 'string') {
    console.log(`XML data no válido: ${typeof xmlData}`);
    return null;
  }
  
  console.log(`Procesando respuesta para ${methodName}...`);
  console.log(`📄 XML completo (${xmlData.length} chars): ${xmlData}`);
  
  // Si el XML está incompleto pero tiene información parcial, intentar extraerla
  if (xmlData.includes('<?xml') && xmlData.includes('<S:Envelope')) {
    console.log(`XML SOAP detectado, aunque posiblemente incompleto`);
    
    // Buscar diferentes patrones de respuesta más flexibles
    const responsePatterns = [
      new RegExp(`<ns2:${methodName}Response[^>]*>([\\s\\S]*?)</ns2:${methodName}Response>`, 'i'),
      new RegExp(`<${methodName}Response[^>]*>([\\s\\S]*?)</${methodName}Response>`, 'i'),
      new RegExp(`<return[^>]*>([\\s\\S]*?)</return>`, 'i'),
      new RegExp(`<ns1:${methodName}Response[^>]*>([\\s\\S]*?)</ns1:${methodName}Response>`, 'i')
    ];
    
    let match = null;
    let responseContent = '';
    
    for (const pattern of responsePatterns) {
      match = xmlData.match(pattern);
      if (match) {
        responseContent = match[1];
        console.log(`Patrón encontrado: ${pattern.source}`);
        break;
      }
    }
    
    if (!match) {
      console.log(`No se encontró patrón de respuesta válido para ${methodName}`);
      console.log(`Intentando buscar elementos de respuesta directamente...`);
      
      // Intentar buscar elementos de respuesta directamente en el XML
      if (methodName === 'consultarArticulo') {
        // Buscar directamente campos esperados
        const codigoMatch = xmlData.match(/<codigo[^>]*>([^<]*)<\/codigo>/i);
        const nombreMatch = xmlData.match(/<nombre[^>]*>([^<]*)<\/nombre>/i);
        
        if (codigoMatch || nombreMatch) {
          console.log(`⚠️ Encontrados elementos de artículo parciales, construyendo respuesta...`);
          return {
            exitoso: true,
            datos: {
              codigo: codigoMatch?.[1] || 'N/A',
              nombre: nombreMatch?.[1] || 'N/A',
              descripcion: xmlData.match(/<descripcion[^>]*>([^<]*)<\/descripcion>/i)?.[1] || '',
              precio: parseFloat(xmlData.match(/<precioVenta[^>]*>([^<]*)<\/precioVenta>/i)?.[1] || 0),
              stock: parseInt(xmlData.match(/<stockActual[^>]*>([^<]*)<\/stockActual>/i)?.[1] || 0)
            }
          };
        }
      }
      
      return { exitoso: false, mensaje: 'No se pudo parsear la respuesta XML incompleta' };
    }
    
    console.log(`✅ Contenido de respuesta extraído: ${responseContent.substring(0, 200)}...`);
    
    // Para consultarArticulo, buscar estructura específica
    if (methodName === 'consultarArticulo') {
      try {
        // Función para extraer valores de manera más robusta
        const extractValue = (field) => {
          const patterns = [
            new RegExp(`<${field}[^>]*>([^<]*)</${field}>`, 'i'),
            new RegExp(`<ns\\d*:${field}[^>]*>([^<]*)</ns\\d*:${field}>`, 'i')
          ];
          
          for (const pattern of patterns) {
            const match = responseContent.match(pattern);
            if (match) return match[1].trim();
          }
          return null;
        };
        
        const exitoso = extractValue('exitoso') === 'true';
        const mensaje = extractValue('mensaje');
        
        if (!exitoso && mensaje) {
          return { exitoso: false, mensaje };
        }
        
        // Buscar datos del artículo con múltiples patrones
        const datosPatterns = [
          /<datos[^>]*>([\s\S]*?)<\/datos>/i,
          /<ns\d*:datos[^>]*>([\s\S]*?)<\/ns\d*:datos>/i,
          responseContent // Si no hay wrapper de datos, usar todo el contenido
        ];
        
        let articuloXML = '';
        for (const pattern of datosPatterns) {
          if (typeof pattern === 'string') {
            articuloXML = pattern;
            break;
          } else {
            const match = responseContent.match(pattern);
            if (match) {
              articuloXML = match[1];
              break;
            }
          }
        }
        
        if (!articuloXML) {
          articuloXML = responseContent;
        }
        
        const articulo = {
          codigo: extractValue('codigo') || (articuloXML.match(/<codigo[^>]*>([^<]*)<\/codigo>/i)?.[1]),
          nombre: extractValue('nombre') || (articuloXML.match(/<nombre[^>]*>([^<]*)<\/nombre>/i)?.[1]),
          descripcion: extractValue('descripcion') || (articuloXML.match(/<descripcion[^>]*>([^<]*)<\/descripcion>/i)?.[1]) || '',
          precio: parseFloat(extractValue('precioVenta') || articuloXML.match(/<precioVenta[^>]*>([^<]*)<\/precioVenta>/i)?.[1] || 0),
          stock: parseInt(extractValue('stockActual') || articuloXML.match(/<stockActual[^>]*>([^<]*)<\/stockActual>/i)?.[1] || 0),
        };
        
        // Verificar si al menos tenemos información básica
        if (articulo.codigo || articulo.nombre) {
          return { exitoso: true, datos: articulo };
        } else {
          return { exitoso: false, mensaje: mensaje || 'No se encontraron datos del artículo' };
        }
        
      } catch (error) {
        console.log(`❌ Error parseando consultarArticulo: ${error.message}`);
        return { exitoso: false, mensaje: 'Error procesando respuesta' };
      }
    }
  }
  
  // Para otras operaciones, retornar respuesta genérica
  return { exitoso: true, mensaje: 'Operación procesada' };
}

// Función mejorada para verificar si una respuesta está truncada
function isTruncatedResponse(data) {
  if (!data) return true;
  
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  
  // Verificar si parece ser una respuesta XML SOAP
  const isXMLResponse = str.includes('<?xml') || str.includes('<S:') || str.includes('<soap:');
  
  if (!isXMLResponse) {
    // Si no es XML, no puede estar truncada
    return false;
  }
  
  // Para respuestas XML, verificar si tiene una etiqueta de cierre de envelope
  const hasValidEnding = str.includes('</S:Envelope>') || 
                        str.includes('</soap:Envelope>') ||
                        str.includes('</soapenv:Envelope>');
  
  // Verificar si la respuesta es muy corta para ser válida
  const tooShort = str.length < 200; // Aumentamos el umbral
  
  // Si tiene al menos el body completo, no considerarla truncada
  const hasCompleteBody = str.includes('</S:Body>') || 
                         str.includes('</soap:Body>') ||
                         str.includes('</soapenv:Body>');
  
  // Si termina abruptamente en una etiqueta incompleta, es truncada
  const endsAbruptly = str.endsWith('<S:Body>') || 
                      str.endsWith('<soap:Body>') ||
                      str.endsWith('<soapenv:Body>') ||
                      str.match(/<[^>]*$/); // Termina con etiqueta incompleta
  
  const isTruncated = (!hasValidEnding && !hasCompleteBody) || tooShort || endsAbruptly;
  
  // Log para debug con más información
  if (isTruncated) {
    console.log(`🚨 Respuesta truncada detectada:`);
    console.log(`   - Longitud: ${str.length}`);
    console.log(`   - Tiene ending válido: ${hasValidEnding}`);
    console.log(`   - Tiene body completo: ${hasCompleteBody}`);
    console.log(`   - Termina abruptamente: ${endsAbruptly}`);
    console.log(`   - Muy corta: ${tooShort}`);
    console.log(`📄 Contenido: ${str.substring(0, 300)}...`);
  }
  
  return isTruncated;
}

// Función para esperar un tiempo determinado
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Función para ejecutar operaciones SOAP con manejo de errores y reintentos
async function executeWithLogging(client, methodName, args = {}, retries = DEFAULT_RETRIES) {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    const spinner = ['|', '/', '-', '\\'];
    let spinnerIndex = 0;
    const spinnerInterval = setInterval(() => {
      process.stdout.write(`\r${spinner[spinnerIndex++ % spinner.length]} Procesando (Intento ${attempt}/${retries})...`);
    }, 100);
    
    try {
      log(`\n=== Intento ${attempt} de ${retries} - ${methodName} ===`, 'debug');
      
      // Configuración de la petición SOAP con timeouts más largos y mejor manejo
      const baseTimeout = 10000; // Timeout base más corto para detectar problemas antes
      const options = {
        disableCache: true,
        forceSoap12Headers: false, // Usar SOAP 1.1 para mejor compatibilidad
        envelopeKey: 'soap',
        escapeXML: false,
        timeout: baseTimeout + (attempt * 5000), // Timeout incremental
        returnFault: true,
        // Configuraciones adicionales para manejar respuestas grandes
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        // Configuraciones HTTP más específicas
        agent: false,
        forever: false,
        pool: false,
        // Headers optimizados
        headers: {
          'Connection': 'close', // Cambiar a close para evitar problemas de keep-alive
          'Content-Type': 'text/xml; charset=utf-8',
          'Accept': 'text/xml, application/xml, application/soap+xml',
          'User-Agent': 'Node-SOAP-Client/1.0',
          'Cache-Control': 'no-cache'
        },
        // Configuraciones adicionales de axios
        maxRedirects: 0,
        validateStatus: function (status) {
          return status >= 200 && status < 600; // Aceptar más códigos de estado
        }
      };
      
      // Registrar la petición
      logSoapRequest(client, methodName, args);
      
      // Ejecutar la operación con promesas
      const result = await new Promise((resolve, reject) => {
        client[methodName](args, options, (error, result, rawResponse) => {
          // Log para debugging
          console.log(`🔍 SOAP Response Debug:
            - Error: ${!!error}
            - Result: ${!!result}
            - RawResponse: ${!!rawResponse}
            - RawResponse length: ${rawResponse ? rawResponse.length : 0}`);
          
          if (error) {
            console.log(` SOAP Error details:`, {
              message: error.message,
              code: error.code,
              response: error.response?.data ? error.response.data.substring(0, 300) : 'No response data'
            });
            
            // Verificar si es un error de timeout
            if (error.code === 'ESOCKETTIMEDOUT' || error.code === 'ETIMEDOUT') {
              error.message = `Timeout al conectar con el servidor (${options.timeout}ms)`;
              reject(error);
              return;
            }
            
            // Si hay datos en el error, intentar procesarlos
            if (error.response?.data) {
              const errorData = error.response.data;
              
              console.log(`⚠️ Error con datos de respuesta (${errorData.length} chars), analizando...`);
              
              // Si la respuesta parece ser un SOAP válido pero posiblemente truncado,
              // intentar procesarla de todas formas
              if (errorData.includes('<?xml') && errorData.includes('<S:Envelope')) {
                console.log(`⚠️ Respuesta SOAP detectada en error, intentando procesar...`);
                resolve({ result: null, rawResponse: errorData, hasError: true });
                return;
              }
              
              // Si la respuesta está claramente truncada y no procesable, solo rechazar en el último intento
              if (isTruncatedResponse(errorData) && attempt === retries) {
                error.isTruncated = true;
                error.message = 'La respuesta del servidor está incompleta (truncada) después de todos los intentos';
                reject(error);
                return;
              } else if (isTruncatedResponse(errorData)) {
                // En intentos anteriores, continuar con reintentos
                console.log(`⚠️ Respuesta truncada en intento ${attempt}, reintentando...`);
                reject(new Error(`Respuesta truncada en intento ${attempt}, reintentando`));
                return;
              }
              
              // Si no está truncada, intentar procesar como respuesta válida
              console.log(`⚠️ Error con datos válidos, intentando procesar...`);
              resolve({ result: null, rawResponse: errorData, hasError: true });
              return;
            }
            
            reject(error);
          } else if (isTruncatedResponse(rawResponse)) {
            console.log(`🚨 Respuesta truncada detectada`);
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
      
      // Procesar la respuesta
      let finalResult = result.result;
      
      // Si la respuesta vino con error pero tiene datos válidos, procesarla
      if (result.hasError && result.rawResponse) {
        console.log(`Procesando respuesta que vino como error...`);
        try {
          // Intentar parsear la respuesta XML manualmente
          finalResult = parseXMLResponse(result.rawResponse, methodName);
        } catch (parseError) {
          console.log(` Error parseando XML: ${parseError.message}`);
          finalResult = null;
        }
      }
      
      // Registrar la respuesta exitosa
      logSoapResponse(methodName, finalResult, result.hasError || false);
      log(`\n Operación ${methodName} completada ${result.hasError ? '(con advertencias)' : 'exitosamente'}\n`, 'success');
      
      return finalResult;
      
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

// Configuración de autenticación con contraseñas seguras
let AUTH_CONFIG = {
  username: 'admin',
  password: 'FerretAdmin2024$',
  role: 'ADMIN'
};

// Credenciales predefinidas del sistema
const CREDENCIALES_SISTEMA = {
  admin: { password: 'FerretAdmin2024$', role: 'ADMIN', description: 'Administrador - Acceso completo' },
  operador: { password: 'StockManager#789', role: 'OPERADOR', description: 'Operador - Gestión de stock y consultas' },
  consulta: { password: 'ReadOnly@456', role: 'CONSULTA', description: 'Consulta - Solo lectura' },
  supervisor: { password: 'SuperVisor!321', role: 'OPERADOR', description: 'Supervisor - Gestión de stock y consultas' },
  gerente: { password: 'Manager$2024', role: 'ADMIN', description: 'Gerente - Acceso completo' }
};

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
  
  // Configurar autenticación al inicio
  await configurarAutenticacion();
  
  // Función para verificar si el servidor está disponible
  const checkServerAvailability = async () => {
    try {
      const http = require('http');
      const url = require('url');
      const parsedUrl = url.parse(WSDL_URL);
      
      return new Promise((resolve, reject) => {
        const req = http.request({
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || 80,
          path: parsedUrl.path,
          method: 'GET',
          timeout: 5000
        }, (res) => {
          resolve(res.statusCode < 500);
        });
        
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });
        req.end();
      });
    } catch (error) {
      return false;
    }
  };
  
  // Verificar disponibilidad del servidor antes de crear el cliente
  log('Verificando disponibilidad del servidor...');
  const serverAvailable = await checkServerAvailability();
  if (!serverAvailable) {
    log('⚠️ El servidor puede no estar disponible o responder lentamente', 'warn');
  }
  
  try {
    soap.createClient(WSDL_URL, {
      wsdl_headers: { 
        'User-Agent': 'Node-SOAP-Client',
        'Connection': 'keep-alive',
        'Authorization': 'Basic ' + Buffer.from(`${AUTH_CONFIG.username}:${AUTH_CONFIG.password}`).toString('base64')
      },
      escapeXML: false,
      disableCache: true,
      timeout: 30000,
      // Configuraciones HTTP más robustas
      wsdl_options: {
        rejectUnauthorized: false,
        strictSSL: false,
        forever: false,
        timeout: 30000,
        pool: false,
        // Configuraciones adicionales para manejar respuestas grandes
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      },
      // Configuraciones del cliente SOAP
      forceSoap12Headers: false, // Usar SOAP 1.1 para mejor compatibilidad
      maxBodyLength: Infinity,
      maxContentLength: Infinity
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
  // Mostrar información del usuario
  mostrarInfoUsuario();
  
  console.log('\n\x1b[36m=== MENÚ PRINCIPAL ===\x1b[0m');
  const services = client.describe();
  const operations = [];
  const operationPermissions = {
    'verificarEstado': 'consultar',
    'consultarArticulo': 'consultar', 
    'insertarArticulo': 'insertar',
    'listarCategorias': 'listar',
    'listarProveedores': 'listar',
    'actualizarStock': 'actualizar'
  };
  
  Object.keys(services).forEach(svc => {
    Object.keys(services[svc]).forEach(port => {
      Object.keys(services[svc][port]).forEach(op => {
        const requiredPermission = operationPermissions[op] || 'consultar';
        const hasPermission = validarPermisos(requiredPermission);
        
        operations.push(op);
        const status = hasPermission ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
        const opText = hasPermission ? `\x1b[33m${operations.length}\x1b[0m. ${op}` : 
                                      `\x1b[90m${operations.length}. ${op} (sin permisos)\x1b[0m`;
        console.log(`${status} ${opText}`);
      });
    });
  });

  console.log('\n\x1b[33m98\x1b[0m. Cambiar usuario');
  console.log('\x1b[33m99\x1b[0m. Mostrar información de sesión');
  
  // Solo mostrar opción de contraseñas para administradores en el menú principal
  if (AUTH_CONFIG && AUTH_CONFIG.role === 'ADMIN') {
    console.log('\x1b[33m97\x1b[0m. \x1b[36mMostrar contraseñas del sistema\x1b[0m');
  }
  
  console.log('\x1b[33m0\x1b[0m. Salir');
  
  rl.question('\nSeleccione una operación (número): ', async (choice) => {
    if (choice === '0') {
      console.log('\x1b[32mSaliendo...\x1b[0m');
      return rl.close();
    }
    
    if (choice === '98') {
      await configurarAutenticacion();
      return showMenu(client);
    }
    
    if (choice === '99') {
      mostrarInfoUsuario();
      console.log('Presione Enter para continuar...');
      rl.question('', () => showMenu(client));
      return;
    }
    
    if (choice === '97' && AUTH_CONFIG && AUTH_CONFIG.role === 'ADMIN') {
      mostrarCredencialesDelSistema();
      console.log('Presione Enter para continuar...');
      rl.question('', () => showMenu(client));
      return;
    }
    
    const opIndex = parseInt(choice) - 1;
    if (isNaN(opIndex) || opIndex < 0 || opIndex >= operations.length) {
      console.log('\x1b[31mOpción inválida\x1b[0m');
      return showMenu(client);
    }
    
    const operation = operations[opIndex];
    const operationPermissions = {
      'verificarEstado': 'consultar',
      'consultarArticulo': 'consultar', 
      'insertarArticulo': 'insertar',
      'listarCategorias': 'listar',
      'listarProveedores': 'listar',
      'actualizarStock': 'actualizar'
    };
    
    const requiredPermission = operationPermissions[operation] || 'consultar';
    if (!validarPermisos(requiredPermission)) {
      console.log(`\n\x1b[31mSin permisos para ejecutar '${operation}'\x1b[0m`);
      console.log(`\x1b[33mSu rol '${AUTH_CONFIG.role}' no permite operaciones de tipo '${requiredPermission}'\x1b[0m`);
      console.log('\nPresione Enter para continuar...');
      rl.question('', () => showMenu(client));
      return;
    }
    
    executeOperation(client, operation);
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
        
        // Caso 1: Nuevo formato CategoriaListResponse
        if (result?.return?.categorias?.categoria) {
          categorias = Array.isArray(result.return.categorias.categoria) 
            ? result.return.categorias.categoria 
            : [result.return.categorias.categoria];
        }
        // Caso 2: Formato alternativo con categoriaListResponse
        else if (result?.categoriaListResponse?.categorias?.categoria) {
          categorias = Array.isArray(result.categoriaListResponse.categorias.categoria) 
            ? result.categoriaListResponse.categorias.categoria 
            : [result.categoriaListResponse.categorias.categoria];
        }
        // Caso 3: Respuesta directa en result.return.datos (formato anterior)
        else if (result?.return?.datos) {
          categorias = Array.isArray(result.return.datos) 
            ? result.return.datos 
            : [result.return.datos];
        } 
        // Caso 4: Respuesta en result.return
        else if (result?.return) {
          categorias = Array.isArray(result.return) 
            ? result.return 
            : [result.return];
        }
        // Caso 5: Respuesta directa
        else if (Array.isArray(result)) {
          categorias = result;
        }
        
        escribirLog(`Categorías obtenidas: ${categorias.length}`, 'INFO');
        
        if (categorias.length === 0) {
          console.log('\x1b[33mℹ No se encontraron categorías.\x1b[0m');
        } else {
          console.log(`\x1b[32mSe encontraron ${categorias.length} categorías\x1b[0m`);
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
          
          // Caso 1: Nuevo formato ProveedorListResponse
          if (result?.return?.proveedores?.proveedor) {
            proveedores = Array.isArray(result.return.proveedores.proveedor) 
              ? result.return.proveedores.proveedor 
              : [result.return.proveedores.proveedor];
          }
          // Caso 2: Formato alternativo con proveedorListResponse
          else if (result?.proveedorListResponse?.proveedores?.proveedor) {
            proveedores = Array.isArray(result.proveedorListResponse.proveedores.proveedor) 
              ? result.proveedorListResponse.proveedores.proveedor 
              : [result.proveedorListResponse.proveedores.proveedor];
          }
          // Caso 3: Respuesta directa en result.return.datos (formato anterior)
          else if (result?.return?.datos) {
            proveedores = Array.isArray(result.return.datos) 
              ? result.return.datos 
              : [result.return.datos];
          } 
          // Caso 4: Respuesta en result.return
          else if (result?.return) {
            proveedores = Array.isArray(result.return) 
              ? result.return 
              : [result.return];
          }
          // Caso 5: Respuesta directa
          else if (Array.isArray(result)) {
            proveedores = result;
          }
          
          escribirLog(`Proveedores obtenidos: ${proveedores.length}`, 'INFO');
          
          if (proveedores.length === 0) {
            console.log('\x1b[33mℹ No se encontraron proveedores.\x1b[0m');
            escribirLog('No se encontraron proveedores', 'INFO');
          } else {
            console.log(`\x1b[32mSe encontraron ${proveedores.length} proveedores\x1b[0m`);
            
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
        console.log(`\x1b[33m${index + 1}\x1b[0m. ${name}`);
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

  const executeWithLoggingSync = (operationName, args, callback) => {
    logSoapRequest(client, operationName, args);
    
    // Configurar headers de autenticación para cada llamada
    const authHeader = 'Basic ' + Buffer.from(`${AUTH_CONFIG.username}:${AUTH_CONFIG.password}`).toString('base64');
    
    // Agregar headers de seguridad
    client.addHttpHeader('Authorization', authHeader);
    client.addHttpHeader('User-Agent', 'Node-SOAP-Client-Secured');
    
    log(`Ejecutando ${operationName} con usuario: ${AUTH_CONFIG.username} (${AUTH_CONFIG.role})`, 'info');
    
    client[operationName](args, (err, result) => {
      if (err) {
        // Verificar si es un error de autenticación/autorización
        if (err.response && (err.response.statusCode === 401 || err.response.statusCode === 403)) {
          console.log('\n\x1b[31mERROR DE AUTENTICACIÓN/AUTORIZACIÓN\x1b[0m');
          console.log(`Estado HTTP: ${err.response.statusCode}`);
          console.log(`Usuario actual: ${AUTH_CONFIG.username} (${AUTH_CONFIG.role})`);
          
          if (err.response.statusCode === 401) {
            console.log('\x1b[33mLas credenciales son inválidas o han expirado\x1b[0m');
          } else {
            console.log('\x1b[33mSu usuario no tiene permisos para esta operación\x1b[0m');
          }
          
          console.log('\nPresione Enter para cambiar de usuario...');
          rl.question('', async () => {
            await configurarAutenticacion();
            showMenu(client);
          });
          return;
        }
        
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
      executeWithLoggingSync('verificarEstado', {}, () => {
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
      
      const procesarConsultaArticulo = async (codigo) => {
        // Validar el código
        if (!codigo || codigo.trim() === '') {
          console.log('\n\x1b[33m⚠ Por favor ingrese un código de artículo.\x1b[0m\n');
          return false;
        }
        
        codigo = codigo.trim();
        log(`Consultando artículo con código: ${codigo}`, 'info');
        
        try {
          // Usar executeWithLogging para mejor manejo de errores
          const result = await executeWithLogging(client, 'consultarArticulo', { codigo });
          
          // Procesar la respuesta exitosa
          console.log('\n\x1b[32m✓ Consulta completada\x1b[0m\n');
          
          // Manejar diferentes formatos de respuesta
          let articulo = null;
          let exitoso = false;
          let mensaje = '';
          
          // Caso 1: Nueva estructura ConsultarArticuloResponse
          if (result && result.consultarArticuloResponse) {
            const response = result.consultarArticuloResponse;
            exitoso = response.exitoso === 'true' || response.exitoso === true;
            mensaje = response.mensaje || '';
            articulo = response.articulo;
          }
          // Caso 2: Respuesta parseada por parseXMLResponse
          else if (result && result.exitoso !== undefined) {
            exitoso = result.exitoso;
            mensaje = result.mensaje || '';
            articulo = result.datos;
          }
          // Caso 3: Respuesta directa del servicio
          else if (result && result.return) {
            articulo = result.return;
            exitoso = true;
          }
          // Caso 4: Respuesta directa como artículo
          else if (result && result.codigo) {
            articulo = result;
            exitoso = true;
          }
          
          if (exitoso && articulo) {
            console.log('\x1b[36m=== DETALLES DEL ARTÍCULO ===\x1b[0m');
            console.log(`  • Código: ${articulo.codigo || 'No disponible'}`);
            console.log(`  • Nombre: ${articulo.nombre || 'No disponible'}`);
            
            if (articulo.descripcion) {
              console.log(`  • Descripción: ${articulo.descripcion}`);
            }
            
            if (articulo.precioVenta || articulo.precio) {
              const precio = articulo.precioVenta || articulo.precio;
              console.log(`  • Precio: $${typeof precio === 'number' ? precio.toFixed(2) : precio}`);
            }
            
            if (articulo.stockActual !== undefined || articulo.stock !== undefined) {
              const stock = articulo.stockActual !== undefined ? articulo.stockActual : articulo.stock;
              console.log(`  • Stock actual: ${stock}`);
            }
            
            if (articulo.stockMinimo !== undefined) {
              console.log(`  • Stock mínimo: ${articulo.stockMinimo}`);
            }
            
            // Mostrar categoría si está disponible
            if (articulo.categoria) {
              console.log(`  • Categoría: ${articulo.categoria.nombre || articulo.categoria || 'No disponible'}`);
            }
            
            // Mostrar proveedor si está disponible
            if (articulo.proveedor) {
              console.log(`  • Proveedor: ${articulo.proveedor.nombre || articulo.proveedor.razonSocial || articulo.proveedor || 'No disponible'}`);
            }
            
            console.log('\n\x1b[32mOperación completada con éxito.\x1b[0m\n');
          } else {
            console.log(`\n\x1b[33m${mensaje || 'El artículo no fue encontrado o no hay información disponible.'}\x1b[0m\n`);
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
          console.log('\n\x1b[31m✖ Error al consultar el artículo:\x1b[0m');
          
          // Mostrar información detallada del error
          if (error.message) {
            console.log(`  Mensaje: ${error.message}`);
          }
          
          if (error.code) {
            console.log(`  Código: ${error.code}`);
          }
          
          if (error.response) {
            console.log(`  Estado HTTP: ${error.response.statusCode || 'Desconocido'}`);
            if (error.response.data) {
              console.log(`  Datos de respuesta: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
            }
          }
          
          // Mostrar sugerencias para el usuario
          console.log('\n\x1b[33mSugerencias:\x1b[0m');
          console.log('  1. Verifique que el código del artículo sea correcto');
          console.log('  2. Verifique su conexión a internet');
          console.log('  3. Asegúrese de que el servidor esté en ejecución');
          console.log('  4. Revise los logs para más detalles\n');
          
          // Registrar el error en el log
          escribirLog(`Error al consultar artículo ${codigo}: ${error.message}\n${error.stack}`, 'ERROR');
          
          // Preguntar si desea intentar de nuevo
          rl.question('¿Desea intentar con otro código? (s/n): ', (respuesta) => {
            if (respuesta.toLowerCase() === 's') {
              solicitarCodigo();
            } else {
              console.log('\nVolviendo al menú principal...\n');
              showMenu(client);
            }
          });
        }
        
        return true;
      };
      
      // Mostrar ayuda inicial
      mostrarAyuda();
      
      // Iniciar la interacción con el usuario
      const solicitarCodigo = () => {
        rl.question('\nIngrese código del artículo (o \'ayuda\' para ver ejemplos): ', async (codigo) => {
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
          
          // Procesar la consulta (ahora es async)
          const procesado = await procesarConsultaArticulo(codigo);
          if (!procesado) {
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
                      categoriaId: categoriaId,
                      proveedorId: proveedorId,
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
          
          // Enviar parámetros individuales en lugar de un objeto
          executeWithLoggingSync('insertarArticulo', {
            codigo: articulo.codigo,
            nombre: articulo.nombre, 
            descripcion: articulo.descripcion,
            categoriaId: articulo.categoriaId,
            proveedorId: articulo.proveedorId,
            precioCompra: articulo.precioCompra,
            precioVenta: articulo.precioVenta,
            stockActual: articulo.stockActual,
            stockMinimo: articulo.stockMinimo
          }, (result) => {
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
      executeWithLoggingSync('listarCategorias', {}, (result) => {
        handleResponse(null, result);
        showMenu(client);
      });
      break;
      
    case 'listarProveedores':
      log('Obteniendo lista de proveedores...', 'info');
      executeWithLoggingSync('listarProveedores', {}, (result) => {
        handleResponse(null, result);
        showMenu(client);
      });
      break;
      
    case 'actualizarStock':
      log('Actualizando stock de artículo...', 'info');
      
      // Función para mostrar el menú de ayuda
      const mostrarAyudaStock = () => {
        console.log('\n\x1b[36m=== AYUDA: ACTUALIZACIÓN DE STOCK ===\x1b[0m');
        console.log('  Esta operación permite actualizar el stock de un artículo existente.');
        console.log('  Necesitará:');
        console.log('  • Código del artículo (ej: MART001, HERR025, etc.)');
        console.log('  • Nuevo valor del stock (número entero no negativo)');
        console.log('\n  Escriba \'salir\' para volver al menú principal.\n');
      };
      
      const procesarActualizacionStock = (codigo, nuevoStock) => {
        // Validar el código
        if (!codigo || codigo.trim() === '') {
          console.log('\n\x1b[33m⚠ Por favor ingrese un código de artículo.\x1b[0m\n');
          return false;
        }
        
        // Validar el stock
        const stock = parseInt(nuevoStock, 10);
        if (isNaN(stock) || stock < 0) {
          console.log('\n\x1b[33mEl stock debe ser un número entero no negativo.\x1b[0m\n');
          return false;
        }
        
        codigo = codigo.trim().toUpperCase();
        log(`Actualizando stock del artículo ${codigo} a ${stock} unidades`, 'info');
        
        // Mostrar indicador de carga
        const spinner = ['|', '/', '-', '\\'];
        let spinnerIndex = 0;
        const loadingInterval = setInterval(() => {
          process.stdout.write(`\r${spinner[spinnerIndex++ % spinner.length]} Actualizando stock...`);
        }, 100);
        
        // Usar executeWithLogging para manejo consistente
        executeWithLoggingSync('actualizarStock', { codigo, nuevoStock: stock }, (result) => {
          // Limpiar el indicador de carga
          clearInterval(loadingInterval);
          process.stdout.write('\r' + ' '.repeat(30) + '\r');
          
          // Procesar la respuesta exitosa
          try {
            // Log para diagnóstico
            escribirLog(`Respuesta de actualizarStock: ${JSON.stringify(result, null, 2)}`, 'DEBUG');
            
            // Manejar el nuevo formato de respuesta StockUpdateResponse
            const response = result?.return || result?.stockUpdateResponse || result;
            
            if (response?.exitoso) {
              console.log('\n\x1b[32m✓ Stock actualizado exitosamente\x1b[0m\n');
              
              // Mostrar los detalles del artículo actualizado
              if (response.articulo) {
                const articulo = response.articulo;
                console.log('\x1b[36m=== ARTÍCULO ACTUALIZADO ===\x1b[0m');
                console.log(`  • Código: ${articulo.codigo || 'No disponible'}`);
                console.log(`  • Nombre: ${articulo.nombre || 'No disponible'}`);
                console.log(`  • Stock anterior: ${response.stockAnterior || 'No disponible'}`);
                console.log(`  • Stock actual: \x1b[32m${articulo.stockActual || response.stockNuevo || stock}\x1b[0m`);
                console.log(`  • Stock mínimo: ${articulo.stockMinimo || 'No definido'}`);
                
                // Mostrar información adicional si está disponible
                if (articulo.precioVenta) {
                  console.log(`  • Precio de venta: $${articulo.precioVenta}`);
                }
                
                if (articulo.categoriaNombre) {
                  console.log(`  • Categoría: ${articulo.categoriaNombre}`);
                }
                
                if (articulo.proveedorNombre) {
                  console.log(`  • Proveedor: ${articulo.proveedorNombre}`);
                }
                
                // Verificar si el stock está por debajo del mínimo
                const stockActual = articulo.stockActual || response.stockNuevo;
                if (articulo.stockMinimo && stockActual < articulo.stockMinimo) {
                  console.log('\n\x1b[33mADVERTENCIA: El stock actual está por debajo del stock mínimo.\x1b[0m');
                } else if (articulo.stockMinimo && stockActual <= articulo.stockMinimo * 1.2) {
                  console.log('\n\x1b[33mALERTA: El stock está cerca del nivel mínimo.\x1b[0m');
                }
                
                console.log(`\n  Mensaje: ${response.mensaje || 'Actualización completada'}`);
              } else {
                console.log(`\n  ${response.mensaje || 'Stock actualizado correctamente'}`);
                if (response.stockAnterior !== undefined && response.stockNuevo !== undefined) {
                  console.log(`  Stock cambió de ${response.stockAnterior} a ${response.stockNuevo} unidades`);
                }
              }
              
              console.log('\n\x1b[32mOperación completada con éxito.\x1b[0m\n');
            } else {
              // Error del servidor
              console.log('\n\x1b[31m✖ Error del servidor:\x1b[0m');
              console.log(`  ${response?.mensaje || 'Error desconocido'}`);
              
              if (response?.codigoError) {
                console.log(`  Código de error: ${response.codigoError}`);
              }
            }
            
            // Preguntar si desea actualizar otro artículo
            rl.question('¿Desea actualizar el stock de otro artículo? (s/n): ', (respuesta) => {
              if (respuesta.toLowerCase() === 's') {
                solicitarDatosStock();
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
            escribirLog(`Error al procesar respuesta de actualizarStock: ${error.message}\n${error.stack}`, 'ERROR');
            
            // Volver al menú principal
            showMenu(client);
          }
        });
        
        return true;
      };
      
      // Mostrar ayuda inicial
      mostrarAyudaStock();
      
      // Iniciar la interacción con el usuario
      const solicitarDatosStock = () => {
        rl.question('\nIngrese código del artículo (o \'ayuda\' para ver ejemplos): ', (codigo) => {
          // Mostrar ayuda si el usuario lo solicita
          if (codigo.toLowerCase() === 'ayuda') {
            mostrarAyudaStock();
            return solicitarDatosStock();
          }
          
          // Permitir salir
          if (codigo.toLowerCase() === 'salir') {
            console.log('\nVolviendo al menú principal...\n');
            showMenu(client);
            return;
          }
          
          // Validar código
          if (!codigo || codigo.trim() === '') {
            console.log('\n\x1b[33m⚠ Por favor ingrese un código de artículo válido.\x1b[0m');
            return solicitarDatosStock();
          }
          
          // Solicitar el nuevo stock
          rl.question('Ingrese el nuevo stock (número entero no negativo): ', (stockStr) => {
            // Procesar la actualización
            if (!procesarActualizacionStock(codigo, stockStr)) {
              // Si hubo un error de validación, volver a solicitar los datos
              return solicitarDatosStock();
            }
          });
        });
      };
      
      // Iniciar el proceso
      solicitarDatosStock();
      break;
      
    case 'cambiarContrasena':
      log('Iniciando cambio de contraseña...', 'info');
      
      // Función para mostrar ayuda del cambio de contraseña
      const mostrarAyudaCambioPassword = () => {
        console.log('\n\x1b[36m=== AYUDA: CAMBIO DE CONTRASEÑA ===\x1b[0m');
        console.log('  Esta operación permite cambiar la contraseña del usuario actual.');
        console.log('  \x1b[33mRequisitos de seguridad para la nueva contraseña:\x1b[0m');
        console.log('  • Mínimo 8 caracteres');
        console.log('  • Al menos 1 mayúscula');
        console.log('  • Al menos 1 minúscula');
        console.log('  • Al menos 1 número');
        console.log('  • Al menos 1 carácter especial (!@#$%^&*)');
        console.log('\n  \x1b[31mIMPORTANTE:\x1b[0m Necesitará su contraseña actual para confirmar el cambio.');
        console.log('\n  Escriba \'salir\' para volver al menú principal.\n');
      };
      
      const procesarCambioContrasena = async (currentPassword, newPassword, confirmPassword) => {
        // Validar que las contraseñas no estén vacías
        if (!currentPassword || !newPassword || !confirmPassword) {
          console.log('\n\x1b[31m⚠ Todos los campos son requeridos.\x1b[0m\n');
          return false;
        }
        
        // Validar que la nueva contraseña coincida con la confirmación
        if (newPassword !== confirmPassword) {
          console.log('\n\x1b[31m⚠ La nueva contraseña y la confirmación no coinciden.\x1b[0m\n');
          return false;
        }
        
        // Validar que la nueva contraseña sea diferente a la actual
        if (currentPassword === newPassword) {
          console.log('\n\x1b[31m⚠ La nueva contraseña debe ser diferente a la actual.\x1b[0m\n');
          return false;
        }
        
        // Validar fortaleza de la nueva contraseña
        const validarContrasena = (password) => {
          const minLength = 8;
          const hasUpper = /[A-Z]/.test(password);
          const hasLower = /[a-z]/.test(password);
          const hasNumber = /\d/.test(password);
          const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
          
          return password.length >= minLength && hasUpper && hasLower && hasNumber && hasSpecial;
        };          if (!validarContrasena(newPassword)) {
            console.log('\n\x1b[31mLa nueva contraseña no cumple con los criterios de seguridad.\x1b[0m');
            console.log('  Debe tener al menos:');
          console.log('  • 8 caracteres');
          console.log('  • 1 mayúscula');
          console.log('  • 1 minúscula');
          console.log('  • 1 número');
          console.log('  • 1 carácter especial (!@#$%^&*)\n');
          return false;
        }
        
        log(`Cambiando contraseña para usuario: ${AUTH_CONFIG.username}`, 'info');
        
        // Mostrar indicador de carga
        const spinner = ['|', '/', '-', '\\'];
        let spinnerIndex = 0;
        const loadingInterval = setInterval(() => {
          process.stdout.write(`\r${spinner[spinnerIndex++ % spinner.length]} Cambiando contraseña...`);
        }, 100);
        
        try {
          // Realizar el cambio de contraseña
          const result = await executeWithLogging(client, 'cambiarContrasena', {
            currentPassword: currentPassword,
            newPassword: newPassword
          });
          
          // Limpiar el indicador de carga
          clearInterval(loadingInterval);
          process.stdout.write('\r' + ' '.repeat(30) + '\r');
          
          // Procesar la respuesta
          if (result && result.exitoso) {
            console.log('\n\x1b[32m✓ Contraseña cambiada exitosamente\x1b[0m');
            console.log(`  ${result.mensaje || 'Su contraseña ha sido actualizada.'}`);
            
            // Actualizar la configuración local
            AUTH_CONFIG.password = newPassword;
            console.log('\n\x1b[33m💡 Su sesión ha sido actualizada con la nueva contraseña.\x1b[0m');
            
            log(`Contraseña cambiada exitosamente para usuario: ${AUTH_CONFIG.username}`, 'info');
            
          } else {
            console.log('\n\x1b[31m✖ Error al cambiar la contraseña:\x1b[0m');
            console.log(`  ${result?.mensaje || 'Error desconocido'}`);
            
            if (result?.codigoError) {
              console.log(`  Código de error: ${result.codigoError}`);
            }
          }
          
        } catch (error) {
          // Limpiar el indicador de carga
          clearInterval(loadingInterval);
          process.stdout.write('\r' + ' '.repeat(30) + '\r');
          
          console.log('\n\x1b[31m✖ Error al cambiar la contraseña:\x1b[0m');
          
          if (error.message) {
            console.log(`  Mensaje: ${error.message}`);
          }
          
          if (error.code) {
            console.log(`  Código: ${error.code}`);
          }
          
          // Mostrar sugerencias
          console.log('\n\x1b[33mPosibles causas:\x1b[0m');
          console.log('  1. La contraseña actual es incorrecta');
          console.log('  2. Problemas de conectividad con el servidor');
          console.log('  3. La nueva contraseña no cumple los criterios');
          
          log(`Error al cambiar contraseña para usuario ${AUTH_CONFIG.username}: ${error.message}`, 'error');
        }
        
        // Preguntar si desea volver al menú
        console.log('\nPresione Enter para volver al menú principal...');
        rl.question('', () => {
          showMenu(client);
        });
        
        return true;
      };
      
      // Mostrar ayuda inicial
      mostrarAyudaCambioPassword();
      
      // Función para solicitar las contraseñas
      const solicitarCambioContrasena = () => {
        console.log(`\x1b[36mCambiando contraseña para usuario: \x1b[33m${AUTH_CONFIG.username}\x1b[0m\n`);
        
        rl.question('Ingrese su contraseña actual: ', (currentPassword) => {
          // Verificar salida
          if (currentPassword.toLowerCase() === 'salir') {
            console.log('\nVolviendo al menú principal...\n');
            showMenu(client);
            return;
          }
          
          rl.question('Ingrese la nueva contraseña: ', (newPassword) => {
            if (newPassword.toLowerCase() === 'salir') {
              console.log('\nVolviendo al menú principal...\n');
              showMenu(client);
              return;
            }
            
            rl.question('Confirme la nueva contraseña: ', async (confirmPassword) => {
              if (confirmPassword.toLowerCase() === 'salir') {
                console.log('\nVolviendo al menú principal...\n');
                showMenu(client);
                return;
              }
              
              // Procesar el cambio de contraseña
              const procesado = await procesarCambioContrasena(currentPassword, newPassword, confirmPassword);
              if (!procesado) {
                // Si hubo un error de validación, volver a solicitar
                console.log('\n¿Desea intentar nuevamente? (s/n): ');
                rl.question('', (respuesta) => {
                  if (respuesta.toLowerCase() === 's') {
                    return solicitarCambioContrasena();
                  } else {
                    console.log('\nVolviendo al menú principal...\n');
                    showMenu(client);
                  }
                });
              }
            });
          });
        });
      };
      
      // Iniciar el proceso
      solicitarCambioContrasena();
      break;
      
    case 'obtenerCriteriosContrasena':
      log('Obteniendo criterios de contraseña segura...', 'info');
      executeWithLoggingSync('obtenerCriteriosContrasena', {}, (result) => {
        console.log('\n\x1b[36m=== CRITERIOS DE CONTRASEÑA SEGURA ===\x1b[0m');
        
        if (result && result.exitoso && result.datos) {
          console.log('\x1b[32m✓ Criterios obtenidos del servidor:\x1b[0m');
          console.log(`\n${result.datos}`);
        } else {
          console.log('\x1b[33m⚠ Usando criterios locales:\x1b[0m');
          console.log('\n  • Mínimo 8 caracteres');
          console.log('  • Al menos 1 mayúscula (A-Z)');
          console.log('  • Al menos 1 minúscula (a-z)');
          console.log('  • Al menos 1 número (0-9)');
          console.log('  • Al menos 1 carácter especial (!@#$%^&*)');
        }
        
        console.log('\n\x1b[33m💡 Ejemplos de contraseñas seguras:\x1b[0m');
        console.log('  • MiPassword123!');
        console.log('  • Segura#2024');
        console.log('  • Admin$Pass99');
        
        console.log('\nPresione Enter para volver al menú...');
        rl.question('', () => {
          showMenu(client);
        });
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
      console.log('\n\x1b[36m=== PRODUCTO ENCONTRADO ===\x1b[0m');
      console.log(`  Código: ${articulo.codigo || 'No disponible'}`);
      console.log(`  Nombre: ${articulo.nombre || 'No disponible'}`);
      console.log(`  Descripción: ${articulo.descripcion || 'Sin descripción'}`);
      console.log(`  Precio: $${articulo.precio?.toFixed(2) || '0.00'}`);
      console.log(`  Cantidad disponible: ${articulo.stock || 0} unidades`);
      console.log(`  Categoría: ${articulo.categoria?.nombre || 'No especificada'}`);
      console.log(`  Proveedor: ${articulo.proveedor?.nombre || 'No especificado'}`);
      
      // Registrar en el log
      log(`Artículo consultado: ${articulo.codigo} - ${articulo.nombre}`, 'info');
      log(`Detalles: ${JSON.stringify(articulo, null, 2)}`, 'debug');
    } else {
      console.log(`\n\x1b[33m${respuesta.mensaje || 'No se encontró el producto'}\x1b[0m`);
      log(respuesta.mensaje || 'No se encontró el producto', 'info');
    }
  } 
  // Manejar respuesta de listar proveedores
  else if (operation === 'listarProveedores') {
    if (respuesta.exitoso && respuesta.datos) {
      const proveedores = Array.isArray(respuesta.datos) ? respuesta.datos : [respuesta.datos];
      console.log(`\n\x1b[36m=== PROVEEDORES ENCONTRADOS (${proveedores.length}) ===\x1b[0m`);
      
      proveedores.forEach((prov, index) => {
        console.log(`\n\x1b[33mProveedor #${index + 1}\x1b[0m`);
        console.log(`  Empresa: ${prov.nombre || 'No disponible'}`);
        console.log(`  Persona de contacto: ${prov.contacto || 'No disponible'}`);
        console.log(`  Teléfono: ${prov.telefono || 'No disponible'}`);
        console.log(`  Email: ${prov.email || 'No disponible'}`);
        console.log(`  Dirección: ${prov.direccion || 'No disponible'}`);
      });
      
      // Registrar en el log
      log(`Se encontraron ${proveedores.length} proveedores`, 'info');
    } else {
      console.log(`\n\x1b[33m${respuesta.mensaje || 'No se encontraron proveedores'}\x1b[0m`);
      log(respuesta.mensaje || 'No se encontraron proveedores', 'info');
    }
  }
  // Manejar respuesta de actualizar stock
  else if (operation === 'actualizarStock') {
    if (respuesta.exitoso && respuesta.datos) {
      const articulo = respuesta.datos;
      console.log('\n\x1b[32mINVENTARIO ACTUALIZADO CORRECTAMENTE\x1b[0m');
      console.log('\n\x1b[36m=== INFORMACIÓN DEL PRODUCTO ===\x1b[0m');
      console.log(`  Código: ${articulo.codigo || 'No disponible'}`);
      console.log(`  Nombre: ${articulo.nombre || 'No disponible'}`);
      console.log(`  Cantidad actual: \x1b[32m${articulo.stockActual || 'No disponible'} unidades\x1b[0m`);
      console.log(`  Cantidad mínima requerida: ${articulo.stockMinimo || 'No definido'}`);
      
      // Verificar alertas de stock
      if (articulo.stockMinimo && articulo.stockActual < articulo.stockMinimo) {
        console.log('\n\x1b[33mALERTA: Cantidad por debajo del mínimo requerido\x1b[0m');
      } else if (articulo.stockMinimo && articulo.stockActual <= articulo.stockMinimo * 1.2) {
        console.log('\n\x1b[33mADVERTENCIA: Cantidad cerca del mínimo\x1b[0m');
      }
      
      // Registrar en el log
      log(`Stock actualizado para ${articulo.codigo}: ${articulo.stockActual} unidades`, 'info');
    } else {
      console.log(`\n\x1b[33m${respuesta.mensaje || 'El inventario no pudo ser actualizado'}\x1b[0m`);
      log(respuesta.mensaje || 'El inventario no pudo ser actualizado', 'warn');
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
    log('\n  Advertencias:', 'warn');
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
    log('\n Metadatos adicionales:', 'debug');
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
