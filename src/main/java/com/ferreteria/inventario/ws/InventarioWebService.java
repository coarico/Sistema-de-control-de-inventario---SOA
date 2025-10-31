package com.ferreteria.inventario.ws;

import com.ferreteria.inventario.dto.ArticuloDTO;
import com.ferreteria.inventario.dto.RespuestaOperacion;
import com.ferreteria.inventario.exception.ArticuloNotFoundException;
import com.ferreteria.inventario.exception.InventarioException;
import com.ferreteria.inventario.exception.ValidationException;
import com.ferreteria.inventario.model.Articulo;
import com.ferreteria.inventario.service.ArticuloService;
import com.ferreteria.inventario.dao.CategoriaDAO;
import com.ferreteria.inventario.dao.ProveedorDAO;
import com.ferreteria.inventario.model.Categoria;
import com.ferreteria.inventario.model.Proveedor;
import com.ferreteria.inventario.dto.ProveedorListResponse;
import com.ferreteria.inventario.util.ArticuloMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.jws.WebMethod;
import jakarta.jws.WebParam;
import jakarta.jws.soap.SOAPBinding;
import jakarta.jws.soap.SOAPBinding.Style;
import jakarta.jws.soap.SOAPBinding.Use;
import jakarta.jws.WebResult;
import jakarta.jws.WebService;
import jakarta.xml.ws.BindingType;
import jakarta.xml.ws.soap.MTOM;
import jakarta.xml.ws.soap.SOAPFaultException;
import jakarta.activation.MimeType;
import jakarta.xml.bind.annotation.XmlMimeType;
import java.util.Collections;
import java.util.List;

/**
 * Servicio Web SOAP para la gestión de inventario de ferretería
 * Expone operaciones para insertar y consultar artículos
 * 
 * Cumple con estándares WSDL 1.1 y XML Schema
 */
@WebService(
    name = "InventarioWebService",
    serviceName = "InventarioService",
    portName = "InventarioPort",
    targetNamespace = "http://ws.inventario.ferreteria.com/"
)
@SOAPBinding(
    style = SOAPBinding.Style.DOCUMENT,
    use = SOAPBinding.Use.LITERAL,
    parameterStyle = SOAPBinding.ParameterStyle.WRAPPED
)
public class InventarioWebService {
    
    private static final Logger logger = LoggerFactory.getLogger(InventarioWebService.class);
    private final ArticuloService articuloService;
    private final CategoriaDAO categoriaDAO;
    private final ProveedorDAO proveedorDAO;

    public InventarioWebService() {
        this.articuloService = new ArticuloService();
        this.categoriaDAO = new CategoriaDAO();
        this.proveedorDAO = new ProveedorDAO();
        logger.info("Servicio Web SOAP de Inventario inicializado");
    }

