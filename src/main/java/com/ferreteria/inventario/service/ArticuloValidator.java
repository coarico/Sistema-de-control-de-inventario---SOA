package com.ferreteria.inventario.service;

import com.ferreteria.inventario.model.Articulo;
import com.ferreteria.inventario.exception.ValidationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Validador para la entidad Articulo
 * Implementa todas las reglas de validación de negocio
 */
public class ArticuloValidator {
    private static final Logger logger = LoggerFactory.getLogger(ArticuloValidator.class);
    
    // Patrones de validación
    private static final Pattern CODIGO_PATTERN = Pattern.compile("^[A-Z0-9]{4,20}$");
    private static final int NOMBRE_MIN_LENGTH = 3;
    private static final int NOMBRE_MAX_LENGTH = 200;
    private static final int DESCRIPCION_MAX_LENGTH = 1000;
    private static final BigDecimal PRECIO_MIN = new BigDecimal("0.01");
    private static final BigDecimal PRECIO_MAX = new BigDecimal("999999.99");

    /**
     * Valida un artículo completo antes de insertar
     */
    public void validarParaInsercion(Articulo articulo) throws ValidationException {
        logger.debug("Validando artículo para inserción: {}", articulo.getCodigo());
        
        List<String> errores = new ArrayList<>();
        
        // Validaciones básicas
        validarCamposObligatorios(articulo, errores);
        validarCodigo(articulo.getCodigo(), errores);
        validarNombre(articulo.getNombre(), errores);
        validarDescripcion(articulo.getDescripcion(), errores);
        validarPrecios(articulo.getPrecioCompra(), articulo.getPrecioVenta(), errores);
        validarStock(articulo.getStockActual(), articulo.getStockMinimo(), errores);
        
        if (!errores.isEmpty()) {
            String mensajeError = "Errores de validación: " + String.join(", ", errores);
            logger.warn("Validación fallida para artículo {}: {}", articulo.getCodigo(), mensajeError);
            throw new ValidationException(mensajeError);
        }
        
        logger.debug("Validación exitosa para artículo: {}", articulo.getCodigo());
    }

    /**
     * Valida un artículo antes de actualizar
     */
    public void validarParaActualizacion(Articulo articulo) throws ValidationException {
        logger.debug("Validando artículo para actualización: ID {}", articulo.getId());
        
        List<String> errores = new ArrayList<>();
        
        // Validar que tenga ID
        if (articulo.getId() == null || articulo.getId() <= 0) {
            errores.add("El ID del artículo es requerido para actualización");
        }
        
        // Validaciones básicas (sin código, ya que no se debe cambiar)
        validarCamposObligatoriosActualizacion(articulo, errores);
        validarNombre(articulo.getNombre(), errores);
        validarDescripcion(articulo.getDescripcion(), errores);
        validarPrecios(articulo.getPrecioCompra(), articulo.getPrecioVenta(), errores);
        validarStock(articulo.getStockActual(), articulo.getStockMinimo(), errores);
        
        if (!errores.isEmpty()) {
            String mensajeError = "Errores de validación: " + String.join(", ", errores);
            logger.warn("Validación fallida para actualización de artículo ID {}: {}", articulo.getId(), mensajeError);
            throw new ValidationException(mensajeError);
        }
        
        logger.debug("Validación exitosa para actualización de artículo ID: {}", articulo.getId());
    }

    /**
     * Valida solo el stock para actualizaciones de inventario
     */
    public void validarStock(Integer stockActual, Integer stockMinimo) throws ValidationException {
        List<String> errores = new ArrayList<>();
        validarStock(stockActual, stockMinimo, errores);
        
        if (!errores.isEmpty()) {
            throw new ValidationException(String.join(", ", errores));
        }
    }

    /**
     * Valida campos obligatorios para inserción
     */
    private void validarCamposObligatorios(Articulo articulo, List<String> errores) {
        if (articulo.getCodigo() == null || articulo.getCodigo().trim().isEmpty()) {
            errores.add("El código del artículo es obligatorio");
        }
        
        if (articulo.getNombre() == null || articulo.getNombre().trim().isEmpty()) {
            errores.add("El nombre del artículo es obligatorio");
        }
        
        if (articulo.getPrecioCompra() == null) {
            errores.add("El precio de compra es obligatorio");
        }
        
        if (articulo.getPrecioVenta() == null) {
            errores.add("El precio de venta es obligatorio");
        }
        
        if (articulo.getStockActual() == null) {
            errores.add("El stock actual es obligatorio");
        }
        
        if (articulo.getStockMinimo() == null) {
            errores.add("El stock mínimo es obligatorio");
        }
    }

