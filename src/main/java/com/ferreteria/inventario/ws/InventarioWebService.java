package com.ferreteria.inventario.ws;

import com.ferreteria.inventario.dto.ArticuloDTO;
import com.ferreteria.inventario.dto.RespuestaOperacion;
import com.ferreteria.inventario.exception.ArticuloNotFoundException;
import com.ferreteria.inventario.exception.InventarioException;
import com.ferreteria.inventario.exception.ValidationException;
import com.ferreteria.inventario.model.Articulo;
import com.ferreteria.inventario.service.ArticuloService;
import com.ferreteria.inventario.util.ArticuloMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.jws.WebMethod;
import jakarta.jws.WebParam;
import jakarta.jws.WebResult;
import jakarta.jws.WebService;
import jakarta.jws.soap.SOAPBinding;

/**
 * Servicio Web SOAP para la gestión de inventario de ferretería
 * Expone operaciones para insertar y consultar artículos
 * 
 * Cumple con estándares WSDL 1.1 y XML Schema
 */
@WebService(
    name = "InventarioWebService",
    serviceName = "InventarioService",
    targetNamespace = "http://ws.inventario.ferreteria.com/",
    portName = "InventarioPort"
)
@SOAPBinding(style = SOAPBinding.Style.DOCUMENT, use = SOAPBinding.Use.LITERAL)
public class InventarioWebService {
    
    private static final Logger logger = LoggerFactory.getLogger(InventarioWebService.class);
    private final ArticuloService articuloService;

    public InventarioWebService() {
        this.articuloService = new ArticuloService();
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
     * Actualiza el stock de un artículo existente
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

        logger.info("SOAP: Solicitud de actualización de stock - Código: {}, Nuevo Stock: {}", 
                   codigo, nuevoStock);

        try {
            // Primero consultar el artículo para obtener su ID
            Articulo articulo = articuloService.consultarPorCodigo(codigo);

            // Actualizar el stock
            articuloService.actualizarStock(articulo.getId(), nuevoStock);

            // Consultar el artículo actualizado
            Articulo articuloActualizado = articuloService.consultarPorId(articulo.getId());
            ArticuloDTO articuloDTO = ArticuloMapper.toDTO(articuloActualizado);

            logger.info("SOAP: Stock actualizado exitosamente - Código: {}, Nuevo Stock: {}", 
                       codigo, nuevoStock);

            String mensaje = "Stock actualizado exitosamente. Nuevo stock: " + nuevoStock;
            if (articuloActualizado.tieneStockBajo()) {
                mensaje += " (ALERTA: Stock bajo)";
            }

            return RespuestaOperacion.exito(mensaje, articuloDTO);

        } catch (ArticuloNotFoundException e) {
            logger.info("SOAP: Artículo no encontrado para actualizar stock - Código: {}", codigo);
            return RespuestaOperacion.error(e.getMessage(), e.getCodigo(), e.getTipoError());

        } catch (ValidationException e) {
            logger.warn("SOAP: Error de validación al actualizar stock: {}", e.getMessage());
            return RespuestaOperacion.error(e.getMessage(), e.getCodigo(), e.getTipoError());

        } catch (InventarioException e) {
            logger.error("SOAP: Error de negocio al actualizar stock: {}", e.getMessage());
            return RespuestaOperacion.error(e.getMessage(), e.getCodigo(), e.getTipoError());

        } catch (Exception e) {
            logger.error("SOAP: Error inesperado al actualizar stock", e);
            return RespuestaOperacion.error(
                "Error interno del servidor: " + e.getMessage(), 
                "INTERNAL_ERROR", 
                "SISTEMA"
            );
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
}
