package com.ferreteria.inventario.exception;

/**
 * Excepción para errores de validación de datos
 */
public class ValidationException extends InventarioException {
    
    public ValidationException(String mensaje) {
        super("VALIDATION_ERROR", "VALIDACION", mensaje);
    }

    public ValidationException(String mensaje, Throwable causa) {
        super("VALIDATION_ERROR", "VALIDACION", mensaje, causa);
    }
}
