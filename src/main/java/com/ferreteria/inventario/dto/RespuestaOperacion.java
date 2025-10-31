package com.ferreteria.inventario.dto;

import com.ferreteria.inventario.model.Proveedor;
import com.ferreteria.inventario.util.ProveedorListAdapter;
import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlElementWrapper;
import jakarta.xml.bind.annotation.XmlRootElement;
import jakarta.xml.bind.annotation.XmlType;
import jakarta.xml.bind.annotation.adapters.XmlJavaTypeAdapter;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO para respuestas de operaciones SOAP
 * Proporciona información sobre el resultado de las operaciones
 */
@XmlRootElement(name = "respuesta", namespace = "http://ws.inventario.ferreteria.com/")
@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "respuestaType", propOrder = {
    "exitoso", 
    "mensaje", 
    "codigoError", 
    "tipoError", 
    "datos",
    "advertencias"
})
public class RespuestaOperacion<T> implements Serializable {
    private static final long serialVersionUID = 1L;
    
    @XmlElement(name = "exitoso", required = true, namespace = "http://ws.inventario.ferreteria.com/")
    protected boolean exitoso;
    
    @XmlElement(namespace = "http://ws.inventario.ferreteria.com/")
    protected String mensaje;
    
    @XmlElement(name = "codigoError", namespace = "http://ws.inventario.ferreteria.com/")
    protected String codigoError;
    
    @XmlElement(name = "tipoError", namespace = "http://ws.inventario.ferreteria.com/")
    protected String tipoError;
    
    @XmlElement(name = "datos", namespace = "http://ws.inventario.ferreteria.com/")
    protected T datos;
    
    @XmlElementWrapper(name = "advertencias", namespace = "http://ws.inventario.ferreteria.com/")
    @XmlElement(name = "advertencia", namespace = "http://ws.inventario.ferreteria.com/")
    private List<String> advertencias;

    // Constructor por defecto
    public RespuestaOperacion() {}

    // Constructor para operación exitosa
    public RespuestaOperacion(boolean exitoso, String mensaje) {
        this.exitoso = exitoso;
        this.mensaje = mensaje;
    }

    // Constructor para operación exitosa con datos
    public RespuestaOperacion(boolean exitoso, String mensaje, T datos) {
        this.exitoso = exitoso;
        this.mensaje = mensaje;
        this.datos = datos;
    }

    // Constructor para operación fallida
    public RespuestaOperacion(boolean exitoso, String mensaje, String codigoError, String tipoError) {
        this.exitoso = exitoso;
        this.mensaje = mensaje;
        this.codigoError = codigoError;
        this.tipoError = tipoError;
    }

    // Métodos estáticos para crear respuestas comunes
    public static <T> RespuestaOperacion<T> exito(String mensaje) {
        return new RespuestaOperacion<>(true, mensaje, null);
    }

    public static <T> RespuestaOperacion<T> exito(String mensaje, T datos) {
        return new RespuestaOperacion<>(true, mensaje, datos);
    }

    public static <T> RespuestaOperacion<T> error(String mensaje, String codigoError, String tipoError) {
        RespuestaOperacion<T> response = new RespuestaOperacion<>();
        response.setExitoso(false);
        response.setMensaje(mensaje);
        response.setCodigoError(codigoError);
        response.setTipoError(tipoError);
        return response;
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

    public T getDatos() {
        return datos;
    }

    @SuppressWarnings("unchecked")
    public <U> U getDatos(Class<U> type) {
        if (datos != null && type.isAssignableFrom(datos.getClass())) {
            return type.cast(datos);
        }
        return null;
    }

    public void setDatos(T datos) {
        this.datos = datos;
    }

    public List<String> getAdvertencias() {
        if (advertencias == null) {
            advertencias = new ArrayList<>();
        }
        return advertencias;
    }

    public void setAdvertencias(List<String> advertencias) {
        this.advertencias = advertencias;
    }
    
    public void agregarAdvertencia(String advertencia) {
        if (advertencia != null) {
            getAdvertencias().add(advertencia);
        }
    }

    @Override
    public String toString() {
        return "RespuestaOperacion{" +
                "exitoso=" + exitoso +
                ", mensaje='" + mensaje + '\'' +
                (codigoError != null ? ", codigoError='" + codigoError + '\'' : "") +
                (tipoError != null ? ", tipoError='" + tipoError + '\'' : "") +
                (datos != null ? ", datos=" + datos : "") +
                (advertencias != null ? ", advertencias=" + advertencias : "") +
                '}';
    }
}
