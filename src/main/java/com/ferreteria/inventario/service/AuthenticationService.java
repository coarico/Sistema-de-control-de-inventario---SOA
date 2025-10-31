package com.ferreteria.inventario.service;

import com.ferreteria.inventario.model.Usuario;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.commons.codec.digest.DigestUtils;

import java.util.HashMap;
import java.util.Map;

/**
 * Servicio de autenticación básica para el sistema de inventario
 * Implementa validación de credenciales y roles de usuario
 */
public class AuthenticationService {
    private static final Logger logger = LoggerFactory.getLogger(AuthenticationService.class);
    
    // Base de datos en memoria para usuarios (en producción usar BD real)
    private static final Map<String, Usuario> usuarios = new HashMap<>();
      static {
        // Inicializar usuarios por defecto con contraseñas seguras y únicas por rol
        // Contraseñas hasheadas con SHA-256 para mayor seguridad
        
        // ADMIN - Acceso completo al sistema
        usuarios.put("admin", new Usuario("admin", 
            DigestUtils.sha256Hex("FerretAdmin2024$"), "ADMIN"));
            
        // OPERADOR - Gestión de stock y consultas
        usuarios.put("operador", new Usuario("operador", 
            DigestUtils.sha256Hex("StockManager#789"), "OPERADOR"));
            
        // CONSULTA - Solo lectura
        usuarios.put("consulta", new Usuario("consulta", 
            DigestUtils.sha256Hex("ReadOnly@456"), "CONSULTA"));
            
        // Usuarios adicionales para mayor flexibilidad
        usuarios.put("supervisor", new Usuario("supervisor", 
            DigestUtils.sha256Hex("SuperVisor!321"), "OPERADOR"));
            
        usuarios.put("gerente", new Usuario("gerente", 
            DigestUtils.sha256Hex("Manager$2024"), "ADMIN"));
        
        logger.info("Servicio de autenticación inicializado con {} usuarios y contraseñas seguras", usuarios.size());
        logger.info("IMPORTANTE: Las contraseñas predeterminadas deben cambiarse en producción");
    }

    /**
     * Valida las credenciales de un usuario
     * @param username Nombre de usuario
     * @param password Contraseña en texto plano
     * @return Usuario válido o null si las credenciales son incorrectas
     */
    public Usuario validarCredenciales(String username, String password) {
        if (username == null || password == null) {
            logger.warn("Intento de autenticación con credenciales nulas");
            return null;
        }

        Usuario usuario = usuarios.get(username.toLowerCase());
        if (usuario == null) {
            logger.warn("Intento de autenticación con usuario inexistente: {}", username);
            return null;
        }

        if (!usuario.isActivo()) {
            logger.warn("Intento de autenticación con usuario inactivo: {}", username);
            return null;
        }

        String passwordHash = DigestUtils.sha256Hex(password);
        if (!usuario.getPassword().equals(passwordHash)) {
            logger.warn("Intento de autenticación con contraseña incorrecta para usuario: {}", username);
            return null;
        }

        logger.info("Autenticación exitosa para usuario: {} con rol: {}", username, usuario.getRol());
        return usuario;
    }

    /**
     * Verifica si un usuario tiene permisos para una operación específica
     * @param usuario Usuario autenticado
     * @param operacion Operación a realizar
     * @return true si tiene permisos, false en caso contrario
     */
    public boolean tienePermisos(Usuario usuario, String operacion) {
        if (usuario == null || operacion == null) {
            return false;
        }

        String rol = usuario.getRol();
        
        switch (operacion.toLowerCase()) {
            case "insertar":
            case "actualizar":
            case "eliminar":
                // Solo ADMIN puede modificar datos
                return "ADMIN".equals(rol);
                
            case "consultar":
            case "listar":
                // ADMIN, OPERADOR y CONSULTA pueden consultar
                return "ADMIN".equals(rol) || "OPERADOR".equals(rol) || "CONSULTA".equals(rol);
                
            default:
                logger.warn("Operación desconocida solicitada: {}", operacion);
                return false;
        }
    }

