package com.ferreteria.inventario.dao;

import com.ferreteria.inventario.config.DatabaseConfig;
import com.ferreteria.inventario.model.Categoria;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CategoriaDAO {
    
    private static final Logger logger = LoggerFactory.getLogger(CategoriaDAO.class);
    private final DatabaseConfig dbConfig;
    
    public CategoriaDAO() {
        this.dbConfig = DatabaseConfig.getInstance();
    }
    
    /**
     * Obtiene todas las categorías ordenadas por nombre
     * @return Lista de categorías
     */
    public List<Categoria> listarTodas() {
        List<Categoria> categorias = new ArrayList<>();
        String sql = "SELECT id, nombre, descripcion FROM categorias ORDER BY nombre";
        
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        
        try {
            conn = dbConfig.getConnection();
            stmt = conn.prepareStatement(sql);
            rs = stmt.executeQuery();
            
            while (rs.next()) {
                Categoria categoria = new Categoria();
                categoria.setId(rs.getInt("id"));
                categoria.setNombre(rs.getString("nombre"));
                categoria.setDescripcion(rs.getString("descripcion"));
                categorias.add(categoria);
            }
            
            logger.debug("Se encontraron {} categorías", categorias.size());
            
        } catch (SQLException e) {
            logger.error("Error al listar categorías: {}", e.getMessage(), e);
            throw new RuntimeException("Error al obtener la lista de categorías", e);
        } finally {
            // Cerrar recursos en orden inverso
            try { if (rs != null) rs.close(); } catch (SQLException e) { logger.warn("Error al cerrar ResultSet: {}", e.getMessage()); }
            try { if (stmt != null) stmt.close(); } catch (SQLException e) { logger.warn("Error al cerrar PreparedStatement: {}", e.getMessage()); }
            try { if (conn != null) conn.close(); } catch (SQLException e) { logger.warn("Error al cerrar Connection: {}", e.getMessage()); }
        }
        
        return categorias;
    }
    
    /**
     * Busca una categoría por su ID
     * @param id ID de la categoría a buscar
     * @return La categoría encontrada o null si no existe
     */
    public Categoria buscarPorId(int id) {
        String sql = "SELECT id, nombre, descripcion FROM categorias WHERE id = ?";
        Categoria categoria = null;
        
        try (Connection conn = dbConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    categoria = new Categoria();
                    categoria.setId(rs.getInt("id"));
                    categoria.setNombre(rs.getString("nombre"));
                    categoria.setDescripcion(rs.getString("descripcion"));
                    logger.debug("Categoría encontrada: {}", categoria);
                }
            }
            
        } catch (SQLException e) {
            logger.error("Error al buscar categoría con ID {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Error al buscar categoría", e);
        }
        
        return categoria;
    }
}
