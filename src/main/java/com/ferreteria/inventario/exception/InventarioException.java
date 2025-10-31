package com.ferreteria.inventario.exception;

/**
 * Excepción base para el sistema de inventario
 */
public class InventarioException extends Exception {
    private final String codigo;
    private final String tipoError;

    public InventarioException(String mensaje) {
        super(mensaje);
        this.codigo = "INVENTARIO_ERROR";
        this.tipoError = "GENERAL";
    }

    public InventarioException(String codigo, String tipoError, String mensaje) {
        super(mensaje);
        this.codigo = codigo;
        this.tipoError = tipoError;
    }

    public InventarioException(String mensaje, Throwable causa) {
        super(mensaje, causa);
        this.codigo = "INVENTARIO_ERROR";
        this.tipoError = "GENERAL";
    }

    public InventarioException(String codigo, String tipoError, String mensaje, Throwable causa) {
        super(mensaje, causa);
        this.codigo = codigo;
        this.tipoError = tipoError;
    }

    public String getCodigo() {
        return codigo;
    }

    public String getTipoError() {
        return tipoError;
    }
}
