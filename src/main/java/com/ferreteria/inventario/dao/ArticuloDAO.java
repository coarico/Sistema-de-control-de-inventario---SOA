package com.ferreteria.inventario.dao;

import com.ferreteria.inventario.model.Articulo;
import com.ferreteria.inventario.config.DatabaseConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object para la entidad Articulo
 * Implementa operaciones CRUD y consultas específicas
 */
public class ArticuloDAO {
    private static final Logger logger = LoggerFactory.getLogger(ArticuloDAO.class);
    private final DatabaseConfig databaseConfig;

    // Consultas SQL
    private static final String INSERT_ARTICULO = 
        "INSERT INTO articulos (codigo, nombre, descripcion, categoria_id, proveedor_id, " +
        "precio_compra, precio_venta, stock_actual, stock_minimo, activo) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    private static final String SELECT_ARTICULO_BY_ID = 
        "SELECT a.*, c.nombre as categoria_nombre, p.nombre as proveedor_nombre " +
        "FROM articulos a " +
        "LEFT JOIN categorias c ON a.categoria_id = c.id " +
        "LEFT JOIN proveedores p ON a.proveedor_id = p.id " +
        "WHERE a.id = ?";

    private static final String SELECT_ARTICULO_BY_CODIGO = 
        "SELECT a.*, c.nombre as categoria_nombre, p.nombre as proveedor_nombre " +
        "FROM articulos a " +
        "LEFT JOIN categorias c ON a.categoria_id = c.id " +
        "LEFT JOIN proveedores p ON a.proveedor_id = p.id " +
        "WHERE a.codigo = ?";

    private static final String SELECT_ALL_ARTICULOS = 
        "SELECT a.*, c.nombre as categoria_nombre, p.nombre as proveedor_nombre " +
        "FROM articulos a " +
        "LEFT JOIN categorias c ON a.categoria_id = c.id " +
        "LEFT JOIN proveedores p ON a.proveedor_id = p.id " +
        "WHERE a.activo = TRUE " +
        "ORDER BY a.nombre";

    private static final String SEARCH_ARTICULOS_BY_NOMBRE = 
        "SELECT a.*, c.nombre as categoria_nombre, p.nombre as proveedor_nombre " +
        "FROM articulos a " +
        "LEFT JOIN categorias c ON a.categoria_id = c.id " +
        "LEFT JOIN proveedores p ON a.proveedor_id = p.id " +
        "WHERE a.activo = TRUE AND a.nombre LIKE ? " +
        "ORDER BY a.nombre";

    private static final String UPDATE_ARTICULO = 
        "UPDATE articulos SET nombre = ?, descripcion = ?, categoria_id = ?, proveedor_id = ?, " +
        "precio_compra = ?, precio_venta = ?, stock_actual = ?, stock_minimo = ?, " +
        "fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?";

    private static final String UPDATE_STOCK = 
        "UPDATE articulos SET stock_actual = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?";

    private static final String DELETE_ARTICULO = 
        "UPDATE articulos SET activo = FALSE, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?";

    private static final String EXISTS_BY_CODIGO = 
        "SELECT COUNT(*) > 0 FROM articulos WHERE codigo = ? AND (? IS NULL OR id != ?)";

    private static final String EXISTS_BY_ID = 
        "SELECT COUNT(*) > 0 FROM articulos WHERE id = ?";

    private static final String SELECT_ARTICULOS_STOCK_BAJO = 
        "SELECT a.*, c.nombre as categoria_nombre, p.nombre as proveedor_nombre " +
        "FROM articulos a " +
        "LEFT JOIN categorias c ON a.categoria_id = c.id " +
        "LEFT JOIN proveedores p ON a.proveedor_id = p.id " +
        "WHERE a.activo = TRUE AND a.stock_actual <= a.stock_minimo " +
        "ORDER BY a.stock_actual ASC";

