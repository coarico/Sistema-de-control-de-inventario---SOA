package com.ferreteria.inventario.model;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;
import jakarta.xml.bind.annotation.XmlType;
import jakarta.xml.bind.annotation.adapters.XmlJavaTypeAdapter;
import java.time.LocalDateTime;
import java.util.Objects;
import com.ferreteria.inventario.util.LocalDateTimeAdapter;

/**
 * Entidad que representa un proveedor de artículos
 */
@XmlRootElement(name = "proveedor", namespace = "http://ws.inventario.ferreteria.com/")
@XmlType(name = "proveedor", propOrder = {
    "id", 
    "nombre", 
    "contacto", 
    "telefono", 
    "email", 
    "direccion", 
    "fechaCreacion", 
    "fechaActualizacion"
})
@XmlAccessorType(XmlAccessType.FIELD)
public class Proveedor implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    @XmlElement(required = true, nillable = false)
    private Integer id;
    
    @XmlElement(required = true, nillable = false)
    private String nombre;
    
    @XmlElement(required = false)
    private String contacto;
    
    @XmlElement(required = false)
    private String telefono;
    
    @XmlElement(required = false)
    private String email;
    
    @XmlElement(required = false)
    private String direccion;
    
    @XmlElement(required = false)
    @XmlJavaTypeAdapter(LocalDateTimeAdapter.class)
    private LocalDateTime fechaCreacion;
    
    @XmlElement(required = false)
    @XmlJavaTypeAdapter(LocalDateTimeAdapter.class)
    private LocalDateTime fechaActualizacion;

    // Constructor por defecto
    public Proveedor() {}

    // Constructor con parámetros
    public Proveedor(String nombre, String contacto, String telefono, String email, String direccion) {
        this.nombre = nombre;
        this.contacto = contacto;
        this.telefono = telefono;
        this.email = email;
        this.direccion = direccion;
    }

    // Getters y Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getContacto() {
        return contacto;
    }

    public void setContacto(String contacto) {
        this.contacto = contacto;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }

    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Proveedor proveedor = (Proveedor) o;
        return Objects.equals(nombre, proveedor.nombre);
    }

    @Override
    public int hashCode() {
        return Objects.hash(nombre);
    }

    @Override
    public String toString() {
        return "Proveedor{" +
                "id=" + id +
                ", nombre='" + nombre + '\'' +
                ", contacto='" + contacto + '\'' +
                ", telefono='" + telefono + '\'' +
                ", email='" + email + '\'' +
                '}';
    }
}
