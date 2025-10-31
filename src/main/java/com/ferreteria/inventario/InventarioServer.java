package com.ferreteria.inventario;

import com.ferreteria.inventario.config.DatabaseConfig;
import com.ferreteria.inventario.ws.InventarioWebService;
import jakarta.xml.ws.Endpoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Servidor principal del sistema de inventario
 * Inicia el servicio SOAP y verifica la conexión a la base de datos
 */
public class InventarioServer {
    
    private static final Logger logger = LoggerFactory.getLogger(InventarioServer.class);
    private static final String SOAP_URL = "http://localhost:8080/InventarioService";
    
    public static void main(String[] args) {
        logger.info("=== SISTEMA DE INVENTARIO FERRETERÍA ===");
        logger.info("Iniciando servidor backend...");
        
        try {
            // Verificar conexión a base de datos
            if (!verificarBaseDatos()) {
                logger.error("No se puede iniciar sin conexión a la base de datos");
                logger.error("Verifique la configuración en database.properties");
                System.exit(1);
            }
            
            // Iniciar servicio SOAP
            iniciarServicioSOAP();
            
            // Mensaje de éxito
            mostrarInformacionServidor();
            
            // Mantener el servidor ejecutándose
            mantenerServidorActivo();
            
        } catch (Exception e) {
            logger.error("Error al iniciar el servidor", e);
            System.exit(1);
        }
    }
    
    private static boolean verificarBaseDatos() {
        try {
            logger.info("Verificando conexión a base de datos...");
            DatabaseConfig dbConfig = DatabaseConfig.getInstance();
            boolean conexionOK = dbConfig.testConnection();
            
            if (conexionOK) {
                logger.info("Conexión a base de datos establecida correctamente");
                return true;
            } else {
                logger.error("Error de conexión a base de datos");
                return false;
            }
        } catch (Exception e) {
            logger.error("Error al verificar base de datos", e);
            return false;
        }
    }
    
    private static void iniciarServicioSOAP() {
        try {
            logger.info("Iniciando servicio SOAP...");
            
            // Crear instancia del servicio
            InventarioWebService servicioSOAP = new InventarioWebService();
            
            // Publicar el endpoint SOAP
            Endpoint endpoint = Endpoint.publish(SOAP_URL, servicioSOAP);
            
            if (endpoint.isPublished()) {
                logger.info("Servicio SOAP publicado exitosamente");
                logger.info("Endpoint: {}", SOAP_URL);
                logger.info("WSDL: {}?wsdl", SOAP_URL);
            } else {
                throw new RuntimeException("No se pudo publicar el servicio SOAP");
            }
            
        } catch (Exception e) {
            logger.error("Error al iniciar servicio SOAP", e);
            throw new RuntimeException("Fallo al iniciar servicio SOAP", e);
        }
    }
    
    private static void mostrarInformacionServidor() {
        logger.info("");
        logger.info("===== SERVIDOR INICIADO EXITOSAMENTE =====");
        logger.info("Servidor ejecutándose en: http://localhost:8080");
        logger.info("Servicio SOAP: {}", SOAP_URL);
        logger.info("WSDL disponible en: {}?wsdl", SOAP_URL);
        logger.info("");
        logger.info("Operaciones SOAP disponibles:");
        logger.info("  • insertarArticulo    - Insertar nuevo artículo");
        logger.info("  • consultarArticulo   - Consultar artículo por código");
        logger.info("  • actualizarStock     - Actualizar stock de artículo");
        logger.info("  • verificarEstado     - Verificar estado del servicio");
        logger.info("");
        logger.info("Herramientas de prueba recomendadas:");
        logger.info("  • SoapUI - Para pruebas profesionales SOAP");
        logger.info("  • Postman - Cliente REST/SOAP");
        logger.info("  • Navegador web - Para ver el WSDL");
        logger.info("");
        logger.info("Para detener el servidor: Presiona Ctrl+C o detén desde NetBeans");
        logger.info("===============================================");
        logger.info("");
    }
    
    private static void mantenerServidorActivo() {
        // Agregar shutdown hook para limpieza
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            logger.info("");
            logger.info("Deteniendo servidor...");
            logger.info("Servidor detenido correctamente");
            logger.info("¡Hasta luego!");
        }));
        
        try {
            logger.info("Servidor en ejecución... (presiona Ctrl+C para detener)");
            
            // Mantener el hilo principal vivo
            Thread.currentThread().join();
            
        } catch (InterruptedException e) {
            logger.info("Servidor interrumpido por el usuario");
            Thread.currentThread().interrupt();
        }
    }
}
