package com.ferreteria.inventario.model;

/**
 * Modelo de usuario para autenticación básica
 */
public class Usuario {
    private String username;
    private String password;
    private String rol;
    private boolean activo;

    public Usuario() {}

    public Usuario(String username, String password, String rol) {
        this.username = username;
        this.password = password;
        this.rol = rol;
        this.activo = true;
    }

    // Getters y Setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    @Override
    public String toString() {
        return "Usuario{" +
                "username='" + username + '\'' +
                ", rol='" + rol + '\'' +
                ", activo=" + activo +
                '}';
    }
}
