package com.ferreteria.inventario.dto;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlElementWrapper;
import jakarta.xml.bind.annotation.XmlRootElement;
import jakarta.xml.bind.annotation.XmlType;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO específico para respuestas de consulta de artículos SOAP
 * Evita problemas con tipos genéricos en JAXB
 */
@XmlRootElement(name = "consultarArticuloResponse", namespace = "http://ws.inventario.ferreteria.com/")
@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "consultarArticuloResponseType", propOrder = {
    "exitoso", 
    "mensaje", 
    "codigoError", 
    "tipoError", 
    "articulo",
    "advertencias"
})
public class ConsultarArticuloResponse implements Serializable {
    private static final long serialVersionUID = 1L;
    
    @XmlElement(name = "exitoso", required = true, namespace = "http://ws.inventario.ferreteria.com/")
    private boolean exitoso;
    
    @XmlElement(namespace = "http://ws.inventario.ferreteria.com/")
    private String mensaje;
    
    @XmlElement(name = "codigoError", namespace = "http://ws.inventario.ferreteria.com/")
    private String codigoError;
    
    @XmlElement(name = "tipoError", namespace = "http://ws.inventario.ferreteria.com/")
    private String tipoError;
    
    @XmlElement(name = "articulo", namespace = "http://ws.inventario.ferreteria.com/")
    private ArticuloDTO articulo;
    
    @XmlElementWrapper(name = "advertencias", namespace = "http://ws.inventario.ferreteria.com/")
    @XmlElement(name = "advertencia", namespace = "http://ws.inventario.ferreteria.com/")
    private List<String> advertencias;

    // Constructor por defecto requerido por JAXB
    public ConsultarArticuloResponse() {
        this.advertencias = new ArrayList<>();
    }

    // Constructor para respuesta exitosa
    public ConsultarArticuloResponse(String mensaje, ArticuloDTO articulo) {
        this();
        this.exitoso = true;
        this.mensaje = mensaje;
        this.articulo = articulo;
    }

    // Constructor para respuesta de error
    public ConsultarArticuloResponse(String mensaje, String codigoError, String tipoError) {
        this();
        this.exitoso = false;
        this.mensaje = mensaje;
        this.codigoError = codigoError;
        this.tipoError = tipoError;
    }

    // Métodos estáticos para crear respuestas
    public static ConsultarArticuloResponse exito(String mensaje, ArticuloDTO articulo) {
        return new ConsultarArticuloResponse(mensaje, articulo);
    }

    public static ConsultarArticuloResponse error(String mensaje, String codigoError, String tipoError) {
        return new ConsultarArticuloResponse(mensaje, codigoError, tipoError);
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
        return "ConsultarArticuloResponse{" +
                "exitoso=" + exitoso +
                ", mensaje='" + mensaje + '\'' +
                (codigoError != null ? ", codigoError='" + codigoError + '\'' : "") +
                (tipoError != null ? ", tipoError='" + tipoError + '\'' : "") +
                (articulo != null ? ", articulo=" + articulo : "") +
                (advertencias != null ? ", advertencias=" + advertencias : "") +
                '}';
    }
}