    /**
     * Obtiene información de un usuario por su nombre de usuario
     * @param username Nombre de usuario
     * @return Usuario o null si no existe
     */
    public Usuario obtenerUsuario(String username) {
        if (username == null) return null;
        return usuarios.get(username.toLowerCase());
    }

    /**
     * Lista los usuarios disponibles (solo username y rol, sin password)
     * @return Mapa con información básica de usuarios
     */
    public Map<String, String> listarUsuarios() {
        Map<String, String> usuariosInfo = new HashMap<>();
        usuarios.forEach((username, usuario) -> {
            if (usuario.isActivo()) {
                usuariosInfo.put(username, usuario.getRol());
            }
        });
        return usuariosInfo;
    }

    /**
     * Cambia la contraseña de un usuario
     * @param username Nombre de usuario
     * @param currentPassword Contraseña actual
     * @param newPassword Nueva contraseña
     * @return true si el cambio fue exitoso, false en caso contrario
     */
    public boolean cambiarContrasena(String username, String currentPassword, String newPassword) {
        if (username == null || currentPassword == null || newPassword == null) {
            logger.warn("Intento de cambio de contraseña con parámetros nulos");
            return false;
        }
        
        // Validar contraseña actual
        Usuario usuario = validarCredenciales(username, currentPassword);
        if (usuario == null) {
            logger.warn("Intento de cambio de contraseña con credenciales incorrectas para: {}", username);
            return false;
        }
        
        // Validar fortaleza de la nueva contraseña
        if (!esContrasenaSegura(newPassword)) {
            logger.warn("Intento de cambio a contraseña débil para usuario: {}", username);
            return false;
        }
        
        // Actualizar contraseña
        String newPasswordHash = DigestUtils.sha256Hex(newPassword);
        usuario.setPassword(newPasswordHash);
        
        logger.info("Contraseña cambiada exitosamente para usuario: {}", username);
        return true;
    }
    
    /**
     * Valida si una contraseña cumple con los criterios de seguridad
     * @param password Contraseña a validar
     * @return true si la contraseña es segura
     */
    public boolean esContrasenaSegura(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }
        
        // Criterios de seguridad:
        // - Al menos 8 caracteres
        // - Al menos una mayúscula
        // - Al menos una minúscula  
        // - Al menos un número
        // - Al menos un carácter especial
        
        boolean tieneMayuscula = password.matches(".*[A-Z].*");
        boolean tieneMinuscula = password.matches(".*[a-z].*");
        boolean tieneNumero = password.matches(".*\\d.*");
        boolean tieneEspecial = password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*");
        
        return tieneMayuscula && tieneMinuscula && tieneNumero && tieneEspecial;
    }
    
    /**
     * Genera los criterios de contraseña segura como texto
     * @return String con los criterios de seguridad
     */
    public String getCriteriosContrasenaSegura() {
        return "La contraseña debe tener:\n" +
               "- Mínimo 8 caracteres\n" +
               "- Al menos una mayúscula (A-Z)\n" +
               "- Al menos una minúscula (a-z)\n" +
               "- Al menos un número (0-9)\n" +
               "- Al menos un carácter especial (!@#$%^&*...)";
    }
    
    /**
     * Obtiene información de seguridad sobre las credenciales predeterminadas
     * @return Mapa con información de usuarios y sus roles
     */
    public Map<String, String> getInformacionCredenciales() {
        Map<String, String> info = new HashMap<>();
        
        info.put("IMPORTANTE", "Cambie las contraseñas predeterminadas en producción");
        info.put("admin", "Rol: ADMIN - Contraseña: FerretAdmin2024$");
        info.put("operador", "Rol: OPERADOR - Contraseña: StockManager#789");
        info.put("consulta", "Rol: CONSULTA - Contraseña: ReadOnly@456");
        info.put("supervisor", "Rol: OPERADOR - Contraseña: SuperVisor!321");
        info.put("gerente", "Rol: ADMIN - Contraseña: Manager$2024");
        
        return info;
    }
}
