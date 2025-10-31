package com.ferreteria.inventario.dto;

import com.ferreteria.inventario.model.Categoria;
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
 * DTO para respuestas de lista de categorías SOAP
 * Similar a ProveedorListResponse para mantener consistencia
 */
@XmlRootElement(name = "categoriaListResponse", namespace = "http://ws.inventario.ferreteria.com/")
@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "categoriaListResponse", propOrder = {
    "categorias"
})
public class CategoriaListResponse implements Serializable {
    private static final long serialVersionUID = 1L;
    
    @XmlElementWrapper(name = "categorias")
    @XmlElement(name = "categoria", required = false)
    private List<Categoria> categorias;

    public CategoriaListResponse() {
        this.categorias = new ArrayList<>();
    }

    public CategoriaListResponse(List<Categoria> categorias) {
        this.categorias = categorias != null ? new ArrayList<>(categorias) : new ArrayList<>();
    }

    public List<Categoria> getCategorias() {
        if (categorias == null) {
            categorias = new ArrayList<>();
        }
        return categorias;
    }

    public void setCategorias(List<Categoria> categorias) {
        this.categorias = categorias != null ? new ArrayList<>(categorias) : new ArrayList<>();
    }
    
    @Override
    public String toString() {
        return "CategoriaListResponse{" +
               "categorias=" + (categorias != null ? categorias.size() : 0) + " items" +
               '}';
    }
}
