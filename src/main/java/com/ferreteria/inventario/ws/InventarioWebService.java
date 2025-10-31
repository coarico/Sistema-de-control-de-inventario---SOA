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
import com.ferreteria.inventario.dto.CategoriaListResponse;
import com.ferreteria.inventario.dto.StockUpdateResponse;
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
        
        // Logging detallado de todos los parámetros
        logger.info("=== PARÁMETROS RECIBIDOS EN insertarArticulo ===");
        logger.info("codigo: '{}' (tipo: {})", codigo, codigo != null ? codigo.getClass().getSimpleName() : "null");
        logger.info("nombre: '{}' (tipo: {})", nombre, nombre != null ? nombre.getClass().getSimpleName() : "null");
        logger.info("descripcion: '{}' (tipo: {})", descripcion, descripcion != null ? descripcion.getClass().getSimpleName() : "null");
        logger.info("categoriaId: {} (tipo: {})", categoriaId, categoriaId != null ? categoriaId.getClass().getSimpleName() : "null");
        logger.info("proveedorId: {} (tipo: {})", proveedorId, proveedorId != null ? proveedorId.getClass().getSimpleName() : "null");
        logger.info("precioCompra: {} (tipo: {})", precioCompra, precioCompra != null ? precioCompra.getClass().getSimpleName() : "null");
        logger.info("precioVenta: {} (tipo: {})", precioVenta, precioVenta != null ? precioVenta.getClass().getSimpleName() : "null");
        logger.info("stockActual: {} (tipo: {})", stockActual, stockActual != null ? stockActual.getClass().getSimpleName() : "null");
        logger.info("stockMinimo: {} (tipo: {})", stockMinimo, stockMinimo != null ? stockMinimo.getClass().getSimpleName() : "null");
        logger.info("=== FIN PARÁMETROS ===");
        logger.debug("Parámetros recibidos: codigo={}, nombre={}, descripcion={}, categoriaId={}, proveedorId={}, precioCompra={}, precioVenta={}, stockActual={}, stockMinimo={}", 
                    codigo, nombre, descripcion, categoriaId, proveedorId, precioCompra, precioVenta, stockActual, stockMinimo);

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
@WebResult(name = "stockUpdateResponse", targetNamespace = "http://ws.inventario.ferreteria.com/")
@XmlMimeType("application/xml")
public StockUpdateResponse actualizarStock(
        @WebParam(name = "codigo") String codigo,
        @WebParam(name = "nuevoStock") Integer nuevoStock) {
    
    final String METHOD_NAME = "actualizarStock";
    logger.info("SOAP: Iniciando operación {} - Código: {}, Nuevo Stock: {}", METHOD_NAME, codigo, nuevoStock);
    
    try {
        // 1. Validaciones básicas
        if (codigo == null || codigo.trim().isEmpty()) {
            logger.warn("Código de artículo vacío o nulo");
            return new StockUpdateResponse(false, "El código del artículo es requerido");
        }
        
        if (nuevoStock == null || nuevoStock < 0) {
            logger.warn("Stock inválido: {}", nuevoStock);
            return new StockUpdateResponse(false, "El stock debe ser un número no negativo");
        }
        
        // 2. Normalizar código
        codigo = codigo.trim().toUpperCase();
        logger.debug("Código normalizado: {}", codigo);
        
        // 3. Buscar el artículo y obtener stock anterior
        logger.debug("Buscando artículo con código: {}", codigo);
        Articulo articulo = articuloService.consultarPorCodigo(codigo);
        Integer stockAnterior = articulo.getStockActual();
        
        logger.info("SOAP: Artículo encontrado - ID: {}, Stock actual: {}", articulo.getId(), stockAnterior);

        // 4. Actualizar el stock
        logger.debug("Actualizando stock del artículo ID: {} de {} a {}", articulo.getId(), stockAnterior, nuevoStock);
        articuloService.actualizarStock(articulo.getId(), nuevoStock);

        // 5. Consultar el artículo actualizado
        Articulo articuloActualizado = articuloService.consultarPorCodigo(codigo);
        
        // 6. Crear y validar la respuesta
        StockUpdateResponse response = new StockUpdateResponse(
            true, 
            "Stock actualizado exitosamente para el artículo " + codigo,
            articuloActualizado,
            stockAnterior,
            nuevoStock
        );
        
        logger.info("SOAP: {} completado exitosamente - {} de {} a {} unidades", 
                   METHOD_NAME, codigo, stockAnterior, nuevoStock);
        
        // 7. Log detallado (solo en modo debug)
        if (logger.isDebugEnabled()) {
            logger.debug("=== ACTUALIZACIÓN DE STOCK COMPLETADA ===");
            logger.debug("Artículo: {} - {}", articuloActualizado.getCodigo(), articuloActualizado.getNombre());
            logger.debug("Stock anterior: {}, Stock nuevo: {}", stockAnterior, nuevoStock);
            logger.debug("Stock mínimo: {}", articuloActualizado.getStockMinimo());
            
            if (articuloActualizado.getStockMinimo() != null && nuevoStock < articuloActualizado.getStockMinimo()) {
                logger.debug("⚠️ ALERTA: Stock por debajo del mínimo ({} < {})", 
                           nuevoStock, articuloActualizado.getStockMinimo());
            }
        }
        
        return response;
        
    } catch (ArticuloNotFoundException e) {
        String errorMsg = "Artículo no encontrado con código: " + codigo;
        logger.error("SOAP: {}", errorMsg);
        return new StockUpdateResponse(false, errorMsg);
        
    } catch (ValidationException e) {
        String errorMsg = "Error de validación: " + e.getMessage();
        logger.error("SOAP: {}", errorMsg);
        return new StockUpdateResponse(false, errorMsg);
        
    } catch (Exception e) {
        String errorMsg = "Error inesperado al actualizar stock: " + e.getMessage();
        logger.error("SOAP: Error en {}: {}", METHOD_NAME, errorMsg, e);
        return new StockUpdateResponse(false, errorMsg);
    }
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
@WebResult(name = "categoriaListResponse", targetNamespace = "http://ws.inventario.ferreteria.com/")
@XmlMimeType("application/xml")
public CategoriaListResponse listarCategorias() {
    final String METHOD_NAME = "listarCategorias";
    logger.info("SOAP: Iniciando operación {}", METHOD_NAME);
    
    try {
        // 1. Obtener lista de categorías
        logger.debug("Obteniendo lista de categorías desde la base de datos...");
        List<Categoria> categorias = categoriaDAO.listarTodas();
        
        // 2. Validar y preparar la respuesta
        if (categorias == null) {
            logger.warn("La lista de categorías retornó null");
            categorias = Collections.emptyList();
        }
        
        logger.info("SOAP: Se encontraron {} categorías", categorias.size());
        
        // 3. Log detallado (solo en modo debug)
        logCategorias(categorias);
        
        // 4. Crear y validar la respuesta
        CategoriaListResponse response = new CategoriaListResponse(categorias);
        if (response.getCategorias() == null) {
            logger.warn("La respuesta no puede contener una lista de categorías nula");
            response.setCategorias(Collections.emptyList());
        }
        
        logger.debug("SOAP: {} - Respuesta preparada con {} categorías", 
                   METHOD_NAME, 
                   response.getCategorias().size());
        
        return response;
        
    } catch (Exception e) {
        // 5. Manejo de errores
        logger.error("Error en {}: {}", METHOD_NAME, e.getMessage(), e);
        return new CategoriaListResponse(Collections.emptyList());
    }
}

/**
 * Registra información detallada de las categorías en el log (solo en modo debug)
 */
private void logCategorias(List<Categoria> categorias) {
    if (logger.isDebugEnabled() && categorias != null && !categorias.isEmpty()) {
        logger.debug("=== DETALLE DE CATEGORÍAS ENCONTRADAS ===");
        for (int i = 0; i < Math.min(categorias.size(), 5); i++) {
            Categoria c = categorias.get(i);
            logger.debug("Categoria[{}] - ID: {}, Nombre: {}", i, c.getId(), c.getNombre());
        }
        if (categorias.size() > 5) {
            logger.debug("... y {} más", categorias.size() - 5);
        }
    }
}

}
