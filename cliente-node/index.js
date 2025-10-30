#!/usr/bin/env node
const soap = require('soap');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const WSDL_URL = 'http://localhost:8080/InventarioService?wsdl';

async function main() {
  console.log('Conectando al servicio SOAP...');
  
  soap.createClient(WSDL_URL, {
    wsdl_headers: { 
      'User-Agent': 'Node-SOAP-Client',
      'Connection': 'keep-alive'
    },
    escapeXML: false
  }, function(err, client) {
    if (err) {
      console.error('\x1b[31mError conectando al servicio:\x1b[0m');
      console.error('- Verifica que el servidor esté corriendo en:', WSDL_URL);
      console.error('- Mensaje técnico:', err.message);
      process.exit(1);
    }

    showMenu(client);
  });
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

  console.log('\x1b[33m0\x1b[0m. Salir');
  
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
      if (err || !result?.categorias) {
        console.log('\x1b[33mNo se pudieron obtener categorías\x1b[0m');
        resolve([]);
      } else {
        resolve(result.categorias);
      }
    });
  });
}

async function getProveedores(client) {
  return new Promise((resolve) => {
    client.listarProveedores({}, (err, result) => {
      if (err || !result?.proveedores) {
        console.log('\x1b[33mNo se pudieron obtener proveedores\x1b[0m');
        resolve([]);
      } else {
        resolve(result.proveedores);
      }
    });
  });
}

async function selectFromList(items, prompt) {
  console.log('\n\x1b[36m=== ' + prompt.toUpperCase() + ' ===\x1b[0m');
  items.forEach((item, index) => {
    console.log(`\x1b[33m${index + 1}\x1b[0m. ${item.nombre || item.razonSocial} (ID: ${item.id})`);
  });
  console.log('\x1b[33m0\x1b[0m. Ninguno');
  
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

function executeOperation(client, operation) {
  console.log(`\nEjecutando: \x1b[32m${operation}\x1b[0m`);
  
  switch(operation) {
    case 'verificarEstado':
      client.verificarEstado({}, (err, result) => {
        handleResponse(err, result);
        showMenu(client); // Regresa al menú
      });
      break;
      
    case 'consultarArticulo':
      rl.question('Ingrese código del artículo: ', (codigo) => {
        client.consultarArticulo({ codigo }, (err, result) => {
          handleResponse(err, result);
          showMenu(client); // Regresa al menú
        });
      });
      break;
      
    case 'actualizarStock':
      rl.question('Ingrese código del artículo: ', (codigo) => {
        rl.question('Ingrese nuevo stock: ', (nuevoStock) => {
          client.actualizarStock({ codigo, nuevoStock: parseInt(nuevoStock, 10) }, (err, result) => {
            handleResponse(err, result);
            showMenu(client); // Regresa al menú
          });
        });
      });
      break;
      
    case 'insertarArticulo':
      rl.question('Código del artículo: ', async (codigo) => {
        rl.question('Nombre: ', async (nombre) => {
          const categorias = await getCategorias(client);
          const categoriaId = await selectFromList(categorias, 'categoría');
          
          const proveedores = await getProveedores(client);
          const proveedorId = await selectFromList(proveedores, 'proveedor');
          
          const payload = { 
            codigo,
            nombre,
            descripcion: "Artículo creado desde cliente",
            categoriaId,
            proveedorId,
            precioCompra: 10.0,
            precioVenta: 15.0,
            stockActual: 5,
            stockMinimo: 1
          };
          
          client.insertarArticulo(payload, (err, result) => {
            if (err || (result && result.respuesta && !result.respuesta.exitoso)) {
              console.log('\x1b[31mError al insertar:\x1b[0m', result?.respuesta?.mensaje || err.message);
              rl.question('\n¿Intentar nuevamente? (s/n): ', (reintentar) => {
                if (reintentar.toLowerCase() === 's') executeOperation(client, 'insertarArticulo');
                else showMenu(client);
              });
            } else {
              handleResponse(err, result);
              showMenu(client);
            }
          });
        });
      });
      break;
      
    default:
      console.log('\x1b[31mOperación no implementada en el cliente\x1b[0m');
      showMenu(client); // Regresa al menú
  }
}

function handleResponse(err, result) {
  if (err) {
    console.error('\x1b[31mError:\x1b[0m', err.message);
    return;
  }
  console.log('\x1b[32mResultado:\x1b[0m', JSON.stringify(result, null, 2));
}

main();
