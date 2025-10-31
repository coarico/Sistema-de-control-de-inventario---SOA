package com.ferreteria.inventario.filter;

import com.ferreteria.inventario.model.Usuario;
import com.ferreteria.inventario.service.AuthenticationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Filtro de autenticación para los servicios SOAP
 * Implementa autenticación HTTP Basic para proteger las operaciones
 */
@WebFilter(filterName = "AuthenticationFilter", urlPatterns = {"/InventarioService/*"})
public class AuthenticationFilter implements Filter {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthenticationFilter.class);
    private AuthenticationService authService;
    
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        this.authService = new AuthenticationService();
        logger.info("Filtro de autenticación inicializado para servicios SOAP");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        // Permitir OPTIONS para CORS (si es necesario)
        if ("OPTIONS".equals(httpRequest.getMethod())) {
            chain.doFilter(request, response);
            return;
        }
        
        // Obtener la operación SOAP del cuerpo de la petición o URL
        String requestURI = httpRequest.getRequestURI();
        String soapAction = httpRequest.getHeader("SOAPAction");
        
        logger.debug("Filtrando petición: URI={}, SOAPAction={}", requestURI, soapAction);
        
        // Extraer credenciales del header Authorization
        String authHeader = httpRequest.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Basic ")) {
            logger.warn("Petición sin autenticación básica. URI: {}", requestURI);
            enviarErrorAutenticacion(httpResponse, "Autenticación requerida");
            return;
        }
        
        try {
            // Decodificar credenciales
            String base64Credentials = authHeader.substring("Basic ".length()).trim();
            byte[] credDecoded = Base64.getDecoder().decode(base64Credentials);
            String credentials = new String(credDecoded, StandardCharsets.UTF_8);
            
            final String[] values = credentials.split(":", 2);
            if (values.length != 2) {
                logger.warn("Formato de credenciales inválido");
                enviarErrorAutenticacion(httpResponse, "Formato de credenciales inválido");
                return;
            }
            
            String username = values[0];
            String password = values[1];
            
            // Validar credenciales
            Usuario usuario = authService.validarCredenciales(username, password);
            if (usuario == null) {
                logger.warn("Credenciales inválidas para usuario: {}", username);
                enviarErrorAutenticacion(httpResponse, "Credenciales inválidas");
                return;
            }
            
            // Determinar la operación solicitada
            String operacion = determinarOperacion(httpRequest, soapAction);
            
            // Verificar permisos
            if (!authService.tienePermisos(usuario, operacion)) {
                logger.warn("Usuario {} sin permisos para operación: {}", username, operacion);
                enviarErrorAutorizacion(httpResponse, 
                    "No tiene permisos para realizar esta operación: " + operacion);
                return;
            }
            
            // Agregar usuario al request para uso posterior
            httpRequest.setAttribute("usuario", usuario);
            httpRequest.setAttribute("operacion", operacion);
            
            logger.info("Acceso autorizado - Usuario: {}, Rol: {}, Operación: {}", 
                       username, usuario.getRol(), operacion);
            
            // Continuar con la cadena de filtros
            chain.doFilter(request, response);
            
        } catch (Exception e) {
            logger.error("Error durante la autenticación", e);
            enviarErrorAutenticacion(httpResponse, "Error interno de autenticación");
        }
    }
    
    /**
     * Determina qué operación se está intentando realizar
     */
    private String determinarOperacion(HttpServletRequest request, String soapAction) {
        // Intentar determinar desde SOAPAction header
        if (soapAction != null) {
            if (soapAction.contains("insertar") || soapAction.contains("Insertar")) {
                return "insertar";
            }
            if (soapAction.contains("actualizar") || soapAction.contains("Actualizar")) {
                return "actualizar";
            }
            if (soapAction.contains("consultar") || soapAction.contains("Consultar")) {
                return "consultar";
            }
            if (soapAction.contains("listar") || soapAction.contains("Listar")) {
                return "listar";
            }
        }
        
        // Si no se puede determinar desde SOAPAction, revisar el cuerpo de la petición
        // Por simplicidad, asumimos que necesita permisos de consulta por defecto
        logger.debug("No se pudo determinar operación específica, asumiendo 'consultar'");
        return "consultar";
    }
    
    /**
     * Envía error de autenticación (401)
     */
    private void enviarErrorAutenticacion(HttpServletResponse response, String mensaje) 
            throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setHeader("WWW-Authenticate", "Basic realm=\"Inventario Ferretería\"");
        response.setContentType("text/plain");
        response.getWriter().write(mensaje);
        logger.debug("Enviado error de autenticación: {}", mensaje);
    }
    
    /**
     * Envía error de autorización (403)
     */
    private void enviarErrorAutorizacion(HttpServletResponse response, String mensaje) 
            throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("text/plain");
        response.getWriter().write(mensaje);
        logger.debug("Enviado error de autorización: {}", mensaje);
    }

    @Override
    public void destroy() {
        logger.info("Filtro de autenticación destruido");
    }
}
