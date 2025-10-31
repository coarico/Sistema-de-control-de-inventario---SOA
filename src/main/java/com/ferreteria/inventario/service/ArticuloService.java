package com.ferreteria.inventario.service;

import com.ferreteria.inventario.dao.ArticuloDAO;
import com.ferreteria.inventario.model.Articulo;
import com.ferreteria.inventario.exception.ArticuloNotFoundException;
import com.ferreteria.inventario.exception.InventarioException;
import com.ferreteria.inventario.exception.ValidationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.ferreteria.inventario.dao.MovimientoInventarioDAO;
import com.ferreteria.inventario.model.MovimientoInventario;
import com.ferreteria.inventario.model.TipoMovimiento;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

/**
 * Servicio de lógica de negocio para la gestión de artículos
 * Implementa todas las reglas de negocio y coordina las operaciones
 */
public class ArticuloService {
    private static final Logger logger = LoggerFactory.getLogger(ArticuloService.class);
    
    private final ArticuloDAO articuloDAO;
    private final ArticuloValidator validator;
    private final MovimientoInventarioDAO movimientoInventarioDAO;

    public ArticuloService() {
        this.articuloDAO = new ArticuloDAO();
        this.validator = new ArticuloValidator();
        this.movimientoInventarioDAO = new MovimientoInventarioDAO();
    }

    // Constructor para inyección de dependencias (útil para testing)
    public ArticuloService(ArticuloDAO articuloDAO, ArticuloValidator validator, MovimientoInventarioDAO movimientoInventarioDAO) {
        this.articuloDAO = articuloDAO;
        this.validator = validator;
        this.movimientoInventarioDAO = movimientoInventarioDAO != null ? movimientoInventarioDAO : new MovimientoInventarioDAO();
    }

    /**
     * Registra un nuevo artículo en el inventario
     * Aplica todas las validaciones de negocio
     */
    public Articulo registrarArticulo(Articulo articulo) throws InventarioException {
        logger.info("Iniciando registro de nuevo artículo: {}", articulo.getCodigo());
        
        try {
            // Validar datos del artículo
            validator.validarParaInsercion(articulo);
            
            // Verificar que el código no exista
            if (articuloDAO.existePorCodigo(articulo.getCodigo(), null)) {
                throw new ValidationException("Ya existe un artículo con el código: " + articulo.getCodigo());
            }
            
            // Normalizar datos
            normalizarDatos(articulo);
            
            // Insertar en la base de datos
            Articulo articuloCreado = articuloDAO.insertar(articulo);
            
            logger.info("Artículo registrado exitosamente: {} - {}", 
                       articuloCreado.getCodigo(), articuloCreado.getNombre());
            
            // Verificar si el stock está bajo
            if (articuloCreado.tieneStockBajo()) {
                logger.warn("ALERTA: El artículo {} tiene stock bajo. Stock actual: {}, Stock mínimo: {}", 
                           articuloCreado.getCodigo(), articuloCreado.getStockActual(), articuloCreado.getStockMinimo());
            }
            
            return articuloCreado;
            
        } catch (SQLException e) {
            logger.error("Error de base de datos al registrar artículo: {}", e.getMessage(), e);
            throw new InventarioException("ERROR_BD", "BASE_DATOS", 
                "Error al acceder a la base de datos: " + e.getMessage(), e);
        }
    }

    /**
     * Consulta un artículo por su código
     */
    public Articulo consultarPorCodigo(String codigo) throws InventarioException {
        logger.info("Consultando artículo por código: {}", codigo);
        
        try {
            // Validar código
            validator.validarCodigoParaBusqueda(codigo);
            
            // Normalizar código
            String codigoNormalizado = codigo.trim().toUpperCase();
            
            // Buscar en la base de datos
            Optional<Articulo> articuloOpt = articuloDAO.buscarPorCodigo(codigoNormalizado);
            
            if (articuloOpt.isPresent()) {
                Articulo articulo = articuloOpt.get();
                logger.info("Artículo encontrado: {} - {}", articulo.getCodigo(), articulo.getNombre());
                return articulo;
            } else {
                logger.info("No se encontró artículo con código: {}", codigoNormalizado);
                throw new ArticuloNotFoundException(codigoNormalizado);
            }
            
        } catch (SQLException e) {
            logger.error("Error de base de datos al consultar artículo: {}", e.getMessage(), e);
            throw new InventarioException("ERROR_BD", "BASE_DATOS", 
                "Error al acceder a la base de datos: " + e.getMessage(), e);
        }
    }

