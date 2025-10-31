package com.ferreteria.inventario.exception;

/**
 * Excepción para cuando no se encuentra un artículo
 */
public class ArticuloNotFoundException extends InventarioException {
    
    public ArticuloNotFoundException(String codigo) {
        super("ARTICULO_NOT_FOUND", "BUSQUEDA", "No se encontró el artículo con código: " + codigo);
    }

    public ArticuloNotFoundException(Integer id) {
        super("ARTICULO_NOT_FOUND", "BUSQUEDA", "No se encontró el artículo con ID: " + id);
    }
}
