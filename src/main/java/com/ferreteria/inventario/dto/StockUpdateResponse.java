package com.ferreteria.inventario.dto;

import com.ferreteria.inventario.model.Articulo;
import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;
import jakarta.xml.bind.annotation.XmlType;
import java.io.Serializable;

/**
 * DTO para respuestas de actualización de stock SOAP
 * Similar a ProveedorListResponse para mantener consistencia
 */
@XmlRootElement(name = "stockUpdateResponse", namespace = "http://ws.inventario.ferreteria.com/")
@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "stockUpdateResponse", propOrder = {
    "exitoso", 
    "mensaje", 
    "articulo",
    "stockAnterior",
    "stockNuevo"
})
public class StockUpdateResponse implements Serializable {
    private static final long serialVersionUID = 1L;
    
    @XmlElement(name = "exitoso", required = true)
    private boolean exitoso;
    
    @XmlElement(name = "mensaje")
    private String mensaje;
    
    @XmlElement(name = "articulo")
    private Articulo articulo;
    
    @XmlElement(name = "stockAnterior")
    private Integer stockAnterior;
    
    @XmlElement(name = "stockNuevo")
    private Integer stockNuevo;

    public StockUpdateResponse() {
        this.exitoso = false;
    }

    public StockUpdateResponse(boolean exitoso, String mensaje) {
        this.exitoso = exitoso;
        this.mensaje = mensaje;
    }

    public StockUpdateResponse(boolean exitoso, String mensaje, Articulo articulo, Integer stockAnterior, Integer stockNuevo) {
        this.exitoso = exitoso;
        this.mensaje = mensaje;
        this.articulo = articulo;
        this.stockAnterior = stockAnterior;
        this.stockNuevo = stockNuevo;
    }

    // Getters y setters
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

    public Articulo getArticulo() {
        return articulo;
    }

    public void setArticulo(Articulo articulo) {
        this.articulo = articulo;
    }

    public Integer getStockAnterior() {
        return stockAnterior;
    }

    public void setStockAnterior(Integer stockAnterior) {
        this.stockAnterior = stockAnterior;
    }

    public Integer getStockNuevo() {
        return stockNuevo;
    }

    public void setStockNuevo(Integer stockNuevo) {
        this.stockNuevo = stockNuevo;
    }
    
    @Override
    public String toString() {
        return "StockUpdateResponse{" +
               "exitoso=" + exitoso +
               ", mensaje='" + mensaje + '\'' +
               ", articulo=" + (articulo != null ? articulo.getCodigo() : "null") +
               ", stockAnterior=" + stockAnterior +
               ", stockNuevo=" + stockNuevo +
               '}';
    }
}