    /**
     * Consulta un artículo por su ID
     */
    public Articulo consultarPorId(Integer id) throws InventarioException {
        logger.info("Consultando artículo por ID: {}", id);
        
        try {
            if (id == null || id <= 0) {
                throw new ValidationException("El ID del artículo debe ser un número positivo");
            }
            
            Optional<Articulo> articuloOpt = articuloDAO.buscarPorId(id);
            
            if (articuloOpt.isPresent()) {
                Articulo articulo = articuloOpt.get();
                logger.info("Artículo encontrado: {} - {}", articulo.getCodigo(), articulo.getNombre());
                return articulo;
            } else {
                logger.info("No se encontró artículo con ID: {}", id);
                throw new ArticuloNotFoundException(id);
            }
            
        } catch (SQLException e) {
            logger.error("Error de base de datos al consultar artículo: {}", e.getMessage(), e);
            throw new InventarioException("ERROR_BD", "BASE_DATOS", 
                "Error al acceder a la base de datos: " + e.getMessage(), e);
        }
    }

    /**
     * Busca artículos por nombre (búsqueda parcial)
     */
    public List<Articulo> buscarPorNombre(String nombre) throws InventarioException {
        logger.info("Buscando artículos por nombre: {}", nombre);
        
        try {
            // Validar nombre
            validator.validarNombreParaBusqueda(nombre);
            
            // Buscar en la base de datos
            List<Articulo> articulos = articuloDAO.buscarPorNombre(nombre.trim());
            
            logger.info("Se encontraron {} artículos con nombre similar a: {}", articulos.size(), nombre);
            return articulos;
            
        } catch (SQLException e) {
            logger.error("Error de base de datos al buscar artículos: {}", e.getMessage(), e);
            throw new InventarioException("ERROR_BD", "BASE_DATOS", 
                "Error al acceder a la base de datos: " + e.getMessage(), e);
        }
    }

    /**
     * Obtiene todos los artículos activos
     */
    public List<Articulo> obtenerTodosLosArticulos() throws InventarioException {
        logger.info("Obteniendo todos los artículos activos");
        
        try {
            List<Articulo> articulos = articuloDAO.obtenerTodos();
            logger.info("Se obtuvieron {} artículos activos", articulos.size());
            return articulos;
            
        } catch (SQLException e) {
            logger.error("Error de base de datos al obtener artículos: {}", e.getMessage(), e);
            throw new InventarioException("ERROR_BD", "BASE_DATOS", 
                "Error al acceder a la base de datos: " + e.getMessage(), e);
        }
    }

    /**
     * Actualiza un artículo existente
     */
    public Articulo actualizarArticulo(Articulo articulo) throws InventarioException {
        logger.info("Actualizando artículo ID: {}", articulo.getId());
        
        try {
            // Validar datos del artículo
            validator.validarParaActualizacion(articulo);
            
            // Verificar que el artículo existe
            Optional<Articulo> articuloExistente = articuloDAO.buscarPorId(articulo.getId());
            if (!articuloExistente.isPresent()) {
                throw new ArticuloNotFoundException(articulo.getId());
            }
            
            // Normalizar datos
            normalizarDatos(articulo);
            
            // Actualizar en la base de datos
            boolean actualizado = articuloDAO.actualizar(articulo);
            
            if (!actualizado) {
                throw new InventarioException("ERROR_ACTUALIZACION", "OPERACION", 
                    "No se pudo actualizar el artículo");
            }
            
            // Obtener el artículo actualizado
            Articulo articuloActualizado = articuloDAO.buscarPorId(articulo.getId()).orElse(articulo);
            
            logger.info("Artículo actualizado exitosamente: {}", articuloActualizado.getCodigo());
            
            // Verificar si el stock está bajo
            if (articuloActualizado.tieneStockBajo()) {
                logger.warn("ALERTA: El artículo {} tiene stock bajo después de la actualización", 
                           articuloActualizado.getCodigo());
            }
            
            return articuloActualizado;
            
        } catch (SQLException e) {
            logger.error("Error de base de datos al actualizar artículo: {}", e.getMessage(), e);
            throw new InventarioException("ERROR_BD", "BASE_DATOS", 
                "Error al acceder a la base de datos: " + e.getMessage(), e);
        }
    }