    public ArticuloDAO() {
        this.databaseConfig = DatabaseConfig.getInstance();
    }

    /**
     * Inserta un nuevo artículo en la base de datos
     */
    public Articulo insertar(Articulo articulo) throws SQLException {
        logger.info("Insertando nuevo artículo con código: {}", articulo.getCodigo());
        
        try (Connection connection = databaseConfig.getConnection();
             PreparedStatement statement = connection.prepareStatement(INSERT_ARTICULO, Statement.RETURN_GENERATED_KEYS)) {
            
            statement.setString(1, articulo.getCodigo());
            statement.setString(2, articulo.getNombre());
            statement.setString(3, articulo.getDescripcion());
            statement.setObject(4, articulo.getCategoriaId());
            statement.setObject(5, articulo.getProveedorId());
            statement.setBigDecimal(6, articulo.getPrecioCompra());
            statement.setBigDecimal(7, articulo.getPrecioVenta());
            statement.setInt(8, articulo.getStockActual());
            statement.setInt(9, articulo.getStockMinimo());
            statement.setBoolean(10, articulo.getActivo());

            int affectedRows = statement.executeUpdate();
            if (affectedRows == 0) {
                throw new SQLException("Error al insertar el artículo, no se afectaron filas");
            }

            try (ResultSet generatedKeys = statement.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    articulo.setId(generatedKeys.getInt(1));
                    logger.info("Artículo insertado correctamente con ID: {}", articulo.getId());
                    return buscarPorId(articulo.getId()).orElse(articulo);
                } else {
                    throw new SQLException("Error al insertar el artículo, no se obtuvo el ID");
                }
            }
        } catch (SQLException e) {
            logger.error("Error al insertar artículo: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Busca un artículo por su ID
     */
    public Optional<Articulo> buscarPorId(Integer id) throws SQLException {
        logger.debug("Buscando artículo por ID: {}", id);
        
        try (Connection connection = databaseConfig.getConnection();
             PreparedStatement statement = connection.prepareStatement(SELECT_ARTICULO_BY_ID)) {
            
            statement.setInt(1, id);
            
            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    Articulo articulo = mapearResultSet(resultSet);
                    logger.debug("Artículo encontrado: {}", articulo.getCodigo());
                    return Optional.of(articulo);
                }
            }
        } catch (SQLException e) {
            logger.error("Error al buscar artículo por ID: {}", e.getMessage(), e);
            throw e;
        }
        
        logger.debug("No se encontró artículo con ID: {}", id);
        return Optional.empty();
    }