    /**
     * Inserta un nuevo artículo en el inventario
     * 
     * @param codigo Código único del artículo (requerido)
     * @param nombre Nombre del artículo (requerido)
     * @param descripcion Descripción del artículo (opcional)
     * @param categoriaId ID de la categoría (opcional)
     * @param proveedorId ID del proveedor (opcional)
     * @param precioCompra Precio de compra (requerido, debe ser positivo)
     * @param precioVenta Precio de venta (requerido, debe ser mayor al precio de compra)
     * @param stockActual Stock inicial (requerido, debe ser no negativo)
     * @param stockMinimo Stock mínimo para alertas (requerido, debe ser no negativo)
     * @return RespuestaOperacion con el resultado de la operación
     */
    @WebMethod(operationName = "insertarArticulo")
    @WebResult(name = "respuesta")
    public RespuestaOperacion insertarArticulo(
            @WebParam(name = "codigo") String codigo,
            @WebParam(name = "nombre") String nombre,
            @WebParam(name = "descripcion") String descripcion,
            @WebParam(name = "categoriaId") Integer categoriaId,
            @WebParam(name = "proveedorId") Integer proveedorId,
            @WebParam(name = "precioCompra") Double precioCompra,
            @WebParam(name = "precioVenta") Double precioVenta,
            @WebParam(name = "stockActual") Integer stockActual,
            @WebParam(name = "stockMinimo") Integer stockMinimo) {

        logger.info("SOAP: Solicitud de inserción de artículo - Código: {}", codigo);

        try {
            // Crear el objeto Articulo desde los parámetros
            Articulo articulo = new Articulo();
            articulo.setCodigo(codigo);
            articulo.setNombre(nombre);
            articulo.setDescripcion(descripcion);
            articulo.setCategoriaId(categoriaId);
            articulo.setProveedorId(proveedorId);
            
            if (precioCompra != null) {
                articulo.setPrecioCompra(java.math.BigDecimal.valueOf(precioCompra));
            }
            if (precioVenta != null) {
                articulo.setPrecioVenta(java.math.BigDecimal.valueOf(precioVenta));
            }
            
            articulo.setStockActual(stockActual);
            articulo.setStockMinimo(stockMinimo);

            // Registrar el artículo usando el servicio de negocio
            Articulo articuloCreado = articuloService.registrarArticulo(articulo);

            // Convertir a DTO y crear respuesta exitosa
            ArticuloDTO articuloDTO = ArticuloMapper.toDTO(articuloCreado);
            
            logger.info("SOAP: Artículo insertado exitosamente - ID: {}, Código: {}", 
                       articuloCreado.getId(), articuloCreado.getCodigo());

            return RespuestaOperacion.exito(
                "Artículo insertado exitosamente con ID: " + articuloCreado.getId(), 
                articuloDTO
            );

        } catch (ValidationException e) {
            logger.warn("SOAP: Error de validación al insertar artículo: {}", e.getMessage());
            return RespuestaOperacion.error(e.getMessage(), e.getCodigo(), e.getTipoError());

        } catch (InventarioException e) {
            logger.error("SOAP: Error de negocio al insertar artículo: {}", e.getMessage());
            return RespuestaOperacion.error(e.getMessage(), e.getCodigo(), e.getTipoError());

        } catch (Exception e) {
            logger.error("SOAP: Error inesperado al insertar artículo", e);
            return RespuestaOperacion.error(
                "Error interno del servidor: " + e.getMessage(), 
                "INTERNAL_ERROR", 
                "SISTEMA"
            );
        }
    }

    /**
     * Consulta un artículo por su código
     * 
     * @param codigo Código del artículo a consultar (requerido)
     * @return RespuestaOperacion con el artículo encontrado o mensaje de error
     */
    @WebMethod(operationName = "consultarArticulo")
    @WebResult(name = "respuesta")
    public RespuestaOperacion consultarArticulo(
            @WebParam(name = "codigo") String codigo) {

        logger.info("SOAP: Solicitud de consulta de artículo - Código: {}", codigo);

        try {
            // Consultar el artículo usando el servicio de negocio
            Articulo articulo = articuloService.consultarPorCodigo(codigo);

            // Convertir a DTO y crear respuesta exitosa
            ArticuloDTO articuloDTO = ArticuloMapper.toDTO(articulo);
            
            logger.info("SOAP: Artículo consultado exitosamente - Código: {}, Nombre: {}", 
                       articulo.getCodigo(), articulo.getNombre());

            return RespuestaOperacion.exito(
                "Artículo encontrado: " + articulo.getNombre(), 
                articuloDTO
            );

        } catch (ArticuloNotFoundException e) {
            logger.info("SOAP: Artículo no encontrado - Código: {}", codigo);
            return RespuestaOperacion.error(e.getMessage(), e.getCodigo(), e.getTipoError());

        } catch (ValidationException e) {
            logger.warn("SOAP: Error de validación al consultar artículo: {}", e.getMessage());
            return RespuestaOperacion.error(e.getMessage(), e.getCodigo(), e.getTipoError());

        } catch (InventarioException e) {
            logger.error("SOAP: Error de negocio al consultar artículo: {}", e.getMessage());
            return RespuestaOperacion.error(e.getMessage(), e.getCodigo(), e.getTipoError());

        } catch (Exception e) {
            logger.error("SOAP: Error inesperado al consultar artículo", e);
            return RespuestaOperacion.error(
                "Error interno del servidor: " + e.getMessage(), 
                "INTERNAL_ERROR", 
                "SISTEMA"
            );
        }
    }