    /**
     * Actualiza solo el stock de un artículo
     */
    public void actualizarStock(Integer id, Integer nuevoStock) throws InventarioException {
        logger.info("Actualizando stock del artículo ID: {} a {}", id, nuevoStock);
        
        try {
            // Validaciones básicas
            if (id == null || id <= 0) {
                throw new ValidationException("El ID del artículo debe ser un número positivo");
            }
            
            if (nuevoStock == null || nuevoStock < 0) {
                throw new ValidationException("El stock debe ser un número no negativo");
            }
            
            // Verificar que el artículo existe
            Optional<Articulo> articuloOpt = articuloDAO.buscarPorId(id);
            if (!articuloOpt.isPresent()) {
                throw new ArticuloNotFoundException(id);
            }
            
            Articulo articulo = articuloOpt.get();
            
            // Actualizar stock
            boolean actualizado = articuloDAO.actualizarStock(id, nuevoStock);
            
            if (!actualizado) {
                throw new InventarioException("ERROR_ACTUALIZACION", "OPERACION", 
                    "No se pudo actualizar el stock del artículo");
            }
            
            logger.info("Stock actualizado exitosamente para artículo: {}", articulo.getCodigo());
            
            // Verificar si el nuevo stock está bajo
            if (nuevoStock <= articulo.getStockMinimo()) {
                logger.warn("ALERTA: El artículo {} ahora tiene stock bajo. Stock actual: {}, Stock mínimo: {}", 
                           articulo.getCodigo(), nuevoStock, articulo.getStockMinimo());
            }
            
        } catch (SQLException e) {
            logger.error("Error de base de datos al actualizar stock: {}", e.getMessage(), e);
            throw new InventarioException("ERROR_BD", "BASE_DATOS", 
                "Error al acceder a la base de datos: " + e.getMessage(), e);
        }
    }

    /**
     * Elimina (desactiva) un artículo
     */
    public void eliminarArticulo(Integer id) throws InventarioException {
        logger.info("Eliminando artículo ID: {}", id);
        
        try {
            if (id == null || id <= 0) {
                throw new ValidationException("El ID del artículo debe ser un número positivo");
            }
            
            // Verificar que el artículo existe
            Optional<Articulo> articuloOpt = articuloDAO.buscarPorId(id);
            if (!articuloOpt.isPresent()) {
                throw new ArticuloNotFoundException(id);
            }
            
            Articulo articulo = articuloOpt.get();
            
            // Eliminar (desactivar)
            boolean eliminado = articuloDAO.eliminar(id);
            
            if (!eliminado) {
                throw new InventarioException("ERROR_ELIMINACION", "OPERACION", 
                    "No se pudo eliminar el artículo");
            }
            
            logger.info("Artículo eliminado exitosamente: {}", articulo.getCodigo());
            
        } catch (SQLException e) {
            logger.error("Error de base de datos al eliminar artículo: {}", e.getMessage(), e);
            throw new InventarioException("ERROR_BD", "BASE_DATOS", 
                "Error al acceder a la base de datos: " + e.getMessage(), e);
        }
    }

    /**
     * Obtiene artículos con stock bajo
     */
    public List<Articulo> obtenerArticulosConStockBajo() throws InventarioException {
        logger.info("Obteniendo artículos con stock bajo");
        
        try {
            List<Articulo> articulos = articuloDAO.obtenerArticulosStockBajo();
            logger.info("Se encontraron {} artículos con stock bajo", articulos.size());
            return articulos;
            
        } catch (SQLException e) {
            logger.error("Error de base de datos al obtener artículos con stock bajo: {}", e.getMessage(), e);
            throw new InventarioException("ERROR_BD", "BASE_DATOS", 
                "Error al acceder a la base de datos: " + e.getMessage(), e);
        }
    }

