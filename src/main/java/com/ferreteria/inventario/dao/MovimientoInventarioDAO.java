package com.ferreteria.inventario.dao;

import com.ferreteria.inventario.model.MovimientoInventario;
import com.ferreteria.inventario.model.TipoMovimiento;
import com.ferreteria.inventario.config.DatabaseConfig;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object para la gestión de movimientos de inventario
 */
public class MovimientoInventarioDAO {
    private static final String INSERT_MOVIMIENTO = 
            "INSERT INTO movimientos_inventario " +
            "(articulo_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, usuario, fecha_movimiento) " +
            "VALUES (?, ?::tipo_movimiento, ?, ?, ?, ?, ?, ?)";
    
    private static final String SELECT_BY_ARTICULO = 
            "SELECT id, articulo_id, tipo_movimiento, cantidad, stock_anterior, " +
            "stock_nuevo, motivo, usuario, fecha_movimiento " +
            "FROM movimientos_inventario " +
            "WHERE articulo_id = ? " +
            "ORDER BY fecha_movimiento DESC";

    /**
     * Registra un movimiento de inventario
     */
    public void registrarMovimiento(MovimientoInventario movimiento) throws SQLException {
        try (Connection conn = DatabaseConfig.getInstance().getDataSource().getConnection();
             PreparedStatement stmt = conn.prepareStatement(INSERT_MOVIMIENTO, 
                 Statement.RETURN_GENERATED_KEYS)) {
            
            stmt.setInt(1, movimiento.getArticuloId());
            stmt.setString(2, movimiento.getTipoMovimiento().name());
            stmt.setInt(3, movimiento.getCantidad());
            stmt.setInt(4, movimiento.getStockAnterior());
            stmt.setInt(5, movimiento.getStockNuevo());
            stmt.setString(6, movimiento.getMotivo());
            stmt.setString(7, movimiento.getUsuario());
            stmt.setTimestamp(8, Timestamp.valueOf(movimiento.getFechaMovimiento() != null ? 
                movimiento.getFechaMovimiento() : LocalDateTime.now()));
            
            int affectedRows = stmt.executeUpdate();
            
            if (affectedRows == 0) {
                throw new SQLException("No se pudo registrar el movimiento de inventario");
            }
            
            try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    movimiento.setId(generatedKeys.getInt(1));
                }
            }
        }
    }
    
    /**
     * Obtiene los movimientos de un artículo
     */
    public List<MovimientoInventario> obtenerMovimientosPorArticulo(int articuloId) throws SQLException {
        List<MovimientoInventario> movimientos = new ArrayList<>();
        
        try (Connection conn = DatabaseConfig.getInstance().getDataSource().getConnection();
             PreparedStatement stmt = conn.prepareStatement(SELECT_BY_ARTICULO)) {
            
            stmt.setInt(1, articuloId);
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    MovimientoInventario movimiento = new MovimientoInventario();
                    movimiento.setId(rs.getInt("id"));
                    movimiento.setArticuloId(rs.getInt("articulo_id"));
                    movimiento.setTipoMovimiento(
                        TipoMovimiento.valueOf(rs.getString("tipo_movimiento")));
                    movimiento.setCantidad(rs.getInt("cantidad"));
                    movimiento.setStockAnterior(rs.getInt("stock_anterior"));
                    movimiento.setStockNuevo(rs.getInt("stock_nuevo"));
                    movimiento.setMotivo(rs.getString("motivo"));
                    movimiento.setUsuario(rs.getString("usuario"));
                    
                    Timestamp timestamp = rs.getTimestamp("fecha_movimiento");
                    if (timestamp != null) {
                        movimiento.setFechaMovimiento(timestamp.toLocalDateTime());
                    }
                    
                    movimientos.add(movimiento);
                }
            }
        }
        
        return movimientos;
    }
}
