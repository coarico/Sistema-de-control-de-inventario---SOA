package com.ferreteria.inventario.dto;

import com.ferreteria.inventario.model.Proveedor;
import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlElementWrapper;
import jakarta.xml.bind.annotation.XmlRootElement;
import jakarta.xml.bind.annotation.XmlType;

import java.util.ArrayList;
import java.util.List;

/**
 * Clase de respuesta para listas de proveedores
 */
@XmlRootElement(name = "proveedorListResponse", namespace = "http://ws.inventario.ferreteria.com/")
@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "proveedorListResponse", propOrder = {
    "proveedores"
})
public class ProveedorListResponse {
    
    @XmlElementWrapper(name = "proveedores")
    @XmlElement(name = "proveedor", required = false)
    private List<Proveedor> proveedores;

    public ProveedorListResponse() {
        this.proveedores = new ArrayList<>();
    }

    public ProveedorListResponse(List<Proveedor> proveedores) {
        this.proveedores = proveedores != null ? new ArrayList<>(proveedores) : new ArrayList<>();
    }

    public List<Proveedor> getProveedores() {
        if (proveedores == null) {
            proveedores = new ArrayList<>();
        }
        return proveedores;
    }

    public void setProveedores(List<Proveedor> proveedores) {
        this.proveedores = proveedores != null ? new ArrayList<>(proveedores) : new ArrayList<>();
    }
    
    @Override
    public String toString() {
        return "ProveedorListResponse{" +
               "proveedores=" + (proveedores != null ? proveedores.size() : 0) + " items" +
               '}';
    }
}