    /**
     * Actualiza el stock de un artículo y registra el movimiento
     * @param idArticulo ID del artículo a actualizar
     * @param cantidad Cantidad a sumar (positiva) o restar (negativa)
     * @param motivo Motivo del movimiento (opcional)
     * @param usuario Usuario que realiza el movimiento
     * @return Artículo actualizado
     */
    public Articulo actualizarStockConMovimiento(Integer idArticulo, int cantidad, String motivo, String usuario) 
            throws InventarioException {
        logger.info("Actualizando stock del artículo ID: {} en {}", idArticulo, cantidad);
        
        if (idArticulo == null || idArticulo <= 0) {
            throw new ValidationException("ID de artículo inválido");
        }
        
        if (cantidad == 0) {
            throw new ValidationException("La cantidad no puede ser cero");
        }
        
        try {
            // Obtener el artículo actual
            Articulo articulo = articuloDAO.buscarPorId(idArticulo)
                .orElseThrow(() -> new ArticuloNotFoundException(idArticulo));
                
            int stockAnterior = articulo.getStockActual();
            int nuevoStock = stockAnterior + cantidad;
            
            // Validar que el stock no sea negativo
            if (nuevoStock < 0) {
                throw new ValidationException("Stock insuficiente. Stock actual: " + stockAnterior + ", Intento de retiro: " + (-cantidad));
            }
            
            // Actualizar el stock
            articulo.setStockActual(nuevoStock);
            boolean actualizado = articuloDAO.actualizarStock(articulo.getId(), nuevoStock);
            
            if (!actualizado) {
                throw new InventarioException("ERROR_ACTUALIZACION", "STOCK", 
                    "No se pudo actualizar el stock del artículo ID: " + idArticulo);
            }
            
            // Registrar el movimiento
            MovimientoInventario movimiento = new MovimientoInventario();
            movimiento.setArticuloId(articulo.getId());
            movimiento.setTipoMovimiento(cantidad > 0 ? TipoMovimiento.ENTRADA : TipoMovimiento.SALIDA);
            movimiento.setCantidad(Math.abs(cantidad));
            movimiento.setStockAnterior(stockAnterior);
            movimiento.setStockNuevo(nuevoStock);
            movimiento.setMotivo(motivo);
            movimiento.setUsuario(usuario);
            
            movimientoInventarioDAO.registrarMovimiento(movimiento);
            
            logger.info("Stock actualizado para artículo ID: {}. Stock anterior: {}, Cantidad: {}, Nuevo stock: {}", 
                idArticulo, stockAnterior, cantidad, nuevoStock);
                
            // Verificar si el stock está bajo después de la actualización
            if (articulo.tieneStockBajo()) {
                logger.warn("ALERTA: El artículo {} tiene stock bajo después de la actualización. Stock actual: {}, Stock mínimo: {}", 
                    articulo.getCodigo(), nuevoStock, articulo.getStockMinimo());
            }
            
            return articulo;
            
        } catch (SQLException e) {
            logger.error("Error al actualizar stock del artículo ID {}: {}", idArticulo, e.getMessage(), e);
            throw new InventarioException("ERROR_BD", "STOCK", 
                "Error al actualizar el stock: " + e.getMessage(), e);
        }
    }
    
    /**
     * Registra una entrada de stock
     */
    public Articulo registrarEntradaStock(Integer idArticulo, int cantidad, String motivo, String usuario) 
            throws InventarioException {
        if (cantidad <= 0) {
            throw new ValidationException("La cantidad de entrada debe ser mayor que cero");
        }
        return actualizarStockConMovimiento(idArticulo, cantidad, motivo, usuario);
    }
    
    /**
     * Registra una salida de stock
     */
    public Articulo registrarSalidaStock(Integer idArticulo, int cantidad, String motivo, String usuario) 
            throws InventarioException {
        if (cantidad <= 0) {
            throw new ValidationException("La cantidad de salida debe ser mayor que cero");
        }
        return actualizarStockConMovimiento(idArticulo, -cantidad, motivo, usuario);
    }
    
    /**
     * Obtiene el historial de movimientos de un artículo
     */
    public List<MovimientoInventario> obtenerMovimientosArticulo(Integer idArticulo) throws InventarioException {
        try {
            // Verificar que el artículo existe
            if (!articuloDAO.existePorId(idArticulo)) {
                throw new ArticuloNotFoundException(idArticulo);
            }
            
            return movimientoInventarioDAO.obtenerMovimientosPorArticulo(idArticulo);
            
        } catch (SQLException e) {
            logger.error("Error al obtener movimientos del artículo ID {}: {}", idArticulo, e.getMessage(), e);
            throw new InventarioException("ERROR_BD", "CONSULTA", 
                "Error al obtener el historial de movimientos: " + e.getMessage(), e);
        }
    }

    /**
     * Normaliza los datos del artículo antes de procesarlos
     */
    private void normalizarDatos(Articulo articulo) {
        if (articulo.getCodigo() != null) {
            articulo.setCodigo(articulo.getCodigo().trim().toUpperCase());
        }
        
        if (articulo.getNombre() != null) {
            articulo.setNombre(articulo.getNombre().trim());
        }
        
        if (articulo.getDescripcion() != null) {
            logger.debug("NORMALIZAR: Descripción original: '{}'", articulo.getDescripcion());
            String descripcion = articulo.getDescripcion().trim();
            logger.debug("NORMALIZAR: Descripción después de trim: '{}', length: {}", descripcion, descripcion.length());
            articulo.setDescripcion(descripcion.isEmpty() ? null : descripcion);
            logger.debug("NORMALIZAR: Descripción final: '{}'", articulo.getDescripcion());
        } else {
            logger.debug("NORMALIZAR: Descripción es null");
        }
        
        // Asegurar valores por defecto
        if (articulo.getActivo() == null) {
            articulo.setActivo(true);
        }
        
        if (articulo.getStockActual() == null) {
            articulo.setStockActual(0);
        }
        
        if (articulo.getStockMinimo() == null) {
            articulo.setStockMinimo(0);
        }
    }
}
