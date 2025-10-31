package com.ferreteria.inventario.dto;

import java.math.BigDecimal;
import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;
import jakarta.xml.bind.annotation.XmlType;

/**
 * Data Transfer Object para el servicio SOAP de artículos
 * Simplifica la transferencia de datos y evita exponer la entidad completa
 */
@XmlRootElement(name = "articulo", namespace = "http://ws.inventario.ferreteria.com/")
@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "articuloType", propOrder = {
    "id", "codigo", "nombre", "descripcion", 
    "categoriaId", "categoriaNombre", 
    "proveedorId", "proveedorNombre",
    "precioCompra", "precioVenta", 
    "stockActual", "stockMinimo", 
    "activo", "fechaCreacion", "fechaActualizacion"
})
public class ArticuloDTO {
    @XmlElement(namespace = "http://ws.inventario.ferreteria.com/")
    private Integer id;
    
    @XmlElement(namespace = "http://ws.inventario.ferreteria.com/")
    private String codigo;
    
    @XmlElement(namespace = "http://ws.inventario.ferreteria.com/")
    private String nombre;
    
    @XmlElement(namespace = "http://ws.inventario.ferreteria.com/")
    private String descripcion;
    
    @XmlElement(namespace = "http://ws.inventario.ferreteria.com/")
    private Integer categoriaId;
    
    @XmlElement(namespace = "http://ws.inventario.ferreteria.com/")
    private String categoriaNombre;
    
    @XmlElement(namespace = "http://ws.inventario.ferreteria.com/")
    private Integer proveedorId;
    
    @XmlElement(namespace = "http://ws.inventario.ferreteria.com/")
    private String proveedorNombre;
    
    @XmlElement(namespace = "http://ws.inventario.ferreteria.com/")
    private BigDecimal precioCompra;
    
    @XmlElement(namespace = "http://ws.inventario.ferreteria.com/")
    private BigDecimal precioVenta;
    
    @XmlElement(namespace = "http://ws.inventario.ferreteria.com/")
    private Integer stockActual;
    
    @XmlElement(namespace = "http://ws.inventario.ferreteria.com/")
    private Integer stockMinimo;
    
    @XmlElement(namespace = "http://ws.inventario.ferreteria.com/")
    private Boolean activo;
    
    @XmlElement(namespace = "http://ws.inventario.ferreteria.com/")
    private String fechaCreacion;
    
    @XmlElement(namespace = "http://ws.inventario.ferreteria.com/")
    private String fechaActualizacion;

    // Constructor por defecto
    public ArticuloDTO() {}

    // Constructor para inserción (sin ID ni fechas)
    public ArticuloDTO(String codigo, String nombre, String descripcion, Integer categoriaId,
                      Integer proveedorId, BigDecimal precioCompra, BigDecimal precioVenta,
                      Integer stockActual, Integer stockMinimo) {
        this.codigo = codigo;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.categoriaId = categoriaId;
        this.proveedorId = proveedorId;
        this.precioCompra = precioCompra;
        this.precioVenta = precioVenta;
        this.stockActual = stockActual;
        this.stockMinimo = stockMinimo;
        this.activo = true;
    }

    // Getters y Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Integer getCategoriaId() {
        return categoriaId;
    }

    public void setCategoriaId(Integer categoriaId) {
        this.categoriaId = categoriaId;
    }

    public String getCategoriaNombre() {
        return categoriaNombre;
    }

    public void setCategoriaNombre(String categoriaNombre) {
        this.categoriaNombre = categoriaNombre;
    }

    public Integer getProveedorId() {
        return proveedorId;
    }

    public void setProveedorId(Integer proveedorId) {
        this.proveedorId = proveedorId;
    }

    public String getProveedorNombre() {
        return proveedorNombre;
    }

    public void setProveedorNombre(String proveedorNombre) {
        this.proveedorNombre = proveedorNombre;
    }

    public BigDecimal getPrecioCompra() {
        return precioCompra;
    }

    public void setPrecioCompra(BigDecimal precioCompra) {
        this.precioCompra = precioCompra;
    }

    public BigDecimal getPrecioVenta() {
        return precioVenta;
    }

    public void setPrecioVenta(BigDecimal precioVenta) {
        this.precioVenta = precioVenta;
    }

    public Integer getStockActual() {
        return stockActual;
    }

    public void setStockActual(Integer stockActual) {
        this.stockActual = stockActual;
    }

    public Integer getStockMinimo() {
        return stockMinimo;
    }

    public void setStockMinimo(Integer stockMinimo) {
        this.stockMinimo = stockMinimo;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public String getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(String fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public String getFechaActualizacion() {
        return fechaActualizacion;
    }

    public void setFechaActualizacion(String fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }

    @Override
    public String toString() {
        return "ArticuloDTO{" +
                "id=" + id +
                ", codigo='" + codigo + '\'' +
                ", nombre='" + nombre + '\'' +
                ", stockActual=" + stockActual +
                ", precioVenta=" + precioVenta +
                '}';
    }
}