    /**
     * Obtiene la lista de todos los proveedores disponibles
     * @return Lista de proveedores o lista vacía en caso de error
     */
    @WebMethod(operationName = "listarProveedores")
    @WebResult(name = "proveedorListResponse", targetNamespace = "http://ws.inventario.ferreteria.com/")
    @XmlMimeType("application/xml")
    public ProveedorListResponse listarProveedores() {
        final String METHOD_NAME = "listarProveedores";
        logger.info("SOAP: Iniciando operación {}", METHOD_NAME);
        
        try {
            // 1. Obtener lista de proveedores
            logger.debug("Obteniendo lista de proveedores desde la base de datos...");
            List<Proveedor> proveedores = proveedorDAO.listarTodos();
            
            // 2. Validar y preparar la respuesta
            if (proveedores == null) {
                logger.warn("La lista de proveedores retornó null");
                proveedores = Collections.emptyList();
            }
            
            logger.info("SOAP: Se encontraron {} proveedores", proveedores.size());
            
            // 3. Log detallado (solo en modo debug)
            logProveedores(proveedores);
            
            // 4. Crear y validar la respuesta
            ProveedorListResponse response = new ProveedorListResponse(proveedores);
            if (response.getProveedores() == null) {
                logger.warn("La respuesta no puede contener una lista de proveedores nula");
                response.setProveedores(Collections.emptyList());
            }
            
            logger.debug("SOAP: {} - Respuesta preparada con {} proveedores", 
                       METHOD_NAME, 
                       response.getProveedores().size());
            
            return response;
            
        } catch (Exception e) {
            // 5. Manejo de errores
            logger.error("Error en {}: {}", METHOD_NAME, e.getMessage(), e);
            return new ProveedorListResponse(Collections.emptyList());
        }
    }
    
    /**
     * Registra información detallada de los proveedores en el log (solo en modo debug)
     */
    private void logProveedores(List<Proveedor> proveedores) {
        if (logger.isDebugEnabled() && proveedores != null && !proveedores.isEmpty()) {
            logger.debug("=== DETALLE DE PROVEEDORES ENCONTRADOS ===");
            for (int i = 0; i < Math.min(proveedores.size(), 5); i++) {
                Proveedor p = proveedores.get(i);
                logger.debug("Proveedor[{}] - ID: {}, Nombre: {}", i, p.getId(), p.getNombre());
            }
            if (proveedores.size() > 5) {
                logger.debug("... y {} más", proveedores.size() - 5);
            }
        }
    }
    
    /**
     * Método obsoleto - Se mantiene para compatibilidad
     * @deprecated Este método ya no se utiliza. Los errores ahora se manejan directamente en el método listarProveedores.
     */
    @Deprecated
    private RespuestaOperacion<ProveedorListResponse> manejarErrorProveedores(
            Exception e, String methodName) {
        logger.warn("Se ha llamado al método manejarErrorProveedores que está obsoleto");
        return RespuestaOperacion.error(
            "Error interno del servidor: " + e.getMessage(),
            "INTERNAL_ERROR",
            "SISTEMA"
        );
    }

