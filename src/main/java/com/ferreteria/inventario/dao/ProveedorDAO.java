package com.ferreteria.inventario.dao;

import com.ferreteria.inventario.config.DatabaseConfig;
import com.ferreteria.inventario.model.Proveedor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ProveedorDAO {
    
    private static final Logger logger = LoggerFactory.getLogger(ProveedorDAO.class);
    private final DatabaseConfig dbConfig;
    
    public ProveedorDAO() {
        this.dbConfig = DatabaseConfig.getInstance();
    }
    
    /**
     * Obtiene todos los proveedores ordenados por nombre
     * @return Lista de proveedores
     */
    public List<Proveedor> listarTodos() {
        List<Proveedor> proveedores = new ArrayList<>();
        String sql = "SELECT id, nombre, contacto, telefono, email, direccion FROM proveedores ORDER BY nombre";
        
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        
        try {
            conn = dbConfig.getConnection();
            stmt = conn.prepareStatement(sql);
            rs = stmt.executeQuery();
            
            while (rs.next()) {
                Proveedor proveedor = new Proveedor();
                proveedor.setId(rs.getInt("id"));
                proveedor.setNombre(rs.getString("nombre"));
                proveedor.setContacto(rs.getString("contacto"));
                proveedor.setTelefono(rs.getString("telefono"));
                proveedor.setEmail(rs.getString("email"));
                proveedor.setDireccion(rs.getString("direccion"));
                proveedores.add(proveedor);
            }
            
            logger.debug("Se encontraron {} proveedores", proveedores.size());
            
        } catch (SQLException e) {
            logger.error("Error al listar proveedores: {}", e.getMessage(), e);
            throw new RuntimeException("Error al obtener la lista de proveedores", e);
        } finally {
            // Cerrar recursos en orden inverso
            try { if (rs != null) rs.close(); } catch (SQLException e) { logger.warn("Error al cerrar ResultSet: {}", e.getMessage()); }
            try { if (stmt != null) stmt.close(); } catch (SQLException e) { logger.warn("Error al cerrar PreparedStatement: {}", e.getMessage()); }
            try { if (conn != null) conn.close(); } catch (SQLException e) { logger.warn("Error al cerrar Connection: {}", e.getMessage()); }
        }
        
        return proveedores;
    }
    
    /**
     * Busca un proveedor por su ID
     * @param id ID del proveedor a buscar
     * @return El proveedor encontrado o null si no existe
     */
    public Proveedor buscarPorId(int id) {
        String sql = "SELECT id, nombre, contacto, telefono, email, direccion FROM proveedores WHERE id = ?";
        Proveedor proveedor = null;
        
        try (Connection conn = dbConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    proveedor = new Proveedor();
                    proveedor.setId(rs.getInt("id"));
                    proveedor.setNombre(rs.getString("nombre"));
                    proveedor.setContacto(rs.getString("contacto"));
                    proveedor.setTelefono(rs.getString("telefono"));
                    proveedor.setEmail(rs.getString("email"));
                    proveedor.setDireccion(rs.getString("direccion"));
                    logger.debug("Proveedor encontrado: {}", proveedor);
                }
            }
            
        } catch (SQLException e) {
            logger.error("Error al buscar proveedor con ID {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Error al buscar proveedor", e);
        }
        
        return proveedor;
    }
}
