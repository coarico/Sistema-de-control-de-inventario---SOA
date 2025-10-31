package com.ferreteria.inventario.dto;

/**
 * DTO para respuestas de operaciones SOAP
 * Proporciona información sobre el resultado de las operaciones
 */
public class RespuestaOperacion {
    private boolean exitoso;
    private String mensaje;
    private String codigoError;
    private String tipoError;
    private ArticuloDTO articulo;

    // Constructor por defecto
    public RespuestaOperacion() {}

    // Constructor para operación exitosa
    public RespuestaOperacion(boolean exitoso, String mensaje) {
        this.exitoso = exitoso;
        this.mensaje = mensaje;
    }

    // Constructor para operación exitosa con artículo
    public RespuestaOperacion(boolean exitoso, String mensaje, ArticuloDTO articulo) {
        this.exitoso = exitoso;
        this.mensaje = mensaje;
        this.articulo = articulo;
    }

    // Constructor para operación fallida
    public RespuestaOperacion(boolean exitoso, String mensaje, String codigoError, String tipoError) {
        this.exitoso = exitoso;
        this.mensaje = mensaje;
        this.codigoError = codigoError;
        this.tipoError = tipoError;
    }

    // Métodos estáticos para crear respuestas comunes
    public static RespuestaOperacion exito(String mensaje) {
        return new RespuestaOperacion(true, mensaje);
    }

    public static RespuestaOperacion exito(String mensaje, ArticuloDTO articulo) {
        return new RespuestaOperacion(true, mensaje, articulo);
    }

    public static RespuestaOperacion error(String mensaje, String codigoError, String tipoError) {
        return new RespuestaOperacion(false, mensaje, codigoError, tipoError);
    }

    // Getters y Setters
    public boolean isExitoso() {
        return exitoso;
    }

    public void setExitoso(boolean exitoso) {
        this.exitoso = exitoso;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    public String getCodigoError() {
        return codigoError;
    }

    public void setCodigoError(String codigoError) {
        this.codigoError = codigoError;
    }

    public String getTipoError() {
        return tipoError;
    }

    public void setTipoError(String tipoError) {
        this.tipoError = tipoError;
    }

    public ArticuloDTO getArticulo() {
        return articulo;
    }

    public void setArticulo(ArticuloDTO articulo) {
        this.articulo = articulo;
    }

    @Override
    public String toString() {
        return "RespuestaOperacion{" +
                "exitoso=" + exitoso +
                ", mensaje='" + mensaje + '\'' +
                ", codigoError='" + codigoError + '\'' +
                ", tipoError='" + tipoError + '\'' +
                ", articulo=" + articulo +
                '}';
    }
}