    /**
 * 
 * @param codigo Código del artículo (requerido)
 * @param nuevoStock Nuevo valor de stock (requerido, debe ser no negativo)
 * @return RespuestaOperacion con el resultado de la operación
 */
@WebMethod(operationName = "actualizarStock")
@WebResult(name = "respuesta")
public RespuestaOperacion actualizarStock(
        @WebParam(name = "codigo") String codigo,
        @WebParam(name = "nuevoStock") Integer nuevoStock) {
    
    logger.info("Solicitud de actualización de stock - Código: {}, Nuevo Stock: {}", codigo, nuevoStock);
    RespuestaOperacion respuesta = new RespuestaOperacion();
    
    try {
        // Validaciones básicas
        if (codigo == null || codigo.trim().isEmpty()) {
            throw new ValidationException("El código del artículo es requerido");
        }
        
        if (nuevoStock == null || nuevoStock < 0) {
            throw new ValidationException("El stock debe ser un número no negativo");
        }
        
        // Normalizar código
        codigo = codigo.trim().toUpperCase();
        
        // Buscar el artículo
        logger.debug("Buscando artículo con código: {}", codigo);
        Articulo articulo = articuloService.consultarPorCodigo(codigo);

        // Actualizar el stock
        logger.debug("Actualizando stock del artículo ID: {} a {}", articulo.getId(), nuevoStock);
        articuloService.actualizarStock(articulo.getId(), nuevoStock);

        // Consultar el artículo actualizado
        Articulo articuloActualizado = articuloService.consultarPorCodigo(codigo);
        
        // Configurar respuesta exitosa
        respuesta = RespuestaOperacion.exito("Stock actualizado exitosamente", articuloActualizado);
        
        logger.info("Stock actualizado exitosamente para el artículo: {}", codigo);
        
    } catch (ArticuloNotFoundException e) {
        String errorMsg = "Artículo no encontrado: " + codigo;
        logger.error("SOAP: {}", errorMsg);
        
        respuesta = RespuestaOperacion.error(errorMsg, "ARTICULO_NO_ENCONTRADO", "NEGOCIO");
    } catch (Exception e) {
        String errorMsg = "Error inesperado: " + e.getMessage();
        logger.error("SOAP: {}", errorMsg, e);
        
        respuesta = RespuestaOperacion.error(errorMsg, "ERROR_INTERNO", "SISTEMA");
    }
    
    return respuesta;
}

/**
 * Verifica el estado del servicio web
 * 
 * @return RespuestaOperacion indicando si el servicio está operativo
 */
@WebMethod(operationName = "verificarEstado")
@WebResult(name = "respuesta")
public RespuestaOperacion verificarEstado() {
    logger.debug("SOAP: Verificación de estado del servicio");
    
    try {
        // Verificar conectividad con la base de datos
        com.ferreteria.inventario.config.DatabaseConfig dbConfig = 
            com.ferreteria.inventario.config.DatabaseConfig.getInstance();
        
        if (dbConfig.testConnection()) {
            return RespuestaOperacion.exito("Servicio operativo - Base de datos conectada");
        } else {
            return RespuestaOperacion.error(
                "Servicio con problemas - Error de conectividad con base de datos", 
                "DB_CONNECTION_ERROR", 
                "INFRAESTRUCTURA"
            );
        }
    } catch (Exception e) {
        logger.error("SOAP: Error al verificar estado del servicio", e);
        return RespuestaOperacion.error(
            "Error al verificar estado del servicio: " + e.getMessage(), 
            "SERVICE_CHECK_ERROR", 
            "SISTEMA"
        );
    }
}

/**
 * Obtiene la lista de todas las categorías disponibles
 * @return Lista de categorías
 */
/**
 * Obtiene la lista de todas las categorías disponibles
 * @return RespuestaOperacion con la lista de categorías o mensaje de error
 */
@WebMethod(operationName = "listarCategorias")
@WebResult(name = "respuesta")
public RespuestaOperacion listarCategorias() {
    logger.info("SOAP: Solicitando lista de categorías");
    
    RespuestaOperacion respuesta = new RespuestaOperacion();
    
    try {
        List<Categoria> categorias = categoriaDAO.listarTodas();
        logger.info("SOAP: Se encontraron {} categorías", categorias.size());
        
        // Configurar la respuesta manualmente
        respuesta.setExitoso(true);
        respuesta.setMensaje("Categorías obtenidas exitosamente");
        respuesta.setDatos(categorias);
        
    } catch (Exception e) {
        String errorMsg = "Error al obtener la lista de categorías: " + e.getMessage();
        logger.error("SOAP: {}", errorMsg, e);
        
        respuesta.setExitoso(false);
        respuesta.setMensaje(errorMsg);
        respuesta.setCodigoError("CATEGORIAS_ERROR");
        respuesta.setTipoError("NEGOCIO");
    }
    
    return respuesta;
}

}