    /**
     * Valida campos obligatorios para actualización (sin código)
     */
    private void validarCamposObligatoriosActualizacion(Articulo articulo, List<String> errores) {
        if (articulo.getNombre() == null || articulo.getNombre().trim().isEmpty()) {
            errores.add("El nombre del artículo es obligatorio");
        }
        
        if (articulo.getPrecioCompra() == null) {
            errores.add("El precio de compra es obligatorio");
        }
        
        if (articulo.getPrecioVenta() == null) {
            errores.add("El precio de venta es obligatorio");
        }
        
        if (articulo.getStockActual() == null) {
            errores.add("El stock actual es obligatorio");
        }
        
        if (articulo.getStockMinimo() == null) {
            errores.add("El stock mínimo es obligatorio");
        }
    }

    /**
     * Valida el formato del código del artículo
     */
    private void validarCodigo(String codigo, List<String> errores) {
        if (codigo != null && !codigo.trim().isEmpty()) {
            String codigoLimpio = codigo.trim().toUpperCase();
            
            if (!CODIGO_PATTERN.matcher(codigoLimpio).matches()) {
                errores.add("El código debe tener entre 4 y 20 caracteres alfanuméricos en mayúsculas");
            }
        }
    }

    /**
     * Valida el nombre del artículo
     */
    private void validarNombre(String nombre, List<String> errores) {
        if (nombre != null && !nombre.trim().isEmpty()) {
            String nombreLimpio = nombre.trim();
            
            if (nombreLimpio.length() < NOMBRE_MIN_LENGTH) {
                errores.add("El nombre debe tener al menos " + NOMBRE_MIN_LENGTH + " caracteres");
            }
            
            if (nombreLimpio.length() > NOMBRE_MAX_LENGTH) {
                errores.add("El nombre no puede exceder " + NOMBRE_MAX_LENGTH + " caracteres");
            }
        }
    }

    /**
     * Valida la descripción del artículo
     */
    private void validarDescripcion(String descripcion, List<String> errores) {
        if (descripcion != null && descripcion.trim().length() > DESCRIPCION_MAX_LENGTH) {
            errores.add("La descripción no puede exceder " + DESCRIPCION_MAX_LENGTH + " caracteres");
        }
    }

    /**
     * Valida los precios del artículo
     */
    private void validarPrecios(BigDecimal precioCompra, BigDecimal precioVenta, List<String> errores) {
        // Validar precio de compra
        if (precioCompra != null) {
            if (precioCompra.compareTo(PRECIO_MIN) < 0) {
                errores.add("El precio de compra debe ser mayor a " + PRECIO_MIN);
            }
            
            if (precioCompra.compareTo(PRECIO_MAX) > 0) {
                errores.add("El precio de compra no puede exceder " + PRECIO_MAX);
            }
        }
        
        // Validar precio de venta
        if (precioVenta != null) {
            if (precioVenta.compareTo(PRECIO_MIN) < 0) {
                errores.add("El precio de venta debe ser mayor a " + PRECIO_MIN);
            }
            
            if (precioVenta.compareTo(PRECIO_MAX) > 0) {
                errores.add("El precio de venta no puede exceder " + PRECIO_MAX);
            }
        }
        
        // Validar coherencia entre precios
        if (precioCompra != null && precioVenta != null) {
            if (precioVenta.compareTo(precioCompra) <= 0) {
                errores.add("El precio de venta debe ser mayor al precio de compra");
            }
            
            // Validar que el margen no sea excesivo (más del 1000%)
            BigDecimal margen = precioVenta.subtract(precioCompra).divide(precioCompra, 4, BigDecimal.ROUND_HALF_UP);
            if (margen.compareTo(new BigDecimal("10")) > 0) {
                errores.add("El margen de ganancia parece excesivo (más del 1000%)");
            }
        }
    }

    /**
     * Valida los valores de stock
     */
    private void validarStock(Integer stockActual, Integer stockMinimo, List<String> errores) {
        if (stockActual != null && stockActual < 0) {
            errores.add("El stock actual no puede ser negativo");
        }
        
        if (stockMinimo != null && stockMinimo < 0) {
            errores.add("El stock mínimo no puede ser negativo");
        }
        
        // Validar que el stock mínimo no sea excesivamente alto
        if (stockMinimo != null && stockMinimo > 10000) {
            errores.add("El stock mínimo parece excesivamente alto (mayor a 10,000)");
        }
    }

    /**
     * Valida que un código no esté vacío o nulo
     */
    public void validarCodigoParaBusqueda(String codigo) throws ValidationException {
        if (codigo == null || codigo.trim().isEmpty()) {
            throw new ValidationException("El código del artículo es requerido para la búsqueda");
        }
        
        String codigoLimpio = codigo.trim();
        if (codigoLimpio.length() < 2) {
            throw new ValidationException("El código debe tener al menos 2 caracteres");
        }
    }

    /**
     * Valida que un nombre no esté vacío para búsqueda
     */
    public void validarNombreParaBusqueda(String nombre) throws ValidationException {
        if (nombre == null || nombre.trim().isEmpty()) {
            throw new ValidationException("El nombre del artículo es requerido para la búsqueda");
        }
        
        String nombreLimpio = nombre.trim();
        if (nombreLimpio.length() < 2) {
            throw new ValidationException("El nombre debe tener al menos 2 caracteres para la búsqueda");
        }
    }
}
