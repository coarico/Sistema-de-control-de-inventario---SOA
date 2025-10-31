package com.ferreteria.inventario.util;

import com.ferreteria.inventario.dto.ArticuloDTO;
import com.ferreteria.inventario.model.Articulo;

import java.time.format.DateTimeFormatter;

/**
 * Utilidad para mapear entre entidades Articulo y DTOs
 */
public class ArticuloMapper {
    
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Convierte un Articulo a ArticuloDTO
     */
    public static ArticuloDTO toDTO(Articulo articulo) {
        if (articulo == null) {
            return null;
        }

        ArticuloDTO dto = new ArticuloDTO();
        dto.setId(articulo.getId());
        dto.setCodigo(articulo.getCodigo());
        dto.setNombre(articulo.getNombre());
        dto.setDescripcion(articulo.getDescripcion());
        dto.setCategoriaId(articulo.getCategoriaId());
        dto.setCategoriaNombre(articulo.getCategoriaNombre());
        dto.setProveedorId(articulo.getProveedorId());
        dto.setProveedorNombre(articulo.getProveedorNombre());
        dto.setPrecioCompra(articulo.getPrecioCompra());
        dto.setPrecioVenta(articulo.getPrecioVenta());
        dto.setStockActual(articulo.getStockActual());
        dto.setStockMinimo(articulo.getStockMinimo());
        dto.setActivo(articulo.getActivo());

        if (articulo.getFechaCreacion() != null) {
            dto.setFechaCreacion(articulo.getFechaCreacion().format(FORMATTER));
        }

        if (articulo.getFechaActualizacion() != null) {
            dto.setFechaActualizacion(articulo.getFechaActualizacion().format(FORMATTER));
        }

        return dto;
    }

    /**
     * Convierte un ArticuloDTO a Articulo
     */
    public static Articulo toEntity(ArticuloDTO dto) {
        if (dto == null) {
            return null;
        }

        Articulo articulo = new Articulo();
        articulo.setId(dto.getId());
        articulo.setCodigo(dto.getCodigo());
        articulo.setNombre(dto.getNombre());
        articulo.setDescripcion(dto.getDescripcion());
        articulo.setCategoriaId(dto.getCategoriaId());
        articulo.setCategoriaNombre(dto.getCategoriaNombre());
        articulo.setProveedorId(dto.getProveedorId());
        articulo.setProveedorNombre(dto.getProveedorNombre());
        articulo.setPrecioCompra(dto.getPrecioCompra());
        articulo.setPrecioVenta(dto.getPrecioVenta());
        articulo.setStockActual(dto.getStockActual());
        articulo.setStockMinimo(dto.getStockMinimo());
        articulo.setActivo(dto.getActivo());

        return articulo;
    }
}