    /**
     * Busca un artículo por su código
     */
    public Optional<Articulo> buscarPorCodigo(String codigo) throws SQLException {
        logger.debug("Buscando artículo por código: {}", codigo);
        
        try (Connection connection = databaseConfig.getConnection();
             PreparedStatement statement = connection.prepareStatement(SELECT_ARTICULO_BY_CODIGO)) {
            
            statement.setString(1, codigo);
            
            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    Articulo articulo = mapearResultSet(resultSet);
                    logger.debug("Artículo encontrado: {}", articulo.getNombre());
                    return Optional.of(articulo);
                }
            }
        } catch (SQLException e) {
            logger.error("Error al buscar artículo por código: {}", e.getMessage(), e);
            throw e;
        }
        
        logger.debug("No se encontró artículo con código: {}", codigo);
        return Optional.empty();
    }

    /**
     * Obtiene todos los artículos activos
     */
    public List<Articulo> obtenerTodos() throws SQLException {
        logger.debug("Obteniendo todos los artículos activos");
        List<Articulo> articulos = new ArrayList<>();
        
        try (Connection connection = databaseConfig.getConnection();
             PreparedStatement statement = connection.prepareStatement(SELECT_ALL_ARTICULOS);
             ResultSet resultSet = statement.executeQuery()) {
            
            while (resultSet.next()) {
                articulos.add(mapearResultSet(resultSet));
            }
            
            logger.debug("Se encontraron {} artículos", articulos.size());
        } catch (SQLException e) {
            logger.error("Error al obtener todos los artículos: {}", e.getMessage(), e);
            throw e;
        }
        
        return articulos;
    }

    /**
     * Busca artículos por nombre (búsqueda parcial)
     */
    public List<Articulo> buscarPorNombre(String nombre) throws SQLException {
        logger.debug("Buscando artículos por nombre: {}", nombre);
        List<Articulo> articulos = new ArrayList<>();
        
        try (Connection connection = databaseConfig.getConnection();
             PreparedStatement statement = connection.prepareStatement(SEARCH_ARTICULOS_BY_NOMBRE)) {
            
            statement.setString(1, "%" + nombre + "%");
            
            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    articulos.add(mapearResultSet(resultSet));
                }
            }
            
            logger.debug("Se encontraron {} artículos con nombre similar a: {}", articulos.size(), nombre);
        } catch (SQLException e) {
            logger.error("Error al buscar artículos por nombre: {}", e.getMessage(), e);
            throw e;
        }
        
        return articulos;
    }

    /**
     * Actualiza un artículo existente
     */
    public boolean actualizar(Articulo articulo) throws SQLException {
        logger.info("Actualizando artículo ID: {}", articulo.getId());
        
        try (Connection connection = databaseConfig.getConnection();
             PreparedStatement statement = connection.prepareStatement(UPDATE_ARTICULO)) {
            
            statement.setString(1, articulo.getNombre());
            statement.setString(2, articulo.getDescripcion());
            statement.setObject(3, articulo.getCategoriaId());
            statement.setObject(4, articulo.getProveedorId());
            statement.setBigDecimal(5, articulo.getPrecioCompra());
            statement.setBigDecimal(6, articulo.getPrecioVenta());
            statement.setInt(7, articulo.getStockActual());
            statement.setInt(8, articulo.getStockMinimo());
            statement.setInt(9, articulo.getId());

            int affectedRows = statement.executeUpdate();
            boolean actualizado = affectedRows > 0;
            
            if (actualizado) {
                logger.info("Artículo actualizado correctamente");
            } else {
                logger.warn("No se pudo actualizar el artículo con ID: {}", articulo.getId());
            }
            
            return actualizado;
        } catch (SQLException e) {
            logger.error("Error al actualizar artículo: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Actualiza solo el stock de un artículo
     */
    public boolean actualizarStock(Integer id, Integer nuevoStock) throws SQLException {
        logger.info("Actualizando stock del artículo ID: {} a {}", id, nuevoStock);
        
        try (Connection connection = databaseConfig.getConnection();
             PreparedStatement statement = connection.prepareStatement(UPDATE_STOCK)) {
            
            statement.setInt(1, nuevoStock);
            statement.setInt(2, id);

            int affectedRows = statement.executeUpdate();
            boolean actualizado = affectedRows > 0;
            
            if (actualizado) {
                logger.info("Stock actualizado correctamente");
            } else {
                logger.warn("No se pudo actualizar el stock del artículo con ID: {}", id);
            }
            
            return actualizado;
        } catch (SQLException e) {
            logger.error("Error al actualizar stock: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Elimina (desactiva) un artículo
     */
    public boolean eliminar(Integer id) throws SQLException {
        logger.info("Eliminando (desactivando) artículo ID: {}", id);
        
        try (Connection connection = databaseConfig.getConnection();
             PreparedStatement statement = connection.prepareStatement(DELETE_ARTICULO)) {
            
            statement.setInt(1, id);

            int affectedRows = statement.executeUpdate();
            boolean eliminado = affectedRows > 0;
            
            if (eliminado) {
                logger.info("Artículo eliminado correctamente");
            } else {
                logger.warn("No se pudo eliminar el artículo con ID: {}", id);
            }
            
            return eliminado;
        } catch (SQLException e) {
            logger.error("Error al eliminar artículo: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Verifica si existe un artículo con el código dado (excluyendo el ID especificado)
     */
    /**
     * Verifica si existe un artículo con el ID dado
     * @param id ID del artículo a verificar
     * @return true si existe, false en caso contrario
     * @throws SQLException si ocurre un error de base de datos
     */
    public boolean existePorId(Integer id) throws SQLException {
        if (id == null) {
            return false;
        }
        
        try (Connection connection = databaseConfig.getConnection();
             PreparedStatement statement = connection.prepareStatement(EXISTS_BY_ID)) {
            
            statement.setInt(1, id);
            
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() && resultSet.getBoolean(1);
            }
        }
    }
    
    /**
     * Verifica si existe un artículo con el código dado (excluyendo el ID especificado)
     */
    public boolean existePorCodigo(String codigo, Integer excludeId) throws SQLException {
        try (Connection connection = databaseConfig.getConnection();
             PreparedStatement statement = connection.prepareStatement(EXISTS_BY_CODIGO)) {
            
            statement.setString(1, codigo);
            statement.setInt(2, excludeId != null ? excludeId : 0);
            
            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    return resultSet.getInt(1) > 0;
                }
            }
        } catch (SQLException e) {
            logger.error("Error al verificar existencia por código: {}", e.getMessage(), e);
            throw e;
        }
        
        return false;
    }

    /**
     * Obtiene artículos con stock bajo (menor o igual al mínimo)
     */
    public List<Articulo> obtenerArticulosStockBajo() throws SQLException {
        logger.debug("Obteniendo artículos con stock bajo");
        List<Articulo> articulos = new ArrayList<>();
        
        try (Connection connection = databaseConfig.getConnection();
             PreparedStatement statement = connection.prepareStatement(SELECT_ARTICULOS_STOCK_BAJO);
             ResultSet resultSet = statement.executeQuery()) {
            
            while (resultSet.next()) {
                articulos.add(mapearResultSet(resultSet));
            }
            
            logger.debug("Se encontraron {} artículos con stock bajo", articulos.size());
        } catch (SQLException e) {
            logger.error("Error al obtener artículos con stock bajo: {}", e.getMessage(), e);
            throw e;
        }
        
        return articulos;
    }

    /**
     * Mapea un ResultSet a un objeto Articulo
     */
    private Articulo mapearResultSet(ResultSet resultSet) throws SQLException {
        Articulo articulo = new Articulo();
        
        articulo.setId(resultSet.getInt("id"));
        articulo.setCodigo(resultSet.getString("codigo"));
        articulo.setNombre(resultSet.getString("nombre"));
        articulo.setDescripcion(resultSet.getString("descripcion"));
        articulo.setCategoriaId(resultSet.getObject("categoria_id", Integer.class));
        articulo.setCategoriaNombre(resultSet.getString("categoria_nombre"));
        articulo.setProveedorId(resultSet.getObject("proveedor_id", Integer.class));
        articulo.setProveedorNombre(resultSet.getString("proveedor_nombre"));
        articulo.setPrecioCompra(resultSet.getBigDecimal("precio_compra"));
        articulo.setPrecioVenta(resultSet.getBigDecimal("precio_venta"));
        articulo.setStockActual(resultSet.getInt("stock_actual"));
        articulo.setStockMinimo(resultSet.getInt("stock_minimo"));
        articulo.setActivo(resultSet.getBoolean("activo"));
        
        Timestamp fechaCreacion = resultSet.getTimestamp("fecha_creacion");
        if (fechaCreacion != null) {
            articulo.setFechaCreacion(fechaCreacion.toLocalDateTime());
        }
        
        Timestamp fechaActualizacion = resultSet.getTimestamp("fecha_actualizacion");
        if (fechaActualizacion != null) {
            articulo.setFechaActualizacion(fechaActualizacion.toLocalDateTime());
        }
        
        return articulo;
    }
}
